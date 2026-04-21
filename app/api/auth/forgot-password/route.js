import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email) {
      return NextResponse.json({ error: "El correo es requerido" }, { status: 400 });
    }

    // Rate-limit per email (prevents email flooding) and per IP (prevents enumeration sweeps).
    const rlEmail = rateLimit(`forgot:email:${email}`, 3, 15 * 60 * 1000);
    const rlIp = rateLimit(`forgot:ip:${ip}`, 10, 15 * 60 * 1000);
    if (!rlEmail.ok || !rlIp.ok) {
      const retryAfter = Math.max(rlEmail.retryAfter, rlIp.retryAfter);
      return NextResponse.json(
        { error: `Demasiadas solicitudes. Espera ${retryAfter}s antes de volver a intentar.` },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } },
      );
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    // Siempre responder con éxito para no revelar si el email existe
    if (!user) {
      return NextResponse.json({ message: "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña." });
    }

    // Eliminar tokens previos de este email
    await prisma.passwordResetToken.deleteMany({ where: { email } });

    // Generar token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await prisma.passwordResetToken.create({
      data: { email, token, expiresAt },
    });

    await sendPasswordResetEmail(email, token);

    return NextResponse.json({ message: "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña." });
  } catch (error) {
    console.error("Error en forgot-password:", error);
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 });
  }
}
