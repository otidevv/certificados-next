import { NextResponse } from 'next/server';
import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import JSZip from 'jszip';

const execAsync = promisify(exec);

const TEMP_DIR = path.join(process.cwd(), 'tmp-conversions');

const LIBREOFFICE_PATHS = [
  'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
  'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
];

// Cuántos Words van por invocación de LibreOffice. Un solo arranque cubre todo
// el lote hasta este tope; por encima se parte en tandas para no exceder el
// límite de longitud de la línea de comandos ni el timeout.
const CHUNK = 30;

async function ensureTempDir() {
  if (!existsSync(TEMP_DIR)) await mkdir(TEMP_DIR, { recursive: true });
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
  const inputPaths = [];
  const outputPaths = [];

  try {
    await ensureTempDir();

    const formData = await request.formData();
    const files = formData.getAll('file');

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No se enviaron archivos' }, { status: 400 });
    }

    const soffice = findLibreOffice();
    if (!soffice) {
      throw new Error('LibreOffice no encontrado. Instálalo desde https://www.libreoffice.org/download/');
    }

    // Nombres por índice: el orden se preserva y no dependemos del nombre
    // original (evita choques y problemas de sanitización).
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = /\.doc$/i.test(file.name) ? 'doc' : 'docx';
      const inputPath = path.join(TEMP_DIR, `${timestamp}_${i}.${ext}`);
      const outputPath = path.join(TEMP_DIR, `${timestamp}_${i}.pdf`);
      inputPaths.push(inputPath);
      outputPaths.push(outputPath);
      await writeFile(inputPath, Buffer.from(await file.arrayBuffer()));
    }

    // Una sola llamada a LibreOffice por tanda → un arranque en vez de N.
    const startedAt = Date.now();
    for (let start = 0; start < inputPaths.length; start += CHUNK) {
      const chunk = inputPaths.slice(start, start + CHUNK);
      const inputArgs = chunk.map((p) => `"${p}"`).join(' ');
      const cmd = `"${soffice}" --headless --norestore --nolockcheck --convert-to pdf --outdir "${TEMP_DIR}" ${inputArgs}`;
      await execAsync(cmd, { timeout: 300000 });
    }
    const convMs = Date.now() - startedAt;

    // Cada PDF se empaqueta con la clave "<índice>.pdf" para que el cliente lo
    // mapee a su archivo. Un Word que falló simplemente no genera salida y su
    // entrada no se incluye (el cliente lo marca como error).
    const zip = new JSZip();
    let ok = 0;
    for (let i = 0; i < outputPaths.length; i++) {
      if (existsSync(outputPaths[i])) {
        zip.file(`${i}.pdf`, await readFile(outputPaths[i]));
        ok++;
      }
    }
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    console.log(`convert-word-batch: ${ok}/${files.length} PDFs en ${convMs}ms (${Math.round(convMs / files.length)}ms/archivo)`);

    for (const p of [...inputPaths, ...outputPaths]) await cleanFile(p);

    return new NextResponse(zipBuffer, {
      headers: { 'Content-Type': 'application/zip' },
    });
  } catch (error) {
    console.error('Error en conversión batch:', error);
    for (const p of [...inputPaths, ...outputPaths]) await cleanFile(p);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
