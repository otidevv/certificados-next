import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { validatePassword } from "@/lib/password-policy";
import { sendPasswordChangedNotification } from "@/lib/email";

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`reset:${ip}`, 10, 15 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Demasiados intentos. Espera ${rl.retryAfter}s.` },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
      );
    }

    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token y contraseña son requeridos" }, { status: 400 });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

    if (!resetToken) {
      return NextResponse.json({ error: "El enlace no es válido o ya fue utilizado" }, { status: 400 });
    }

    if (new Date() > resetToken.expiresAt) {
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      return NextResponse.json({ error: "El enlace ha expirado. Solicita uno nuevo." }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);

    const updated = await prisma.user.update({
      where: { email: resetToken.email },
      data: { password: hashed, passwordChangedAt: new Date() },
      select: { email: true },
    });

    // Eliminar el token usado y cualquier otro token pendiente del mismo email
    await prisma.passwordResetToken.deleteMany({ where: { email: resetToken.email } });

    // Notify the user out-of-band. Failures must not break the flow.
    sendPasswordChangedNotification(updated.email).catch((err) => {
      console.error('Failed to send password-changed email:', err);
    });

    return NextResponse.json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("Error en reset-password:", error);
    return NextResponse.json({ error: "Error al restablecer la contraseña" }, { status: 500 });
  }
}
