import type { NextApiRequest, NextApiResponse } from 'next';
import mammoth from 'mammoth';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb', // aumenta se servono doc più pesanti
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end("Method not allowed");
  }

  try {
    const buffer = Buffer.from(req.body);
    const result = await mammoth.extractRawText({ buffer });
    const lines = result.value
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);
    res.status(200).json({ lines });
  } catch (err) {
    console.error("Errore API parsing DOCX:", err);
    res.status(500).json({ error: 'Errore nel parsing del file DOCX' });
  }
}
