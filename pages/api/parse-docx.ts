import type { NextApiRequest, NextApiResponse } from "next";
import mammoth from "mammoth";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const chunks: Buffer[] = [];
  req.on("data", chunk => chunks.push(chunk));
  req.on("end", async () => {
    try {
      const buffer = Buffer.concat(chunks);
      const result = await mammoth.extractRawText({ buffer });
      const lines = result.value
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);
      res.status(200).json({ lines });
    } catch (err) {
      console.error("Errore parse-docx:", err);
      res.status(500).json({ error: "Errore durante il parsing del DOCX." });
    }
  });
}
