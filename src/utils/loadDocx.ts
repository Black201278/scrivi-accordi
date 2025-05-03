export async function loadDocx(file: File): Promise<string[]> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/parse-docx", {
      method: "POST",
      body: file, // inviamo direttamente il file, non FormData
    });

    if (!res.ok) {
      throw new Error("Errore nella risposta del server");
    }

    const data = await res.json();
    return data.lines || [];
  } catch (err) {
    console.error("Errore durante il parsing DOCX via API:", err);
    alert("Errore durante il caricamento del file DOCX.\nProva con un altro file o browser.");
    return [];
  }
}
