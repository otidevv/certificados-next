import { NextResponse } from 'next/server';
import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const TEMP_DIR = path.join(process.cwd(), 'tmp-conversions');

const LIBREOFFICE_PATHS = [
  'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
  'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
];

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

function findLibreOffice() {
  for (const p of LIBREOFFICE_PATHS) {
    if (existsSync(p)) return p;
  }
  return null;
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

    const soffice = findLibreOffice();
    if (!soffice) {
      throw new Error('LibreOffice no encontrado. Instálalo desde https://www.libreoffice.org/download/');
    }

    const cmd = `"${soffice}" --headless --norestore --nolockcheck --convert-to pdf --outdir "${TEMP_DIR}" "${inputPath}"`;
    console.log('Ejecutando:', cmd);

    const { stdout, stderr } = await execAsync(cmd, { timeout: 120000 });
    console.log('stdout:', stdout);
    if (stderr) console.log('stderr:', stderr);

    if (!existsSync(outputPath)) {
      throw new Error(`LibreOffice no generó el PDF. stdout: ${stdout}, stderr: ${stderr || 'ninguno'}`);
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
