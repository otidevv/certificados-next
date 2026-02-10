'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { Upload, Download, Home, FileCheck, FolderOpen, FileText, ArrowLeft, ChevronRight } from 'lucide-react';
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
    description: 'Divide un PDF de varias páginas en archivos individuales, los renombra con correlativo y número de documento, y los organiza en carpetas de 50.',
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

  // Tool 2: Organize PDFs
  const [correlativo, setCorrelativo] = useState('');
  const [documentNumbers, setDocumentNumbers] = useState([]);
  const [inputMethod, setInputMethod] = useState('textarea');
  const [textareaValue, setTextareaValue] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [organizeProgress, setOrganizeProgress] = useState(0);
  const [organizeTotalPDFs, setOrganizeTotalPDFs] = useState(0);
  const pdfInputRef = useRef(null);
  const excelInputRef = useRef(null);

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
  const handleTextareaChange = (value) => {
    setTextareaValue(value);
    const numbers = value.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    setDocumentNumbers(numbers);
  };

  const handleExcelUpload = async (file) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      const numbers = jsonData.flat().map(cell => String(cell).trim()).filter(val => val.length > 0 && val !== 'undefined');
      setDocumentNumbers(numbers);
      toast.success(`${numbers.length} números de documento cargados desde Excel`);
    } catch (error) {
      console.error('Error al leer Excel:', error);
      await Swal.fire({ title: 'Error al leer Excel', text: 'No se pudo leer el archivo Excel. Verifica que sea un archivo válido.', icon: 'error', confirmButtonColor: '#9333ea', confirmButtonText: 'Entendido' });
    }
  };

  const handleOrganizePDFs = async () => {
    if (!correlativo.trim()) {
      await Swal.fire({ title: 'Correlativo requerido', text: 'Por favor ingresa el número de correlativo', icon: 'warning', confirmButtonColor: '#9333ea', confirmButtonText: 'Entendido' });
      return;
    }
    if (documentNumbers.length === 0) {
      await Swal.fire({ title: 'Números de documento requeridos', text: 'Por favor ingresa los números de documento (vía textarea o Excel)', icon: 'warning', confirmButtonColor: '#9333ea', confirmButtonText: 'Entendido' });
      return;
    }
    if (!pdfFile) {
      await Swal.fire({ title: 'PDF requerido', text: 'Por favor selecciona el archivo PDF con las páginas', icon: 'warning', confirmButtonColor: '#9333ea', confirmButtonText: 'Entendido' });
      return;
    }
    try {
      setIsOrganizing(true);
      setOrganizeProgress(0);
      const pdfBytes = await pdfFile.arrayBuffer();
      const srcDoc = await PDFDocument.load(pdfBytes);
      const pageCount = srcDoc.getPageCount();
      if (pageCount !== documentNumbers.length) {
        await Swal.fire({
          title: 'Cantidades no coinciden',
          html: `<p>El PDF tiene <strong>${pageCount}</strong> páginas pero se ingresaron <strong>${documentNumbers.length}</strong> números de documento.</p><p style="margin-top: 8px;">Ambas cantidades deben ser iguales.</p>`,
          icon: 'error', confirmButtonColor: '#9333ea', confirmButtonText: 'Entendido'
        });
        setIsOrganizing(false);
        return;
      }
      setOrganizeTotalPDFs(pageCount);
      const outputZip = new JSZip();
      for (let i = 0; i < pageCount; i++) {
        const newDoc = await PDFDocument.create();
        const [copiedPage] = await newDoc.copyPages(srcDoc, [i]);
        newDoc.addPage(copiedPage);
        const singlePdfBytes = await newDoc.save();
        const newName = `${correlativo.trim()}_${documentNumbers[i]}.pdf`;
        const folderStart = Math.floor(i / 50) * 50 + 1;
        const folderEnd = folderStart + 49;
        const folderName = `${String(folderStart).padStart(3, '0')}-${String(folderEnd).padStart(3, '0')}`;
        outputZip.file(`${folderName}/${newName}`, singlePdfBytes);
        setOrganizeProgress(i + 1);
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
      setDocumentNumbers([]);
      setTextareaValue('');
      setPdfFile(null);
      setOrganizeProgress(0);
      setOrganizeTotalPDFs(0);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
      if (excelInputRef.current) excelInputRef.current.value = '';
      toast.success(`¡${pageCount} PDFs organizados exitosamente!`, { duration: 4000 });
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
      <div className="max-w-3xl w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-violet-600 to-violet-700 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg"><FolderOpen className="w-6 h-6 text-white" /></div>
              <div>
                <h2 className="text-xl font-bold text-white">Organizador de PDFs en Carpetas</h2>
                <p className="text-violet-100 text-sm">Renombra y organiza PDFs en carpetas de 50</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 mb-2">¿Para qué sirve esta herramienta?</h3>
              <ul className="text-sm text-blue-800 space-y-1 ml-5 list-disc">
                <li>Sube un PDF con varias páginas (cada página = un certificado)</li>
                <li>Divide cada página en un PDF individual</li>
                <li>Renombra cada PDF como <code className="bg-blue-100 px-1 rounded">correlativo_numDocumento.pdf</code></li>
                <li>Organiza los PDFs en carpetas de 50 (001-050, 051-100, etc.)</li>
                <li>Descarga un ZIP con toda la estructura organizada</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Correlativo</label>
              <input type="text" value={correlativo} onChange={(e) => setCorrelativo(e.target.value)} placeholder="Ej: 29" disabled={isOrganizing} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-gray-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Números de documento</label>
              <div className="flex gap-2 mb-3">
                <button onClick={() => setInputMethod('textarea')} disabled={isOrganizing} className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${inputMethod === 'textarea' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} disabled:opacity-50 disabled:cursor-not-allowed`}>Escribir / Pegar</button>
                <button onClick={() => setInputMethod('excel')} disabled={isOrganizing} className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${inputMethod === 'excel' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} disabled:opacity-50 disabled:cursor-not-allowed`}>Subir Excel</button>
              </div>
              {inputMethod === 'textarea' ? (
                <textarea value={textareaValue} onChange={(e) => handleTextareaChange(e.target.value)} placeholder={"Pega un número de documento por línea\nEj:\n12345678\n87654321\n11223344"} rows={6} disabled={isOrganizing} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all resize-y font-mono text-sm text-gray-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed" />
              ) : (
                <div onClick={() => !isOrganizing && excelInputRef.current?.click()} className={`border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer transition-all ${isOrganizing ? 'opacity-50 cursor-not-allowed' : 'hover:border-purple-500 hover:bg-purple-50'}`}>
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 font-medium">Haz clic para subir archivo Excel</p>
                  <p className="text-xs text-gray-400 mt-1">.xlsx o .xls con una columna de números de documento</p>
                  <input ref={excelInputRef} type="file" accept=".xlsx,.xls" onChange={(e) => { const file = e.target.files[0]; if (file) handleExcelUpload(file); }} className="hidden" />
                </div>
              )}
              {documentNumbers.length > 0 && (
                <p className="text-sm text-purple-600 font-semibold mt-2">{documentNumbers.length} números de documento ingresados</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Archivo PDF (cada página = un certificado)</label>
              {!pdfFile ? (
                <div onClick={() => !isOrganizing && pdfInputRef.current?.click()} className={`border-2 border-dashed border-gray-300 rounded-xl p-8 text-center transition-all ${isOrganizing ? 'opacity-50 cursor-not-allowed' : 'hover:border-purple-500 hover:bg-purple-50 cursor-pointer'}`}>
                  <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"><Upload className="w-6 h-6 text-purple-600" /></div>
                  <p className="text-sm text-gray-700 font-semibold mb-1">Selecciona el archivo PDF</p>
                  <p className="text-xs text-gray-400">Cada página se convertirá en un PDF individual</p>
                  <input ref={pdfInputRef} type="file" accept=".pdf" onChange={(e) => { const file = e.target.files[0]; if (file) { setPdfFile(file); toast.success('PDF cargado correctamente'); } }} className="hidden" />
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-lg"><FileCheck className="w-5 h-5 text-green-600" /></div>
                      <div>
                        <p className="font-semibold text-green-900">{pdfFile.name}</p>
                        <p className="text-sm text-green-700">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button onClick={() => { setPdfFile(null); if (pdfInputRef.current) pdfInputRef.current.value = ''; }} disabled={isOrganizing} className="px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Cambiar archivo</button>
                  </div>
                </div>
              )}
            </div>

            {isOrganizing && <ProgressBar current={organizeProgress} total={organizeTotalPDFs} label="Organizando" />}

            <button onClick={handleOrganizePDFs} disabled={isOrganizing} className="w-full bg-gradient-to-r from-violet-600 to-violet-700 text-white px-8 py-4 rounded-xl hover:from-violet-700 hover:to-violet-800 transition-all font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3">
              {isOrganizing ? (<><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>Organizando...</>) : (<><Download className="w-6 h-6" />Organizar y Descargar</>)}
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
