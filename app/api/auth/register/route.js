import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const { documentType, documentNumber, firstName, paternalSurname, maternalSurname, email, password } = await request.json();

    // Validar campos requeridos
    if (!documentType || !documentNumber || !firstName || !paternalSurname || !maternalSurname || !email || !password) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Validar tipo de documento
    if (!['DNI', 'CE', 'PASAPORTE'].includes(documentType)) {
      return NextResponse.json(
        { error: 'Tipo de documento no válido' },
        { status: 400 }
      );
    }

    // Validar número de documento según tipo
    if (documentType === 'DNI' && !/^\d{8}$/.test(documentNumber)) {
      return NextResponse.json(
        { error: 'DNI debe tener exactamente 8 dígitos' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Verificar si el email o documento ya existe
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { documentNumber },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 });
      }
      return NextResponse.json({ error: 'El número de documento ya está registrado' }, { status: 400 });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Nombre completo calculado
    const name = `${firstName} ${paternalSurname} ${maternalSurname}`;

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        documentType,
        documentNumber,
        firstName,
        paternalSurname,
        maternalSurname,
      },
    });

    return NextResponse.json(
      {
        message: 'Usuario creado exitosamente',
        user: { id: user.id, email: user.email, name: user.name },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
