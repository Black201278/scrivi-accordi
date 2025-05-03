export async function loadTxt(file: File): Promise<string[]> {
    try {
      const text = await file.text();
      const lines = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);
      return lines;
    } catch (err) {
      console.error("Errore durante il caricamento TXT:", err);
      return [];
    }
  }
  