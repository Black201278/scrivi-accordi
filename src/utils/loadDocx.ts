export async function loadDocx(file: File): Promise<string[]> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/parse-docx", {
    method: "POST",
    body: await file.arrayBuffer(), // manda binario direttamente
    headers: {
      "Content-Type": "application/octet-stream",
    }
  });

  if (!res.ok) {
    throw new Error("Errore lato server durante il parsing DOCX");
  }

  const data = await res.json();
  return data.lines || [];
}
