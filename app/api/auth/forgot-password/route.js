import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "El correo es requerido" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

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
