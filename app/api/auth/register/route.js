import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { validatePassword } from '@/lib/password-policy';

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`register:${ip}`, 5, 15 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Demasiados intentos. Vuelve a intentarlo en ${rl.retryAfter}s.` },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
      );
    }

    const body = await request.json();
    const documentType = body.documentType;
    const documentNumber = typeof body.documentNumber === 'string' ? body.documentNumber.trim() : '';
    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
    const paternalSurname = typeof body.paternalSurname === 'string' ? body.paternalSurname.trim() : '';
    const maternalSurname = typeof body.maternalSurname === 'string' ? body.maternalSurname.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const courseId = body.courseId;

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

    // Validar contraseña contra la política compartida
    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    // Verificar si el email (case-insensitive) o documento ya existe
    const existingByEmail = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existingByEmail) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 });
    }

    const existingByDoc = await prisma.user.findFirst({
      where: { documentNumber },
      select: { id: true },
    });
    if (existingByDoc) {
      return NextResponse.json({ error: 'El número de documento ya está registrado' }, { status: 400 });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Nombre completo calculado
    const name = `${firstName} ${paternalSurname} ${maternalSurname}`;

    // Crear usuario (email ya normalizado a lowercase)
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

    // Auto-inscribir al curso si se proporcionó courseId
    let enrolled = false;
    if (courseId) {
      try {
        const course = await prisma.course.findUnique({
          where: { id: courseId },
          include: { _count: { select: { enrollments: true } } },
        });
        if (course && course.status === 'ABIERTO' && (!course.spots || course._count.enrollments < course.spots)) {
          await prisma.enrollment.create({
            data: {
              courseId,
              userId: user.id,
              documentType,
              documentNumber,
              firstName,
              paternalSurname,
              maternalSurname,
              email,
            },
          });
          enrolled = true;
        }
      } catch {
        // Si falla la inscripción, no bloquear el registro
      }
    }

    return NextResponse.json(
      {
        message: enrolled ? 'Cuenta creada e inscrito exitosamente' : 'Usuario creado exitosamente',
        user: { id: user.id, email: user.email, name: user.name },
        enrolled,
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
