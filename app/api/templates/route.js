import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Listar plantillas del usuario
export async function GET(request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const templates = await prisma.template.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        canvasWidth: true,
        canvasHeight: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error al obtener plantillas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva plantilla
export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      backgroundData,
      fieldsPage1,
      fieldsPage2,
      excelHeaders,
      canvasWidth,
      canvasHeight,
    } = body;

    // Validaciones
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'El nombre de la plantilla es requerido' },
        { status: 400 }
      );
    }

    if (!backgroundData) {
      return NextResponse.json(
        { error: 'Los datos del fondo son requeridos' },
        { status: 400 }
      );
    }

    const template = await prisma.template.create({
      data: {
        userId: user.id,
        name: name.trim(),
        backgroundData: backgroundData,
        fieldsPage1: fieldsPage1 || [],
        fieldsPage2: fieldsPage2 || [],
        excelHeaders: excelHeaders || [],
        canvasWidth: canvasWidth || 2000,
        canvasHeight: canvasHeight || 1414,
      },
    });

    return NextResponse.json(
      {
        message: 'Plantilla creada exitosamente',
        template: {
          id: template.id,
          name: template.name,
          createdAt: template.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al crear plantilla:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
