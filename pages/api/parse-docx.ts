import formidable from "formidable";
import fs from "fs";
import mammoth from "mammoth";
import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "Errore durante il parsing del file" });

    const file = files.file?.[0];
    if (!file) return res.status(400).json({ error: "File mancante" });

    try {
      const buffer = fs.readFileSync(file.filepath);
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value || "";
      const lines = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);
      res.status(200).json({ lines });
    } catch (error) {
      res.status(500).json({ error: "Errore durante l'elaborazione del file DOCX" });
    }
  });
}
