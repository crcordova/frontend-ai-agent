// lib/api.ts
const BASE_URL = process.env.NEXT_PUBLIC_URL_API || "http://localhost:8000"; // o https://tudominio.com

export async function queryDocuments(q: string) {
  const res = await fetch(`${BASE_URL}/query?q=${encodeURIComponent(q)}`);
  return res.json();
}

export async function summarizeDocs() {
  const res = await fetch(`${BASE_URL}/summarize-docs`);
  return res.json();
}

export async function summarizeDocsByVector() {
  const res = await fetch(`${BASE_URL}/summarize-docs_byvector`);
  return res.json();
}

export async function uploadPdfs(files: File[]) {
  const formData = new FormData();
  files.forEach(file => {
    formData.append("files", file);
  });

  const res = await fetch(`${BASE_URL}/upload-pdf/`, {
    method: "POST",
    body: formData,
  });
  return res.json();
}

export async function listDocuments() {
  const res = await fetch(`${BASE_URL}/list-documents/`);
  return res.json();
}

export async function resetIndex() {
  const res = await fetch(`${BASE_URL}/reset-index`, {
    method: "DELETE",
  });
  return res.json();
}
