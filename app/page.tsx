'use client'
import React, { useState, useEffect } from 'react';
import { Upload, Search, FileText, RotateCcw, BookOpen, Zap, Trash2, File, AlertCircle } from 'lucide-react';

// API functions (you'll import these from your lib/api.ts)
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"; // Replace with your actual URL

const queryDocuments = async (q: string) => {
  const res = await fetch(`${BASE_URL}/query?q=${encodeURIComponent(q)}`);
  return res.json();
};

const summarizeDocs = async () => {
  const res = await fetch(`${BASE_URL}/summarize-docs`);
  return res.json();
};

const summarizeDocsByVector = async () => {
  const res = await fetch(`${BASE_URL}/summarize-docs_byvector`);
  return res.json();
};

const uploadPdfs = async (files: File[]) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append("files", file);
  });
  const res = await fetch(`${BASE_URL}/upload-pdf/`, {
    method: "POST",
    body: formData,
  });
  return res.json();
};

const listDocuments = async () => {
  const res = await fetch(`${BASE_URL}/list-documents/`);
  return res.json();
};

const resetIndex = async () => {
  const res = await fetch(`${BASE_URL}/reset-index`, {
    method: "DELETE",
  });
  return res.json();
};

type SummaryDoc = {
  filename?: string;
  doc_id?: string;
  page_count?: number;
  summary: string;
  total_characters?: number;
  metadata?: {
    processing_date?: string;
  };
};

type SummaryResponse = {
  summary: SummaryDoc[];
  relations?: string;
};

type Source = {
  snippet: string;
  doc_id: string;
  score: number;
};

type ResponseData = {
  answer: string;
  sources: Source[];
};

type QueryResultType = {
  query: string;
  response: ResponseData;
};

type UploadResultItem = {
  filename?: string;
  status?: "success" | "error";
  detail?: string;
};

type UploadResults = {
  results: UploadResultItem[];
};

type DocumentItem = {
  filename?: string;
  name?: string;
  size?: number; // en bytes
  pages?: number;
  upload_date?: string; // o Date si ya la parseas
};


