export async function loadDocx(file: File): Promise<string[]> {
  try {
    const reader = new FileReader();
    return await new Promise((resolve, reject) => {
      reader.onload = () => {
        try {
          const text = reader.result as string;
          const lines = text
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line.length > 0);
          resolve(lines);
        } catch (err) {
          console.error("Errore parsing testo:", err);
          alert("Errore nel caricamento del testo.");
          resolve([]);
        }
      };
      reader.onerror = () => {
        console.error("Errore nel FileReader:", reader.error);
        alert("Errore nel caricamento del file.");
        resolve([]);
      };
      reader.readAsText(file);  // 👈 converte il file in semplice testo
    });
  } catch (err) {
    console.error("Errore generale:", err);
    alert("Errore durante il caricamento. Usa un file di testo semplice.");
    return [];
  }
}
