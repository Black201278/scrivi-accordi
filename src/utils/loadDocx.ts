import mammoth from "mammoth";

export async function loadDocx(file: File): Promise<string[]> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value || "";
    const lines = text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    return lines;
  } catch (err) {
    console.error("Errore durante il parsing DOCX con Mammoth:", err);
    alert("Errore durante il caricamento del file DOCX.\nProva con un altro file o browser.");
    return [];
  }
}
