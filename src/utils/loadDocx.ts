import mammoth from "mammoth";

export async function loadDocx(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
}
