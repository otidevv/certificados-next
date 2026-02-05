'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { Upload, Download, Home, FileCheck } from 'lucide-react';
import Swal from 'sweetalert2';
import toast, { Toaster } from 'react-hot-toast';

function Herramientas() {
  const [zipFile, setZipFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalPDFs, setTotalPDFs] = useState(0);
  const zipInputRef = useRef(null);

  const handleOptimizePDFs = async () => {
    if (!zipFile) {
      await Swal.fire({
        title: 'No hay archivo',
        text: 'Por favor selecciona un archivo ZIP primero',
        icon: 'warning',
        confirmButtonColor: '#9333ea',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(0);

      let pdfFilesData = [];

      const zipData = await zipFile.arrayBuffer();
      const zip = await JSZip.loadAsync(zipData);

      const pdfEntries = Object.keys(zip.files)
        .filter(fileName => {
          const file = zip.files[fileName];
          const isPdf = fileName.toLowerCase().endsWith('.pdf');
          const notDir = !file.dir;
          return isPdf && notDir;
        });

      const nestedArchives = Object.keys(zip.files).filter(fileName =>
        fileName.toLowerCase().endsWith('.rar') ||
        (fileName.toLowerCase().endsWith('.zip') && fileName !== zipFile.name)
      );

      if (nestedArchives.length > 0 && pdfEntries.length === 0) {
        await Swal.fire({
          title: 'Archivos comprimidos anidados detectados',
          html: `
            <div style="text-align: left;">
              <p style="margin-bottom: 12px;">Se encontraron archivos comprimidos dentro del ZIP:</p>
              <ul style="margin-left: 20px; margin-bottom: 12px; color: #dc2626; font-weight: 600;">
                ${nestedArchives.map(name => `<li>${name}</li>`).join('')}
              </ul>
              <p style="margin-bottom: 12px;">Por favor, <strong>extrae el contenido</strong> de estos archivos y vuelve a comprimir los PDFs <strong>directamente en un ZIP</strong>.</p>
            </div>
          `,
          icon: 'warning',
          confirmButtonColor: '#9333ea',
          confirmButtonText: 'Entendido',
          width: '600px'
        });
        setIsProcessing(false);
        return;
      }

      for (const fileName of pdfEntries) {
        try {
          const pdfBytes = await zip.files[fileName].async('arraybuffer');
          const baseName = fileName.split('/').pop().split('\\').pop();

          pdfFilesData.push({
            name: baseName,
            data: pdfBytes,
            originalPath: fileName
          });
        } catch (extractError) {
          console.error(`Error al extraer ${fileName}:`, extractError);
          continue;
        }
      }

      if (pdfFilesData.length === 0) {
        throw new Error('No se encontraron archivos PDF en el archivo');
      }

      setTotalPDFs(pdfFilesData.length);

      const optimizedZip = new JSZip();

      for (let i = 0; i < pdfFilesData.length; i++) {
        const pdfFileData = pdfFilesData[i];

        try {
          const pdfDoc = await PDFDocument.load(pdfFileData.data);

          const optimizedBytes = await pdfDoc.save({
            useObjectStreams: false,
            addDefaultPage: false,
            objectsPerTick: 50,
          });

          optimizedZip.file(pdfFileData.name, optimizedBytes);

          setProgress(i + 1);
        } catch (error) {
          console.error(`Error al optimizar ${pdfFileData.name}:`, error);
          optimizedZip.file(pdfFileData.name, pdfFileData.data);
        }
      }

      const optimizedZipBlob = await optimizedZip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

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

      if (zipInputRef.current) {
        zipInputRef.current.value = '';
      }

      toast.success(`¡${pdfFilesData.length} PDFs optimizados exitosamente!`, {
        duration: 4000,
      });
    } catch (error) {
      console.error('Error al optimizar PDFs:', error);
      setIsProcessing(false);
      await Swal.fire({
        title: 'Error al optimizar',
        text: error.message,
        icon: 'error',
        confirmButtonColor: '#9333ea',
        confirmButtonText: 'Entendido'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#374151',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#9333ea',
              secondary: '#fff',
            },
          },
        }}
      />

      <header className="bg-white border-b border-gray-200 shadow-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src="/img/logo.png"
            alt="Logo"
            className="h-12 w-12 object-contain"
          />
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-gray-800">
              Herramientas
            </h1>
            <p className="text-xs text-purple-600 font-medium">
              Utilidades para certificados
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-purple-50 hover:border-purple-400 transition-colors font-semibold text-gray-700"
        >
          <Home className="w-4 h-4" />
          Volver al Generador
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <FileCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Adaptar PDFs a formato compatible</h2>
                    <p className="text-purple-100 text-sm">
                      Re-procesa los PDFs para que sean compatibles con cualquier sistema
                    </p>
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
                    <p className="text-xs text-yellow-700">
                      Los PDFs deben estar <strong>directamente en el ZIP</strong> (pueden estar en carpetas).
                      No deben estar dentro de otro archivo comprimido (RAR/ZIP).
                    </p>
                  </div>
                </div>

                {!zipFile ? (
                  <div
                    onClick={() => zipInputRef.current?.click()}
                    className="border-3 border-dashed border-gray-300 rounded-2xl p-16 text-center hover:border-purple-500 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 cursor-pointer transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-8 h-8 text-purple-600" />
                    </div>
                    <p className="text-lg text-gray-800 font-bold mb-2">Haz clic para seleccionar archivo ZIP</p>
                    <p className="text-sm text-gray-500">o arrastra tu archivo aquí</p>
                    <p className="text-xs text-gray-400 mt-4">Archivo ZIP con PDFs - Máximo 100MB</p>
                    <input
                      ref={zipInputRef}
                      type="file"
                      accept=".zip"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setZipFile(file);
                          toast.success('ZIP cargado correctamente');
                        }
                      }}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-green-100 p-2 rounded-lg">
                            <FileCheck className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-green-900">{zipFile.name}</p>
                            <p className="text-sm text-green-700">
                              {(zipFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setZipFile(null);
                            if (zipInputRef.current) {
                              zipInputRef.current.value = '';
                            }
                          }}
                          disabled={isProcessing}
                          className="px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cambiar archivo
                        </button>
                      </div>
                    </div>

                    {isProcessing && (
                      <div className="space-y-3">
                        <div className="relative">
                          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-purple-600 h-full transition-all duration-500 flex items-center justify-end pr-2"
                              style={{ width: `${(progress / totalPDFs) * 100}%` }}
                            >
                              <span className="text-white text-xs font-bold">
                                {Math.round((progress / totalPDFs) * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-center text-sm text-gray-600">
                          Procesando {progress} de {totalPDFs} PDFs...
                        </p>
                      </div>
                    )}

                    <button
                      onClick={handleOptimizePDFs}
                      disabled={isProcessing}
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Download className="w-6 h-6" />
                          Optimizar y Descargar
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 opacity-50">
              <div className="bg-gradient-to-r from-gray-400 to-gray-500 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Próximamente más herramientas</h2>
                    <p className="text-gray-100 text-sm">
                      Espera nuevas utilidades para trabajar con certificados
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 text-center text-gray-500">
                <p>Más herramientas estarán disponibles pronto...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Herramientas;
