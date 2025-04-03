// app/api/absconder/route.js

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('passport');

    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'Invalid file upload' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const worker = await createWorker('eng');
    const {
      data: { text },
    } = await worker.recognize(buffer);
    await worker.terminate();

    const lowerText = text.toLowerCase();

    // --- Basic heuristics ---
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

    // --- Final label ---
    let label = 'green';
    let status = 'Low risk';
    if (score >= 5) {
      label = 'red';
      status = 'Likely absconder';
    } else if (score >= 3) {
      label = 'yellow';
      status = 'Moderate risk';
    }

    return NextResponse.json({
      status,
      color: label,
      reason: redFlags.join(', ') || 'No significant red flags detected',
      extracted: text,
    });
  } catch (err) {
    console.error('❌ Absconder Check Error:', err);
    return NextResponse.json({ error: 'Failed to analyze passport' }, { status: 500 });
  }
}
