'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Save, FolderOpen, Trash2, X, Loader2, Clock, FileText } from 'lucide-react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

export default function TemplateManager({
  backgroundImages,
  fields,
  fieldsPage2,
  excelHeaders,
  canvasWidth,
  canvasHeight,
  onLoadTemplate,
  loadOnly = false,
}) {
  const { data: session } = useSession();
  const [templates, setTemplates] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Cargar plantillas del usuario
  const fetchTemplates = async () => {
    if (!session?.user) return;

    setIsLoadingTemplates(true);
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error al cargar plantillas:', error);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchTemplates();
    }
  }, [session]);

  // Guardar plantilla
  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error('Ingresa un nombre para la plantilla');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          backgroundData: { images: backgroundImages },
          fieldsPage1: fields,
          fieldsPage2: fieldsPage2,
          excelHeaders: excelHeaders,
          canvasWidth,
          canvasHeight,
        }),
      });

      if (res.ok) {
        toast.success('Plantilla guardada exitosamente');
        setShowSaveModal(false);
        setTemplateName('');
        fetchTemplates();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al guardar');
      }
    } catch (error) {
      toast.error('Error al guardar plantilla');
    } finally {
      setIsSaving(false);
    }
  };

  // Cargar plantilla
  const handleLoad = async (templateId) => {
    try {
      const res = await fetch(`/api/templates/${templateId}`);
      if (res.ok) {
        const template = await res.json();
        onLoadTemplate(template);
        setShowLoadModal(false);
        toast.success(`Plantilla "${template.name}" cargada`);
      } else {
        toast.error('Error al cargar plantilla');
      }
    } catch (error) {
      toast.error('Error al cargar plantilla');
    }
  };

  // Eliminar plantilla
  const handleDelete = async (templateId, templateName) => {
    const result = await Swal.fire({
      title: '¿Eliminar plantilla?',
      text: `Se eliminará "${templateName}" permanentemente`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/templates/${templateId}`, {
          method: 'DELETE',
        });

        if (res.ok) {
          toast.success('Plantilla eliminada');
          fetchTemplates();
        } else {
          toast.error('Error al eliminar');
        }
      } catch (error) {
        toast.error('Error al eliminar plantilla');
      }
    }
  };

  // Si no hay sesión, no mostrar nada
  if (!session?.user) {
    return null;
  }

  return (
    <>
      {/* Botones de acción */}
      <div className={loadOnly ? "" : "flex gap-2"}>
        {!loadOnly && (
          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
          >
            <Save className="w-4 h-4" />
            Guardar
          </button>
        )}
        <button
          onClick={() => {
            fetchTemplates();
            setShowLoadModal(true);
          }}
          className={loadOnly
            ? "flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-lg hover:shadow-xl"
            : "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
          }
        >
          <FolderOpen className={loadOnly ? "w-5 h-5" : "w-4 h-4"} />
          {loadOnly ? "Cargar Plantilla Guardada" : "Cargar"}
        </button>
      </div>

      {/* Modal Guardar */}
      {!loadOnly && showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Guardar Plantilla</h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre de la plantilla
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Ej: Certificado Diplomado 2024"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
                />
              </div>

              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                <p className="font-semibold text-gray-700 mb-2">Se guardará:</p>
                <ul className="space-y-1">
                  <li>• Imagen de fondo ({backgroundImages?.length || 0} página(s))</li>
                  <li>• {fields?.length || 0} campos en anverso</li>
                  <li>• {fieldsPage2?.length || 0} campos en reverso</li>
                  <li>• Headers del Excel ({excelHeaders?.length || 0} columnas)</li>
                </ul>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-5 py-2.5 rounded-lg border-2 border-gray-300 hover:bg-gray-100 font-semibold text-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !templateName.trim()}
                className="px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cargar */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[80vh] flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Cargar Plantilla</h3>
              <button
                onClick={() => setShowLoadModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {isLoadingTemplates ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No tienes plantillas guardadas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="border-2 border-gray-200 rounded-xl p-4 hover:border-blue-400 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">
                            {template.name}
                          </h4>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {new Date(template.updatedAt).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {template.canvasWidth}x{template.canvasHeight}px
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleLoad(template.id)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                            title="Cargar plantilla"
                          >
                            <FolderOpen className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(template.id, template.name)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            title="Eliminar plantilla"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50">
              <button
                onClick={() => setShowLoadModal(false)}
                className="w-full px-5 py-2.5 rounded-lg border-2 border-gray-300 hover:bg-gray-100 font-semibold text-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
