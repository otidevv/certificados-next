'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { Upload, Download, Home, FileCheck, FolderOpen, FileText, ArrowLeft, ChevronRight, Plus, Trash2, Loader2, GripVertical } from 'lucide-react';
import Swal from 'sweetalert2';
import toast, { Toaster } from 'react-hot-toast';
import * as XLSX from 'xlsx';

const TOOLS = [
  {
    id: 'optimize',
    title: 'Adaptar PDFs a formato compatible',
    description: 'Re-procesa los PDFs para que sean compatibles con cualquier sistema. Sube un ZIP con PDFs y descarga la versión optimizada.',
    icon: FileCheck,
    gradient: 'from-purple-600 to-purple-700',
    bgLight: 'bg-purple-50',
    textColor: 'text-purple-700',
    iconColor: 'text-purple-600',
  },
  {
    id: 'organize',
    title: 'Organizador de PDFs en Carpetas',
    description: 'Sube un Excel con DNIs y un Word o PDF. Detecta los DNIs automáticamente, convierte Word a PDF si es necesario, y organiza todo en carpetas de 50.',
    icon: FolderOpen,
    gradient: 'from-violet-600 to-violet-700',
    bgLight: 'bg-violet-50',
    textColor: 'text-violet-700',
    iconColor: 'text-violet-600',
  },
  {
    id: 'word-to-pdf',
    title: 'Convertir Word a PDF',
    description: 'Sube uno o varios archivos Word (.docx) y conviértelos a PDF de forma rápida. Descarga todos los PDFs en un ZIP.',
    icon: FileText,
    gradient: 'from-indigo-600 to-indigo-700',
    bgLight: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    iconColor: 'text-indigo-600',
  },
];