export default function RAGDashboard() {
  const [activeTab, setActiveTab] = useState('query');
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResultType | null>(null);
  const [summaryResult, setSummaryResult] = useState<SummaryResponse | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadResults, setUploadResults] = useState<UploadResults | null>(null);
  const [error, setError] = useState('');

  // Load documents on component mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const result = await listDocuments();
      console.log('Documents response:', result); // Debug log
      // Handle the actual API response format
      if (result.uploaded_files) {
        setDocuments(result.uploaded_files);
      } else {
        setDocuments(result);
      }
    } catch (err) {
      setError('Error al cargar documentos');
      console.error(err);
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    try {
      const result = await queryDocuments(query);
      console.log('Query response:', result); // Debug log
      setQueryResult(result);
    } catch (err) {
      setError('Error al realizar la consulta');
      console.error(err);
    }
    setLoading(false);
  };

  const handleSummarize = async (method: 'basic' | 'vector') => {
    setLoading(true);
    setError('');
    try {
      const result = method === 'basic' 
        ? await summarizeDocs() 
        : await summarizeDocsByVector();
      setSummaryResult(result);
      setActiveTab('summary');
    } catch (err) {
      setError('Error al generar resumen');
      console.error(err);
    }
    setLoading(false);
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setLoading(true);
    setError('');
    setUploadResults(null);
    try {
      const result = await uploadPdfs(selectedFiles);
      console.log('Upload response:', result); // Debug log
      setUploadResults(result);
      setSelectedFiles([]);
      await loadDocuments(); // Refresh document list
    } catch (err) {
      setError('Error al subir archivos');
      console.error(err);
    }
    setLoading(false);
  };

  const handleResetIndex = async () => {
    if (!confirm('¿Estás seguro de que quieres resetear el índice? Esto eliminará todos los documentos.')) {
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await resetIndex();
      setDocuments([]);
      setSummaryResult(null);
      setQueryResult(null);
      alert('Índice reseteado exitosamente');
    } catch (err) {
      setError('Error al resetear índice');
      console.error(err);
    }
    setLoading(false);
  };

  // const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>)) => {
  //   const files = Array.from(event.target.files);
  //   setSelectedFiles(files);
  // };
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
  if (!event.target.files) return;
  const files = Array.from(event.target.files);
  setSelectedFiles(files);
};

  const renderSummary = (summary: SummaryResponse | null) => {
    if (!summary) return null;
    
    if (summary.summary && Array.isArray(summary.summary)) {
      return (
        <div className="space-y-6">
          {summary.summary.map((doc: SummaryDoc, index: number) => (
            <div key={index} className="bg-gray-50 rounded-lg p-6 border">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-blue-600" />
                  {doc.filename || doc.doc_id}
                </h3>
                <span className="text-sm text-gray-500">
                  {doc.page_count} páginas
                </span>
              </div>
              
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">
                  {doc.summary}
                </div>
              </div>
              
              {doc.metadata && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Caracteres totales: {doc.total_characters?.toLocaleString()}</div>
                    {doc.metadata.processing_date && (
                      <div>Procesado: {new Date(doc.metadata.processing_date).toLocaleString()}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {summary.relations && (
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">
                Análisis de Relaciones entre Documentos
              </h3>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-blue-700">
                  {summary.relations}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <pre className="whitespace-pre-wrap text-sm text-gray-700">
          {JSON.stringify(summary, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            RAG AI Agent Dashboard
          </h1>
          <p className="text-gray-600">
            Gestiona documentos, realiza consultas inteligentes y genera resúmenes con IA
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center mb-8 bg-white rounded-lg shadow-sm p-2">
          {[
            { id: 'query', label: 'Consultas', icon: Search },
            { id: 'upload', label: 'Subir PDFs', icon: Upload },
            { id: 'documents', label: 'Documentos', icon: FileText },
            { id: 'summary', label: 'Resúmenes', icon: BookOpen }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center px-4 py-2 rounded-lg mx-1 transition-all ${
                activeTab === id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Query Tab */}
          {activeTab === 'query' && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-6 text-gray-800">
                Realizar Consulta
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium !text-gray-900 mb-2">
                    Escribe tu consulta
                  </label>
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ejemplo: ¿Dime algo sobre los documentos cargados mencionadas en los documentos?"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none !text-gray-900"
                    rows={3}
                  />
                </div>
                
                <button
                  onClick={handleQuery}
                  disabled={loading || !query.trim()}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Search className="mr-2 h-5 w-5" />
                  )}
                  {loading ? 'Consultando...' : 'Realizar Consulta'}
                </button>
              </div>

              {/* Query Results */}
              {queryResult && (
                <div className="mt-8 bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Resultado</h3>
                  
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700">
                      {queryResult.response.answer}
                    </div>
                  </div>
                  {queryResult.response.sources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="font-medium text-gray-700 mb-2">Fuentes:</h4>
                      <ul className="text-sm text-gray-600 list-disc ml-5">
                        {queryResult.response.sources.map((source, idx) => (
                          <li key={idx}>{source.snippet}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-6 text-gray-800">
                Subir Documentos PDF
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar archivos PDF
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {selectedFiles.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Archivos seleccionados ({selectedFiles.length}):
                    </h4>
                    <ul className="space-y-1">
                      {selectedFiles.map((file, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center">
                          <File className="h-4 w-4 mr-2" />
                          {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <button
                  onClick={handleFileUpload}
                  disabled={loading || selectedFiles.length === 0}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Upload className="mr-2 h-5 w-5" />
                  )}
                  {loading ? 'Subiendo...' : 'Subir Archivos'}
                </button>
              </div>
              {/* Upload Results */}
              {uploadResults && (
                <div className="mt-6 bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Resultados de la Carga</h3>
                  <div className="space-y-3">
                    {uploadResults.results?.map((result, index) => (
                      <div key={index} className={`p-4 rounded-lg border ${
                        typeof result === 'string' 
                          ? 'bg-green-50 border-green-200' 
                          : result.status === 'error' 
                            ? 'bg-red-50 border-red-200' 
                            : 'bg-blue-50 border-blue-200'
                      }`}>
                        {typeof result === 'string' ? (
                          <div className="flex items-center text-green-700">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                            <span>{result}</span>
                          </div>
                        ) : (
                          <div className="flex items-start">
                            <div className={`w-2 h-2 rounded-full mr-3 mt-2 ${
                              result.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                            }`}></div>
                            <div>
                              <div className="font-medium text-gray-800">{result.filename}</div>
                              <div className={`text-sm ${
                                result.status === 'error' ? 'text-red-600' : 'text-blue-600'
                              }`}>
                                {result.detail}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )) || (
                      <div className="text-gray-600">
                        {JSON.stringify(uploadResults, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Documentos Cargados
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={loadDocuments}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center transition-colors"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Actualizar
                  </button>
                  <button
                    onClick={handleResetIndex}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center transition-colors"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Reset Índice
                  </button>
                </div>
              </div>
              
              {documents.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>No hay documentos cargados</p>
                  <p className="text-sm">Sube algunos PDFs para comenzar</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {documents.map((doc, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center">
                        <FileText className="h-6 w-6 text-blue-600 mr-3" />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800">
                            {typeof doc === 'string' ? doc : (doc.filename || doc.name || `Documento ${index + 1}`)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {typeof doc === 'object' && doc.size ? `${(doc.size / 1024 / 1024).toFixed(2)} MB` : 'PDF'}
                            {typeof doc === 'object' && doc.pages && ` • ${doc.pages} páginas`}
                            {typeof doc === 'object' && doc.upload_date && ` • Subido: ${new Date(doc.upload_date).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Generar Resúmenes
                </h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <button
                  onClick={() => handleSummarize('basic')}
                  disabled={loading}
                  className="p-6 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-800 mb-2">Resumen Básico</h3>
                  <p className="text-sm text-gray-600">
                    Genera un resumen tradicional de todos los documentos
                  </p>
                </button>
                
                <button
                  onClick={() => handleSummarize('vector')}
                  disabled={loading}
                  className="p-6 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-800 mb-2">Resumen por Vector</h3>
                  <p className="text-sm text-gray-600">
                    Resumen avanzado basado en vectorización semántica
                  </p>
                </button>
              </div>

              {/* Summary Results */}
              {summaryResult && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Resultado del Resumen</h3>
                  {renderSummary(summaryResult)}
                </div>
              )}
              
              {loading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Generando resumen...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats Footer */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">{documents.length}</div>
              <div className="text-gray-600">Documentos Cargados</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">
                {summaryResult?.summary?.length || 0}
              </div>
              <div className="text-gray-600">Resúmenes Generados</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">
                {queryResult ? '1' : '0'}
              </div>
              <div className="text-gray-600">Última Consulta</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}