// app/api/absconder/route.js

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

const analyzeText = (text) => {
  const lowerText = text.toLowerCase();
  let score = 0;
  const redFlags = [];

  // Heuristic: country
  if (lowerText.includes('pakistan') || lowerText.includes('bangladesh')) {
    score += 2;
    redFlags.push('High-risk nationality');
  }

  // Heuristic: age + gender (young male)
  if (
    lowerText.includes('male') &&
    lowerText.match(/\d{2}[-/ ]?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/)
  ) {
    score += 2;
    redFlags.push('Young male traveler');
  }

  // Heuristic: visa type
  if (lowerText.includes('tourist visa')) {
    score += 1;
    redFlags.push('Tourist visa');
  }

  // Heuristic: port of entry
  if (lowerText.includes('jeddah') || lowerText.includes('riyadh')) {
    score += 1;
    redFlags.push('Common port of entry');
  }

  // Heuristic: occupation
  if (lowerText.includes('student') || lowerText.includes('labor')) {
    score += 1;
    redFlags.push('Occupation: student or labor');
  }

  // Heuristic: return history (missing reentry stamps)
  if (lowerText.includes('no reentry') || lowerText.includes('no exit')) {
    score += 2;
    redFlags.push('No exit stamp detected');
  }

  // Heuristic: family in Saudi
  if (lowerText.includes('sponsor') || lowerText.includes('relative in saudi')) {
    score += 1;
    redFlags.push('Family in Saudi Arabia');
  }

  let label = 'green';
  let status = 'Low risk';
  if (score >= 6) {
    label = 'red';
    status = 'Likely absconder';
  } else if (score >= 3) {
    label = 'yellow';
    status = 'Moderate risk';
  }

  return { label, status, redFlags };
};

export async function POST(req) {
  try {
    const form = formidable({ multiples: true });
    const buffers = await new Promise((resolve, reject) => {
      form.parse(req, async (err, fields, files) => {
        if (err) return reject(err);
        const results = [];
        const fileList = Array.isArray(files.passport) ? files.passport : [files.passport];
        for (const file of fileList) {
          const buffer = fs.readFileSync(file.filepath);
          results.push({ filename: file.originalFilename, buffer });
        }
        resolve(results);
      });
    });

    const worker = await createWorker('eng');
    const results = [];

    for (const item of buffers) {
      const {
        data: { text },
      } = await worker.recognize(item.buffer);

      const analysis = analyzeText(text);
      results.push({
        filename: item.filename,
        status: analysis.status,
        color: analysis.label,
        reason: analysis.redFlags.join(', ') || 'No significant red flags',
        extracted: text,
      });
    }

    await worker.terminate();

    return NextResponse.json({ results });
  } catch (err) {
    console.error('❌ OCR API error:', err);
    return NextResponse.json({ error: 'Failed to process documents' }, { status: 500 });
  }
}
