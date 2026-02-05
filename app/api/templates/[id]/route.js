import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Obtener plantilla por ID
export async function GET(request, { params }) {
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

    const { id } = await params;

    const template = await prisma.template.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error al obtener plantilla:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar plantilla
export async function PUT(request, { params }) {
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

    const { id } = await params;

    // Verificar que la plantilla pertenece al usuario
    const existingTemplate = await prisma.template.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
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

    const updatedTemplate = await prisma.template.update({
      where: { id: id },
      data: {
        name: name?.trim() || existingTemplate.name,
        backgroundData: backgroundData || existingTemplate.backgroundData,
        fieldsPage1: fieldsPage1 ?? existingTemplate.fieldsPage1,
        fieldsPage2: fieldsPage2 ?? existingTemplate.fieldsPage2,
        excelHeaders: excelHeaders ?? existingTemplate.excelHeaders,
        canvasWidth: canvasWidth || existingTemplate.canvasWidth,
        canvasHeight: canvasHeight || existingTemplate.canvasHeight,
      },
    });

    return NextResponse.json({
      message: 'Plantilla actualizada exitosamente',
      template: {
        id: updatedTemplate.id,
        name: updatedTemplate.name,
        updatedAt: updatedTemplate.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error al actualizar plantilla:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar plantilla
export async function DELETE(request, { params }) {
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

    const { id } = await params;

    // Verificar que la plantilla pertenece al usuario
    const existingTemplate = await prisma.template.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      );
    }

    await prisma.template.delete({
      where: { id: id },
    });

    return NextResponse.json({
      message: 'Plantilla eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar plantilla:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
