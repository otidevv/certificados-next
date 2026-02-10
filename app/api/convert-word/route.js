import { NextResponse } from 'next/server';
import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const TEMP_DIR = path.join(process.cwd(), 'tmp-conversions');

async function ensureTempDir() {
  if (!existsSync(TEMP_DIR)) {
    await mkdir(TEMP_DIR, { recursive: true });
  }
}

async function cleanFile(filePath) {
  try {
    if (existsSync(filePath)) await unlink(filePath);
  } catch {}
}

export async function POST(request) {
  const timestamp = Date.now();
  let inputPath = '';
  let outputPath = '';

  try {
    await ensureTempDir();

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const baseName = originalName.replace(/\.docx?$/i, '');
    inputPath = path.join(TEMP_DIR, `${timestamp}_${originalName}`);
    outputPath = path.join(TEMP_DIR, `${timestamp}_${baseName}.pdf`);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(inputPath, buffer);

    const pythonScript = `
import sys
from docx2pdf import convert
convert(r"${inputPath.replace(/\\/g, '\\\\')}", r"${outputPath.replace(/\\/g, '\\\\')}")
    `.trim();

    await execAsync(`python -c "${pythonScript.replace(/"/g, '\\"').replace(/\n/g, ';')}"`, {
      timeout: 60000,
    });

    if (!existsSync(outputPath)) {
      throw new Error('La conversión no generó el archivo PDF');
    }

    const pdfBuffer = await readFile(outputPath);

    // Limpiar archivos temporales
    await cleanFile(inputPath);
    await cleanFile(outputPath);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${baseName}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error en conversión:', error);
    await cleanFile(inputPath);
    await cleanFile(outputPath);
    return NextResponse.json(
      { error: error.message || 'Error al convertir el archivo' },
      { status: 500 }
    );
  }
}
