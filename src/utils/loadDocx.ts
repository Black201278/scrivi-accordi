import JSZip from "jszip";

export async function loadDocx(file: File): Promise<string[]> {
  // 1) Leggi l’arrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  // 2) Apri lo zip
  const zip = await JSZip.loadAsync(arrayBuffer);
  // 3) Prendi word/document.xml
  const fileXml = zip.file("word/document.xml");
  if (!fileXml) throw new Error("Documento DOCX non valido.");
  const documentXml = await fileXml.async("string");
  // 4) Parsifica l’XML
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(documentXml, "application/xml");
  // 5) Per ogni <w:p> (paragrafo) estrai i suoi <w:t>
  const paras = Array.from(xmlDoc.getElementsByTagName("w:p"));
  const texts = paras.map(p => {
    const ts = Array.from(p.getElementsByTagName("w:t")).map(t => t.textContent || "");
    return ts.join("");  // unisci i segmenti di testo di quel paragrafo
  });
  // 6) Ritorna l’array di paragrafi (anche vuoti)
  return texts;
}
