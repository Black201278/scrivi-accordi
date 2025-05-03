import JSZip from "jszip";

export async function loadDocx(file: File): Promise<string[]> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error("File vuoto o non leggibile.");
    }

    const zip = await JSZip.loadAsync(arrayBuffer);
    const fileXml = zip.file("word/document.xml");
    if (!fileXml) throw new Error("Documento DOCX non valido.");

    const documentXml = await fileXml.async("string");
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(documentXml, "application/xml");

    const paras = Array.from(xmlDoc.getElementsByTagName("w:p"));
    const texts = paras.map(p => {
      const ts = Array.from(p.getElementsByTagName("w:t")).map(t => t.textContent || "");
      return ts.join("");
    });

    return texts;
  } catch (err) {
    console.error("Errore durante il parsing del DOCX:", err);
    alert("Errore durante il caricamento del file DOCX.\nProva da un altro browser o dispositivo.");
    return [];
  }
}
