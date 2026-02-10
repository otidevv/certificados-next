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

// Busca LibreOffice en rutas comunes de Windows y Linux
async function findLibreOffice() {
  const candidates = [
    'soffice',
    'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
    'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
    '/usr/bin/soffice',
    '/usr/bin/libreoffice',
  ];
  for (const cmd of candidates) {
    try {
      await execAsync(`"${cmd}" --version`, { timeout: 5000 });
      return cmd;
    } catch {}
  }
  return null;
}

async function findPython() {
  const candidates = ['python', 'python3', 'py'];
  for (const cmd of candidates) {
    try {
      await execAsync(`${cmd} --version`, { timeout: 5000 });
      return cmd;
    } catch {}
  }
  return null;
}

// Método 1: LibreOffice (gratuito, no necesita Word)
async function convertWithLibreOffice(soffice, inputPath, outputDir) {
  await execAsync(`"${soffice}" --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`, {
    timeout: 120000,
  });
}

// Método 2: Python docx2pdf (necesita Microsoft Word)
async function convertWithDocx2pdf(pythonCmd, inputPath, outputPath) {
  const escapedInput = inputPath.replace(/\\/g, '\\\\');
  const escapedOutput = outputPath.replace(/\\/g, '\\\\');
  const script = `from docx2pdf import convert; convert(r\\"${escapedInput}\\", r\\"${escapedOutput}\\")`;
  await execAsync(`${pythonCmd} -c "${script}"`, { timeout: 120000 });
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

    let converted = false;

    // Intentar con LibreOffice primero (no necesita Word)
    const soffice = await findLibreOffice();
    if (soffice) {
      try {
        await convertWithLibreOffice(soffice, inputPath, TEMP_DIR);
        // LibreOffice genera el PDF con el nombre original (sin timestamp prefix a veces)
        // Buscar el PDF generado
        const libreOutputName = `${timestamp}_${baseName}.pdf`;
        const libreOutputPath = path.join(TEMP_DIR, libreOutputName);
        if (existsSync(libreOutputPath)) {
          outputPath = libreOutputPath;
          converted = true;
        }
      } catch (e) {
        console.warn('LibreOffice falló, intentando con docx2pdf...', e.message);
      }
    }

    // Si LibreOffice no funcionó, intentar con Python + docx2pdf (necesita Word)
    if (!converted) {
      const pythonCmd = await findPython();
      if (pythonCmd) {
        try {
          await convertWithDocx2pdf(pythonCmd, inputPath, outputPath);
          if (existsSync(outputPath)) {
            converted = true;
          }
        } catch (e) {
          console.warn('docx2pdf falló:', e.message);
        }
      }
    }

    if (!converted || !existsSync(outputPath)) {
      throw new Error(
        'No se pudo convertir. Se necesita LibreOffice o Microsoft Word instalado en el servidor. ' +
        'Instala LibreOffice (gratis): https://www.libreoffice.org/download/ ' +
        'o instala docx2pdf: pip install docx2pdf (requiere Word).'
      );
    }

    const pdfBuffer = await readFile(outputPath);

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
