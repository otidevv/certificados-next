import * as XLSX from 'xlsx';

export const DNI_HEADERS = ['DNI', 'N° DOC', 'DOCUMENTO', 'NRO DOC', 'NUM DOC', 'N° DOCUMENTO', 'NRO DOCUMENTO'];
export const REGIMEN_HEADERS = ['REGIMEN LABORAL', 'RÉGIMEN LABORAL', 'REGIMEN', 'RÉGIMEN', 'REG. LABORAL', 'REG LABORAL'];
export const CONDICION_HEADERS = ['CONDICION', 'CONDICIÓN', 'CONDICION LABORAL', 'CONDICIÓN LABORAL'];

// Las planillas varían entre meses en tildes, mayúsculas, espacios dobles y
// puntos finales, así que se comparan las cabeceras ya normalizadas.
export function normalizeHeader(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/\.+$/, '')
    .trim();
}

function findHeaderColumn(row, headers) {
  const wanted = headers.map(normalizeHeader);
  for (let col = 0; col < row.length; col++) {
    if (wanted.includes(normalizeHeader(row[col]))) return col;
  }
  return -1;
}

function readCell(row, colIndex) {
  if (colIndex < 0) return null;
  const value = String(row?.[colIndex] ?? '').trim().replace(/\s+/g, ' ');
  return value || null;
}

export function extractRowsFromWorkbook(workbook) {
  let bestMatch = null;

  for (const sheetName of workbook.SheetNames) {
    if (bestMatch) break;
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (jsonData.length < 2) continue;

    for (let headerRowIdx = 0; headerRowIdx < Math.min(30, jsonData.length); headerRowIdx++) {
      if (bestMatch) break;
      const row = jsonData[headerRowIdx];
      if (!row || row.length === 0) continue;

      const dniColIndex = findHeaderColumn(row, DNI_HEADERS);
      if (dniColIndex < 0) continue;

      // Régimen y condición son opcionales: si el Excel no las trae, se
      // registran como null y el organizador sigue funcionando igual.
      const regimenColIndex = findHeaderColumn(row, REGIMEN_HEADERS);
      const condicionColIndex = findHeaderColumn(row, CONDICION_HEADERS);

      const candidateDnis = [];
      const candidateRows = [];
      for (let r = headerRowIdx + 1; r < jsonData.length; r++) {
        const val = jsonData[r]?.[dniColIndex];
        const strVal = String(val ?? '').trim();
        if (!strVal || strVal.length === 0 || /^TOTAL/i.test(strVal) || /^BAJA/i.test(strVal)) break;
        const cleanVal = strVal.replace(/[^0-9]/g, '');
        if (cleanVal.length >= 6 && cleanVal.length <= 12) {
          // candidateRows se llena en el mismo paso que candidateDnis para que
          // rows[i] y dnis[i] sigan apuntando a la misma persona, que es lo que
          // empareja cada página del PDF con su DNI.
          candidateDnis.push(cleanVal);
          candidateRows.push({
            documentNumber: cleanVal,
            regimenLaboral: readCell(jsonData[r], regimenColIndex),
            condicion: readCell(jsonData[r], condicionColIndex),
          });
        }
      }

      if (candidateDnis.length > 0 && (!bestMatch || candidateDnis.length > bestMatch.dnis.length)) {
        bestMatch = {
          sheet: sheetName,
          column: String(row[dniColIndex]),
          dnis: candidateDnis,
          rows: candidateRows,
          regimenColumn: regimenColIndex >= 0 ? String(row[regimenColIndex]).trim() : null,
          condicionColumn: condicionColIndex >= 0 ? String(row[condicionColIndex]).trim() : null,
        };
      }
    }
  }

  return bestMatch;
}

export async function extractRowsFromExcelFile(file) {
  const data = await file.arrayBuffer();
  return extractRowsFromWorkbook(XLSX.read(data));
}
