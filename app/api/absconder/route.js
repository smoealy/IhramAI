// app/api/absconder/route.js

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';
import formidable from 'formidable';
import fs from 'fs';

export async function POST(req) {
  try {
    const form = formidable({ multiples: true });
    const buffers = await new Promise((resolve, reject) => {
      form.parse(req, async (err, fields, files) => {
        if (err) return reject(err);
        const uploadedFiles = Array.isArray(files.passport) ? files.passport : [files.passport];
        const fileBuffers = uploadedFiles.map(file => fs.readFileSync(file.filepath));
        resolve(fileBuffers);
      });
    });

    const worker = await createWorker('eng');
    const results = [];

    for (const buffer of buffers) {
      const {
        data: { text }
      } = await worker.recognize(buffer);

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
      if (lowerText.includes('tourist visa') || lowerText.includes('umrah visa') || lowerText.includes('hajj visa')) {
        score += 1;
        redFlags.push('Tourist or pilgrimage visa');
      }
      if (lowerText.includes('jeddah') || lowerText.includes('riyadh') || lowerText.includes('madinah')) {
        score += 1;
        redFlags.push('Port of entry detected');
      }
      if (lowerText.includes('no return') || lowerText.includes('overstay')) {
        score += 2;
        redFlags.push('Bad return history');
      }
      if (lowerText.includes('sponsor') || lowerText.includes('family in saudi')) {
        score += 1;
        redFlags.push('Family or sponsor in Saudi');
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

      results.push({
        status,
        color: label,
        reason: redFlags.join(', ') || 'No significant red flags detected',
        extracted: text.substring(0, 500) // For preview
      });
    }

    await worker.terminate();

    return NextResponse.json({ results });
  } catch (err) {
    console.error('❌ OCR API error:', err);
    return NextResponse.json({ error: 'Failed to analyze passport(s)' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