function Herramientas() {
  const [activeTool, setActiveTool] = useState(null);

  // Tool 1: Optimize PDFs
  const [zipFile, setZipFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalPDFs, setTotalPDFs] = useState(0);
  const zipInputRef = useRef(null);

  // Tool 2: Organize PDFs - subida masiva con reordenamiento
  const [correlativo, setCorrelativo] = useState('');
  const [excelInfos, setExcelInfos] = useState([]); // { file, dnis, sheetName, processing }
  const [docInfos, setDocInfos] = useState([]); // { file, pageCount, pdfBytes, processing }
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [organizeProgress, setOrganizeProgress] = useState(0);
  const [organizeTotalPDFs, setOrganizeTotalPDFs] = useState(0);
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const excelInputRef = useRef(null);
  const docInputRef = useRef(null);

  // Tool 3: Word to PDF
  const [wordFiles, setWordFiles] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const [convertProgress, setConvertProgress] = useState(0);
  const [convertTotal, setConvertTotal] = useState(0);
  const wordInputRef = useRef(null);

  // ─── Tool 1: Optimize PDFs ───
  const handleOptimizePDFs = async () => {
    if (!zipFile) {
      await Swal.fire({ title: 'No hay archivo', text: 'Por favor selecciona un archivo ZIP primero', icon: 'warning', confirmButtonColor: '#9333ea', confirmButtonText: 'Entendido' });
      return;
    }
    try {
      setIsProcessing(true);
      setProgress(0);
      let pdfFilesData = [];
      const zipData = await zipFile.arrayBuffer();
      const zip = await JSZip.loadAsync(zipData);
      const pdfEntries = Object.keys(zip.files).filter(fileName => {
        const file = zip.files[fileName];
        return fileName.toLowerCase().endsWith('.pdf') && !file.dir;
      });
      const nestedArchives = Object.keys(zip.files).filter(fileName =>
        fileName.toLowerCase().endsWith('.rar') || (fileName.toLowerCase().endsWith('.zip') && fileName !== zipFile.name)
      );
      if (nestedArchives.length > 0 && pdfEntries.length === 0) {
        await Swal.fire({
          title: 'Archivos comprimidos anidados detectados',
          html: `<div style="text-align: left;"><p style="margin-bottom: 12px;">Se encontraron archivos comprimidos dentro del ZIP:</p><ul style="margin-left: 20px; margin-bottom: 12px; color: #dc2626; font-weight: 600;">${nestedArchives.map(name => `<li>${name}</li>`).join('')}</ul><p style="margin-bottom: 12px;">Por favor, <strong>extrae el contenido</strong> de estos archivos y vuelve a comprimir los PDFs <strong>directamente en un ZIP</strong>.</p></div>`,
          icon: 'warning', confirmButtonColor: '#9333ea', confirmButtonText: 'Entendido', width: '600px'
        });
        setIsProcessing(false);
        return;
      }
      for (const fileName of pdfEntries) {
        try {
          const pdfBytes = await zip.files[fileName].async('arraybuffer');
          const baseName = fileName.split('/').pop().split('\\').pop();
          pdfFilesData.push({ name: baseName, data: pdfBytes, originalPath: fileName });
        } catch (extractError) {
          console.error(`Error al extraer ${fileName}:`, extractError);
        }
      }
      if (pdfFilesData.length === 0) throw new Error('No se encontraron archivos PDF en el archivo');
      setTotalPDFs(pdfFilesData.length);
      const optimizedZip = new JSZip();
      for (let i = 0; i < pdfFilesData.length; i++) {
        const pdfFileData = pdfFilesData[i];
        try {
          const pdfDoc = await PDFDocument.load(pdfFileData.data);
          const optimizedBytes = await pdfDoc.save({ useObjectStreams: false, addDefaultPage: false, objectsPerTick: 50 });
          optimizedZip.file(pdfFileData.name, optimizedBytes);
          setProgress(i + 1);
        } catch (error) {
          console.error(`Error al optimizar ${pdfFileData.name}:`, error);
          optimizedZip.file(pdfFileData.name, pdfFileData.data);
        }
      }
      const optimizedZipBlob = await optimizedZip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      const url = URL.createObjectURL(optimizedZipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'certificados_optimizados.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsProcessing(false);
      setZipFile(null);
      setProgress(0);
      setTotalPDFs(0);
      if (zipInputRef.current) zipInputRef.current.value = '';
      toast.success(`¡${pdfFilesData.length} PDFs optimizados exitosamente!`, { duration: 4000 });
    } catch (error) {
      console.error('Error al optimizar PDFs:', error);
      setIsProcessing(false);
      await Swal.fire({ title: 'Error al optimizar', text: error.message, icon: 'error', confirmButtonColor: '#9333ea', confirmButtonText: 'Entendido' });
    }
  };

  // ─── Tool 2: Organize PDFs ───
  const DNI_HEADERS = ['DNI', 'N° DOC', 'DOCUMENTO', 'NRO DOC', 'NUM DOC', 'N° DOCUMENTO', 'NRO DOCUMENTO'];

  const extractDnisFromExcel = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
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

        let dniColIndex = -1;
        for (let col = 0; col < row.length; col++) {
          const cellVal = String(row[col] ?? '').trim().toUpperCase();
          if (DNI_HEADERS.includes(cellVal)) { dniColIndex = col; break; }
        }
        if (dniColIndex < 0) continue;

        const candidateDnis = [];
        for (let r = headerRowIdx + 1; r < jsonData.length; r++) {
          const val = jsonData[r]?.[dniColIndex];
          const strVal = String(val ?? '').trim();
          if (!strVal || strVal.length === 0 || /^TOTAL/i.test(strVal) || /^BAJA/i.test(strVal)) break;
          const cleanVal = strVal.replace(/[^0-9]/g, '');
          if (cleanVal.length >= 6 && cleanVal.length <= 12) candidateDnis.push(cleanVal);
        }

        if (candidateDnis.length > 0 && (!bestMatch || candidateDnis.length > bestMatch.dnis.length)) {
          bestMatch = { sheet: sheetName, column: String(row[dniColIndex]), dnis: candidateDnis };
        }
      }
    }
    return bestMatch;
  };

  const getPageCount = async (file) => {
    const isWord = file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc');
    let pdfBytes;
    if (isWord) {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/convert-word', { method: 'POST', body: formData });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Error al convertir Word');
      }
      const blob = await response.blob();
      pdfBytes = await blob.arrayBuffer();
    } else {
      pdfBytes = await file.arrayBuffer();
    }
    const doc = await PDFDocument.load(pdfBytes);
    return { pageCount: doc.getPageCount(), pdfBytes };
  };

  const handleExcelUpload = async (files) => {
    const sorted = [...files].sort((a, b) => a.name.localeCompare(b.name));
    const infos = sorted.map(f => ({ file: f, dnis: [], sheetName: '', processing: true }));
    setExcelInfos(infos);
    toast.success(`${files.length} Excel(s) cargados`);
    for (let i = 0; i < sorted.length; i++) {
      try {
        const result = await extractDnisFromExcel(sorted[i]);
        setExcelInfos(prev => prev.map((item, idx) => idx === i ? { ...item, dnis: result ? result.dnis : [], sheetName: result ? result.sheet : '', processing: false } : item));
      } catch {
        setExcelInfos(prev => prev.map((item, idx) => idx === i ? { ...item, processing: false } : item));
      }
    }
  };

  const handleDocUpload = async (files) => {
    const sorted = [...files].sort((a, b) => a.name.localeCompare(b.name));
    const infos = sorted.map(f => ({ file: f, pageCount: null, pdfBytes: null, processing: true }));
    setDocInfos(infos);
    toast.success(`${files.length} documento(s) cargados`);
    for (let i = 0; i < sorted.length; i++) {
      try {
        const { pageCount, pdfBytes } = await getPageCount(sorted[i]);
        setDocInfos(prev => prev.map((item, idx) => idx === i ? { ...item, pageCount, pdfBytes, processing: false } : item));
      } catch {
        setDocInfos(prev => prev.map((item, idx) => idx === i ? { ...item, pageCount: -1, processing: false } : item));
        toast.error(`Error: ${sorted[i].name}`);
      }
    }
  };

  const handleDragStart = (index) => {
    setDragIdx(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragOverIdx !== index) setDragOverIdx(index);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === dropIndex) { setDragIdx(null); setDragOverIdx(null); return; }
    setDocInfos(prev => {
      const arr = [...prev];
      [arr[dragIdx], arr[dropIndex]] = [arr[dropIndex], arr[dragIdx]];
      return arr;
    });
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const handleClearAll = () => {
    setExcelInfos([]);
    setDocInfos([]);
    if (excelInputRef.current) excelInputRef.current.value = '';
    if (docInputRef.current) docInputRef.current.value = '';
  };

  const handleOrganizePDFs = async () => {
    if (!correlativo.trim()) {
      await Swal.fire({ title: 'Correlativo requerido', text: 'Por favor ingresa el número de correlativo', icon: 'warning', confirmButtonColor: '#9333ea', confirmButtonText: 'Entendido' });
      return;
    }
    if (excelInfos.length === 0 || docInfos.length === 0) {
      await Swal.fire({ title: 'Archivos requeridos', text: 'Sube los archivos Excel y Word/PDF', icon: 'warning', confirmButtonColor: '#9333ea', confirmButtonText: 'Entendido' });
      return;
    }
    if (excelInfos.length !== docInfos.length) {
      await Swal.fire({ title: 'Cantidades diferentes', text: `Tienes ${excelInfos.length} Excel(s) y ${docInfos.length} documento(s)`, icon: 'error', confirmButtonColor: '#9333ea', confirmButtonText: 'Entendido' });
      return;
    }
    const stillProcessing = excelInfos.some(e => e.processing) || docInfos.some(d => d.processing);
    if (stillProcessing) {
      await Swal.fire({ title: 'Espera', text: 'Algunos archivos aún se están procesando.', icon: 'info', confirmButtonColor: '#9333ea', confirmButtonText: 'Entendido' });
      return;
    }
    const mismatches = [];
    for (let i = 0; i < excelInfos.length; i++) {
      const dniCount = excelInfos[i].dnis.length;
      const pageCount = docInfos[i].pageCount;
      if (pageCount > 0 && dniCount !== pageCount) {
        mismatches.push(`${docInfos[i].file.name}: ${pageCount} págs vs ${dniCount} DNIs`);
      }
    }
    if (mismatches.length > 0) {
      const details = mismatches.join('<br>');
      await Swal.fire({ title: 'Cantidades no coinciden', html: `<p>Reordena los documentos para que coincidan:</p><p style="margin-top:8px;color:#dc2626;font-weight:600">${details}</p>`, icon: 'error', confirmButtonColor: '#9333ea', confirmButtonText: 'Entendido' });
      return;
    }

    try {
      setIsOrganizing(true);
      setOrganizeProgress(0);
      const totalPages = docInfos.reduce((sum, d) => sum + (d.pageCount || 0), 0);
      setOrganizeTotalPDFs(totalPages);

      const outputZip = new JSZip();
      let globalProgress = 0;

      for (let p = 0; p < excelInfos.length; p++) {
        const excel = excelInfos[p];
        const doc = docInfos[p];
        let pdfBytes = doc.pdfBytes;
        if (!pdfBytes) {
          const result = await getPageCount(doc.file);
          pdfBytes = result.pdfBytes;
        }

        const srcDoc = await PDFDocument.load(pdfBytes);
        const pageCount = srcDoc.getPageCount();
        const folderPrefix = excelInfos.length > 1 ? doc.file.name.replace(/\.(docx?|pdf)$/i, '') + '/' : '';

        const seenDnis = {};
        for (let i = 0; i < pageCount; i++) {
          const newDoc = await PDFDocument.create();
          const [copiedPage] = await newDoc.copyPages(srcDoc, [i]);
          newDoc.addPage(copiedPage);
          const singlePdfBytes = await newDoc.save();
          const dni = excel.dnis[i];
          const baseName = `${correlativo.trim()}_${dni}.pdf`;
          seenDnis[dni] = (seenDnis[dni] || 0) + 1;
          if (seenDnis[dni] > 1) {
            outputZip.file(`${folderPrefix}DUPLICADOS/${baseName.replace('.pdf', `_${seenDnis[dni]}.pdf`)}`, singlePdfBytes);
          } else {
            const folderStart = Math.floor(i / 50) * 50 + 1;
            const folderEnd = folderStart + 49;
            const subFolder = `${String(folderStart).padStart(3, '0')}-${String(folderEnd).padStart(3, '0')}`;
            outputZip.file(`${folderPrefix}${subFolder}/${baseName}`, singlePdfBytes);
          }
          globalProgress++;
          setOrganizeProgress(globalProgress);
        }
      }

      const outputBlob = await outputZip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      const url = URL.createObjectURL(outputBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pdfs_organizados.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsOrganizing(false);
      setCorrelativo('');
      setExcelInfos([]);
      setDocInfos([]);
      setOrganizeProgress(0);
      setOrganizeTotalPDFs(0);
      if (excelInputRef.current) excelInputRef.current.value = '';
      if (docInputRef.current) docInputRef.current.value = '';
      toast.success(`¡${totalPages} PDFs organizados exitosamente!`, { duration: 4000 });
    } catch (error) {
      console.error('Error al organizar PDFs:', error);
      setIsOrganizing(false);
      await Swal.fire({ title: 'Error al organizar', text: error.message, icon: 'error', confirmButtonColor: '#9333ea', confirmButtonText: 'Entendido' });
    }
  };

  // ─── Tool 3: Word to PDF ───
  const handleConvertWordToPDF = async () => {
    if (wordFiles.length === 0) {
      await Swal.fire({ title: 'No hay archivos', text: 'Por favor selecciona al menos un archivo Word (.docx)', icon: 'warning', confirmButtonColor: '#9333ea', confirmButtonText: 'Entendido' });
      return;
    }
    try {
      setIsConverting(true);
      setConvertProgress(0);
      setConvertTotal(wordFiles.length);

      const outputZip = new JSZip();

      for (let i = 0; i < wordFiles.length; i++) {
        const file = wordFiles[i];

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/convert-word', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Error al convertir ${file.name}`);
        }

        const pdfBlob = await response.blob();
        const pdfName = file.name.replace(/\.docx?$/i, '.pdf');
        outputZip.file(pdfName, pdfBlob);

        setConvertProgress(i + 1);
      }

      const zipBlob = await outputZip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'documentos_convertidos.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsConverting(false);
      setWordFiles([]);
      setConvertProgress(0);
      setConvertTotal(0);
      if (wordInputRef.current) wordInputRef.current.value = '';
      toast.success(`¡${wordFiles.length} archivo(s) convertidos exitosamente!`, { duration: 4000 });
    } catch (error) {
      console.error('Error al convertir Word a PDF:', error);
      setIsConverting(false);
      await Swal.fire({ title: 'Error al convertir', text: error.message, icon: 'error', confirmButtonColor: '#9333ea', confirmButtonText: 'Entendido' });
    }
  };

  // ─── Progress Bar Component ───
  const ProgressBar = ({ current, total, label }) => (
    <div className="space-y-3">
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
        <div
          className="bg-gradient-to-r from-purple-500 to-purple-600 h-full transition-all duration-500 flex items-center justify-end pr-2"
          style={{ width: `${total > 0 ? (current / total) * 100 : 0}%` }}
        >
          {total > 0 && (
            <span className="text-white text-xs font-bold">
              {Math.round((current / total) * 100)}%
            </span>
          )}
        </div>
      </div>
      <p className="text-center text-sm text-gray-600">{label} {current} de {total}...</p>
    </div>
  );

  // ─── Header ───
  const renderHeader = () => (
    <header className="bg-white border-b border-gray-200 shadow-sm px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <img src="/img/logo.png" alt="Logo" className="h-12 w-12 object-contain" />
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-gray-800">Herramientas</h1>
          <p className="text-xs text-purple-600 font-medium">Utilidades para certificados</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {activeTool && (
          <button
            onClick={() => setActiveTool(null)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-purple-50 hover:border-purple-400 transition-colors font-semibold text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Todas las herramientas
          </button>
        )}
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-purple-50 hover:border-purple-400 transition-colors font-semibold text-gray-700"
        >
          <Home className="w-4 h-4" />
          Volver al Generador
        </Link>
      </div>
    </header>
  );

  // ─── Dashboard ───
  const renderDashboard = () => (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Selecciona una herramienta</h2>
          <p className="text-gray-500 mt-1">Elige la utilidad que necesitas para trabajar con tus documentos</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.03] hover:border-purple-300 group"
              >
                <div className={`bg-gradient-to-r ${tool.gradient} px-6 py-6 flex items-center justify-center`}>
                  <div className="bg-white p-4 rounded-2xl shadow-md">
                    <Icon className={`w-10 h-10 ${tool.iconColor}`} />
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-800 text-lg mb-2 group-hover:text-purple-700 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">
                    {tool.description}
                  </p>
                  <div className={`flex items-center gap-2 ${tool.textColor} font-semibold text-sm`}>
                    Usar herramienta
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ─── Tool 1 View: Optimize PDFs ───
  const renderOptimizeTool = () => (
    <div className="flex-1 flex items-start justify-center p-8">
      <div className="max-w-3xl w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <FileCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Adaptar PDFs a formato compatible</h2>
                <p className="text-purple-100 text-sm">Re-procesa los PDFs para que sean compatibles con cualquier sistema</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">¿Para qué sirve esta herramienta?</h3>
              <ul className="text-sm text-blue-800 space-y-1 ml-5 list-disc">
                <li>Convierte PDFs a un formato estándar y compatible</li>
                <li>Soluciona problemas de lectura en sistemas antiguos o específicos</li>
                <li>Re-serializa el PDF usando pdf-lib (similar a Python)</li>
                <li>Procesa archivos ZIP completos con múltiples PDFs</li>
                <li>Busca PDFs recursivamente en todas las carpetas internas del ZIP</li>
              </ul>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800 font-semibold mb-1">Importante:</p>
                <p className="text-xs text-yellow-700">Los PDFs deben estar <strong>directamente en el ZIP</strong> (pueden estar en carpetas). No deben estar dentro de otro archivo comprimido (RAR/ZIP).</p>
              </div>
            </div>

            {!zipFile ? (
              <div onClick={() => zipInputRef.current?.click()} className="border-3 border-dashed border-gray-300 rounded-2xl p-16 text-center hover:border-purple-500 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 cursor-pointer transition-all duration-300 transform hover:scale-[1.02]">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-lg text-gray-800 font-bold mb-2">Haz clic para seleccionar archivo ZIP</p>
                <p className="text-sm text-gray-500">o arrastra tu archivo aquí</p>
                <p className="text-xs text-gray-400 mt-4">Archivo ZIP con PDFs - Máximo 100MB</p>
                <input ref={zipInputRef} type="file" accept=".zip" onChange={(e) => { const file = e.target.files[0]; if (file) { setZipFile(file); toast.success('ZIP cargado correctamente'); } }} className="hidden" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-lg"><FileCheck className="w-5 h-5 text-green-600" /></div>
                      <div>
                        <p className="font-semibold text-green-900">{zipFile.name}</p>
                        <p className="text-sm text-green-700">{(zipFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button onClick={() => { setZipFile(null); if (zipInputRef.current) zipInputRef.current.value = ''; }} disabled={isProcessing} className="px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Cambiar archivo</button>
                  </div>
                </div>
                {isProcessing && <ProgressBar current={progress} total={totalPDFs} label="Procesando" />}
                <button onClick={handleOptimizePDFs} disabled={isProcessing} className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3">
                  {isProcessing ? (<><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>Procesando...</>) : (<><Download className="w-6 h-6" />Optimizar y Descargar</>)}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Tool 2 View: Organize PDFs ───
  const renderOrganizeTool = () => (
    <div className="flex-1 flex items-start justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-violet-600 to-violet-700 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg"><FolderOpen className="w-6 h-6 text-white" /></div>
              <div>
                <h2 className="text-xl font-bold text-white">Organizador de PDFs en Carpetas</h2>
                <p className="text-violet-100 text-sm">Sube todos los Excel y Word/PDF de una vez</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 mb-2">¿Cómo funciona?</h3>
              <ul className="text-sm text-blue-800 space-y-1 ml-5 list-disc">
                <li><strong>Paso 1:</strong> Sube todos los archivos Excel (se emparejan por orden alfabético)</li>
                <li><strong>Paso 2:</strong> Sube todos los Word/PDF (misma cantidad que los Excel)</li>
                <li><strong>Paso 3:</strong> Click en "Emparejar" para detectar DNIs y contar páginas</li>
                <li>Cada página se renombra como <code className="bg-blue-100 px-1 rounded">correlativo_DNI.pdf</code></li>
                <li>Se organizan en carpetas de 50 (001-050, 051-100, etc.)</li>
              </ul>
            </div>

            {/* Correlativo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Correlativo</label>
              <input type="text" value={correlativo} onChange={(e) => setCorrelativo(e.target.value)} placeholder="Ej: 29" disabled={isOrganizing} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all text-gray-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed" />
            </div>

            {/* Subida masiva */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Excel files */}
              <div className="border border-violet-200 rounded-xl p-4 bg-violet-50/50">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Archivos Excel con DNIs</label>
                {excelInfos.length === 0 ? (
                  <div onClick={() => !isOrganizing && excelInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-violet-400 hover:bg-white transition-all">
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 font-medium">Seleccionar Excel(s)</p>
                    <p className="text-xs text-gray-400 mt-1">Puedes seleccionar varios a la vez</p>
                    <input ref={excelInputRef} type="file" accept=".xlsx,.xls" multiple onChange={(e) => { const files = Array.from(e.target.files); if (files.length > 0) handleExcelUpload(files); }} className="hidden" />
                  </div>
                ) : (
                  <div>
                    <div className="space-y-1.5 mb-2">
                      {excelInfos.map((info, i) => (
                        <div key={i} className="bg-white rounded-lg px-3 py-2 border border-violet-200 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="bg-violet-100 text-violet-700 font-bold px-1.5 py-0.5 rounded text-[10px] flex-shrink-0">{i + 1}</span>
                            <span className="text-gray-700 truncate font-medium">{info.file.name}</span>
                          </div>
                          <div className="ml-6 mt-0.5">
                            {info.processing ? (
                              <span className="inline-flex items-center gap-1 text-amber-600"><Loader2 className="w-3 h-3 animate-spin" />Leyendo DNIs...</span>
                            ) : (
                              <span className="text-violet-700 font-semibold">{info.dnis.length} DNIs{info.sheetName ? ` (${info.sheetName})` : ''}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-violet-700 font-semibold">{excelInfos.length} archivo(s)</span>
                      <button onClick={() => { setExcelInfos([]); if (excelInputRef.current) excelInputRef.current.value = ''; }} disabled={isOrganizing} className="text-xs text-red-500 hover:text-red-700 font-semibold disabled:opacity-50">Quitar todos</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Doc files */}
              <div className="border border-violet-200 rounded-xl p-4 bg-violet-50/50">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Archivos Word / PDF</label>
                {docInfos.length === 0 ? (
                  <div onClick={() => !isOrganizing && docInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-violet-400 hover:bg-white transition-all">
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 font-medium">Seleccionar Word/PDF(s)</p>
                    <p className="text-xs text-gray-400 mt-1">Puedes seleccionar varios a la vez</p>
                    <input ref={docInputRef} type="file" accept=".pdf,.docx,.doc" multiple onChange={(e) => { const files = Array.from(e.target.files); if (files.length > 0) handleDocUpload(files); }} className="hidden" />
                  </div>
                ) : (
                  <div>
                    <div className="space-y-1.5 mb-2">
                      {docInfos.map((info, i) => (
                        <div
                          key={info.file.name + i}
                          draggable={!isOrganizing}
                          onDragStart={() => handleDragStart(i)}
                          onDragOver={(e) => handleDragOver(e, i)}
                          onDrop={(e) => handleDrop(e, i)}
                          onDragEnd={handleDragEnd}
                          className={`rounded-lg px-3 py-2 border text-xs transition-all select-none ${
                            dragIdx === i ? 'opacity-40 scale-95 border-violet-400 bg-violet-100' :
                            dragOverIdx === i && dragIdx !== null ? 'border-violet-500 bg-violet-100 shadow-md scale-[1.02]' :
                            'bg-white border-violet-200'
                          } ${!isOrganizing ? 'cursor-grab active:cursor-grabbing' : ''}`}
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="bg-violet-100 text-violet-700 font-bold px-1.5 py-0.5 rounded text-[10px] flex-shrink-0">{i + 1}</span>
                            <span className="text-gray-700 truncate font-medium">{info.file.name}</span>
                          </div>
                          <div className="ml-10 mt-0.5">
                            {info.processing ? (
                              <span className="inline-flex items-center gap-1 text-amber-600"><Loader2 className="w-3 h-3 animate-spin" />Contando páginas...</span>
                            ) : info.pageCount === -1 ? (
                              <span className="text-red-600 font-semibold">Error</span>
                            ) : (
                              <span className="text-violet-700 font-semibold">{info.pageCount} página{info.pageCount !== 1 ? 's' : ''}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mb-1.5 text-center">Arrastra para reordenar</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-violet-700 font-semibold">{docInfos.length} archivo(s)</span>
                      <button onClick={() => { setDocInfos([]); if (docInputRef.current) docInputRef.current.value = ''; }} disabled={isOrganizing} className="text-xs text-red-500 hover:text-red-700 font-semibold disabled:opacity-50">Quitar todos</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cantidad mismatch warning */}
            {excelInfos.length > 0 && docInfos.length > 0 && excelInfos.length !== docInfos.length && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 font-semibold text-center">
                Cantidades diferentes: {excelInfos.length} Excel(s) vs {docInfos.length} documento(s)
              </div>
            )}

            {/* Vista previa de emparejamiento */}
            {excelInfos.length > 0 && docInfos.length > 0 && excelInfos.length === docInfos.length && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-700">Emparejamiento ({excelInfos.length} pares)</h3>
                  <button onClick={handleClearAll} disabled={isOrganizing} className="text-xs text-red-500 hover:text-red-700 font-semibold disabled:opacity-50">Limpiar todo</button>
                </div>
                <div className="space-y-2">
                  {excelInfos.map((excel, idx) => {
                    const doc = docInfos[idx];
                    const dniCount = excel.dnis.length;
                    const pageCount = doc?.pageCount;
                    const bothReady = !excel.processing && !doc?.processing && pageCount > 0 && dniCount > 0;
                    const match = bothReady && dniCount === pageCount;
                    const mismatch = bothReady && dniCount !== pageCount;
                    return (
                      <div key={idx} className={`border rounded-xl p-3 transition-colors ${mismatch ? 'border-red-300 bg-red-50' : match ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500 font-medium mb-0.5">Excel</p>
                            <p className="text-sm font-semibold text-gray-800 truncate">{excel.file.name}</p>
                            <p className="text-xs mt-0.5">
                              {excel.processing ? (
                                <span className="inline-flex items-center gap-1 text-amber-600"><Loader2 className="w-3 h-3 animate-spin" />Leyendo...</span>
                              ) : (
                                <span className="text-violet-700 font-semibold">{dniCount} DNIs</span>
                              )}
                            </p>
                          </div>
                          <div className="flex flex-col items-center px-2">
                            <span className={`text-lg font-bold ${match ? 'text-green-500' : mismatch ? 'text-red-500' : 'text-gray-300'}`}>
                              {match ? '=' : mismatch ? '≠' : '↔'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500 font-medium mb-0.5">Documento</p>
                            <p className="text-sm font-semibold text-gray-800 truncate">{doc?.file.name}</p>
                            <p className="text-xs mt-0.5">
                              {doc?.processing ? (
                                <span className="inline-flex items-center gap-1 text-amber-600"><Loader2 className="w-3 h-3 animate-spin" />Contando...</span>
                              ) : pageCount === -1 ? (
                                <span className="text-red-600 font-semibold">Error</span>
                              ) : pageCount ? (
                                <span className="text-violet-700 font-semibold">{pageCount} página{pageCount !== 1 ? 's' : ''}</span>
                              ) : null}
                            </p>
                          </div>
                        </div>
                        {mismatch && <p className="text-xs text-red-600 font-semibold mt-2 text-center">No coinciden: {dniCount} DNIs vs {pageCount} páginas — mueve el documento con las flechas</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {isOrganizing && <ProgressBar current={organizeProgress} total={organizeTotalPDFs} label="Organizando" />}

            <button onClick={handleOrganizePDFs} disabled={isOrganizing || excelInfos.length === 0 || docInfos.length === 0 || excelInfos.length !== docInfos.length || excelInfos.some(e => e.processing) || docInfos.some(d => d.processing)} className="w-full bg-gradient-to-r from-violet-600 to-violet-700 text-white px-8 py-4 rounded-xl hover:from-violet-700 hover:to-violet-800 transition-all font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3">
              {isOrganizing ? (<><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>Organizando...</>) : (<><Download className="w-6 h-6" />Organizar y Descargar ({excelInfos.reduce((s, e) => s + e.dnis.length, 0)} PDFs)</>)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Tool 3 View: Word to PDF ───
  const renderWordToPdfTool = () => (
    <div className="flex-1 flex items-start justify-center p-8">
      <div className="max-w-3xl w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg"><FileText className="w-6 h-6 text-white" /></div>
              <div>
                <h2 className="text-xl font-bold text-white">Convertir Word a PDF</h2>
                <p className="text-indigo-100 text-sm">Convierte archivos .docx a PDF de forma rápida</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 mb-2">¿Para qué sirve esta herramienta?</h3>
              <ul className="text-sm text-blue-800 space-y-1 ml-5 list-disc">
                <li>Convierte archivos Word (.docx) a formato PDF</li>
                <li>Puedes subir varios archivos a la vez</li>
                <li>Descarga todos los PDFs en un archivo ZIP</li>
                <li>Mantiene el formato de texto, tablas e imágenes</li>
              </ul>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800 font-semibold mb-1">Nota:</p>
                <p className="text-xs text-yellow-700">Solo se aceptan archivos <strong>.docx</strong> (Word 2007 en adelante). Los archivos .doc antiguos no son compatibles.</p>
              </div>
            </div>

            {wordFiles.length === 0 ? (
              <div onClick={() => !isConverting && wordInputRef.current?.click()} className={`border-3 border-dashed border-gray-300 rounded-2xl p-16 text-center transition-all duration-300 transform ${isConverting ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-500 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 cursor-pointer hover:scale-[1.02]'}`}>
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-indigo-600" />
                </div>
                <p className="text-lg text-gray-800 font-bold mb-2">Haz clic para seleccionar archivos Word</p>
                <p className="text-sm text-gray-500">Puedes seleccionar varios archivos .docx a la vez</p>
                <input ref={wordInputRef} type="file" accept=".docx" multiple onChange={(e) => { const files = Array.from(e.target.files); if (files.length > 0) { setWordFiles(files); toast.success(`${files.length} archivo(s) cargado(s)`); } }} className="hidden" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-green-900">{wordFiles.length} archivo(s) seleccionado(s)</p>
                    <button onClick={() => { setWordFiles([]); if (wordInputRef.current) wordInputRef.current.value = ''; }} disabled={isConverting} className="px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Quitar todos</button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {wordFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-green-200">
                        <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                      </div>
                    ))}
                  </div>
                </div>

                {isConverting && <ProgressBar current={convertProgress} total={convertTotal} label="Convirtiendo" />}

                <button onClick={handleConvertWordToPDF} disabled={isConverting} className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-8 py-4 rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3">
                  {isConverting ? (<><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>Convirtiendo...</>) : (<><Download className="w-6 h-6" />Convertir y Descargar</>)}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { background: '#fff', color: '#374151', padding: '16px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '14px', fontWeight: '500' },
          success: { iconTheme: { primary: '#9333ea', secondary: '#fff' } },
        }}
      />
      {renderHeader()}
      {activeTool === null && renderDashboard()}
      {activeTool === 'optimize' && renderOptimizeTool()}
      {activeTool === 'organize' && renderOrganizeTool()}
      {activeTool === 'word-to-pdf' && renderWordToPdfTool()}
    </div>
  );
}

export default Herramientas;
