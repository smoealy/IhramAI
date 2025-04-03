// app/api/absconder/batch/route.js

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'iad1';

import { NextResponse } from 'next/server';
import formidable from 'formidable';
import fs from 'fs';

async function analyzeText(text) {
  const lowerText = text.toLowerCase();
  let score = 0;
  const redFlags = [];

  if (lowerText.includes('pakistan') || lowerText.includes('bangladesh')) {
    score += 2;
    redFlags.push('High-risk nationality');
  }
  if (
    lowerText.includes('male') &&
    lowerText.match(/\d{2}[-/ ]?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/)
  ) {
    score += 2;
    redFlags.push('Young male traveler');
  }
  if (lowerText.includes('student') || lowerText.includes('labor')) {
    score += 1;
    redFlags.push('Occupation: student or labor');
  }

  let label = 'green';
  let status = 'Low risk';
  if (score >= 5) {
    label = 'red';
    status = 'Likely absconder';
  } else if (score >= 3) {
    label = 'yellow';
    status = 'Moderate risk';
  }

  return {
    status,
    color: label,
    reason: redFlags.join(', ') || 'No significant red flags detected',
    extracted: text,
  };
}

export async function POST(req) {
  const form = formidable({ multiples: true });

  const files = await new Promise((resolve, reject) => {
    form.parse(req, async (err, fields, files) => {
      if (err) return reject(err);
      const uploads = Array.isArray(files.passports) ? files.passports : [files.passports];
      resolve(uploads);
    });
  });

  const results = [];

  for (const file of files) {
    const buffer = fs.readFileSync(file.filepath);
    const base64 = buffer.toString('base64');

    const res = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        apikey: process.env.OCR_SPACE_API_KEY || 'helloworld',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        base64Image: `data:${file.mimetype};base64,${base64}`,
        isTable: 'false',
        OCREngine: '2',
      }),
    });

    const json = await res.json();
    const text = json.ParsedResults?.[0]?.ParsedText || '';
    const result = await analyzeText(text);
    result.filename = file.originalFilename;
    results.push(result);
  }

  return NextResponse.json({ results });
}
