import prisma from './prisma';

export const MAX_ROWS = 20000;
// Upserts van en tandas para no pasarse del timeout de una sola transacción
// cuando una planilla trae varios cientos de personas.
const CHUNK_SIZE = 50;

function clean(value, maxLength = 120) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().replace(/\s+/g, ' ');
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

export async function saveRegistrosMensuales(payload) {
  const year = Number(payload?.year);
  const month = Number(payload?.month);
  const correlativo = clean(payload?.correlativo, 40);
  const rows = Array.isArray(payload?.rows) ? payload.rows : [];

  if (!Number.isInteger(year) || year < 2000 || year > 2100) return { error: 'Año inválido' };
  if (!Number.isInteger(month) || month < 1 || month > 12) return { error: 'Mes inválido' };
  if (rows.length === 0) return { error: 'No hay registros para guardar' };
  if (rows.length > MAX_ROWS) return { error: `Demasiados registros (máximo ${MAX_ROWS})` };

  // Si un DNI se repite dentro del mismo lote, gana la última aparición.
  const byDocument = new Map();
  for (const row of rows) {
    const documentNumber = String(row?.documentNumber ?? '').replace(/[^0-9]/g, '');
    if (documentNumber.length < 6 || documentNumber.length > 12) continue;
    byDocument.set(documentNumber, {
      documentNumber,
      year,
      month,
      regimenLaboral: clean(row?.regimenLaboral),
      condicion: clean(row?.condicion),
      correlativo,
      sourceFile: clean(row?.sourceFile, 260),
    });
  }

  const records = [...byDocument.values()];
  if (records.length === 0) return { error: 'Ningún registro tenía un número de documento válido' };

  for (let i = 0; i < records.length; i += CHUNK_SIZE) {
    const chunk = records.slice(i, i + CHUNK_SIZE);
    await prisma.$transaction(
      chunk.map((record) =>
        prisma.registroMensual.upsert({
          where: {
            documentNumber_year_month: {
              documentNumber: record.documentNumber,
              year,
              month,
            },
          },
          create: record,
          update: {
            regimenLaboral: record.regimenLaboral,
            condicion: record.condicion,
            correlativo: record.correlativo,
            sourceFile: record.sourceFile,
          },
        }),
      ),
      { timeout: 30000 },
    );
  }

  return { success: true, count: records.length, skipped: rows.length - records.length };
}
