// app/api/absconder/route.js

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import FormData from 'form-data';
import { Readable } from 'stream';

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get('passport');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const formData = new FormData();
    formData.append('file', buffer, {
      filename: 'passport.pdf',
      contentType: file.type,
    });
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');

    const ocrRes = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        apikey: process.env.OCR_SPACE_API_KEY || 'helloworld',
        ...formData.getHeaders(),
      },
      body: formData,
    });

    const result = await ocrRes.json();
    const text = result?.ParsedResults?.[0]?.ParsedText || '';
    const lowerText = text.toLowerCase();

    // Risk rules
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

    return NextResponse.json({
      status,
      color: label,
      reason: redFlags.join(', ') || 'No red flags detected',
      extracted: text,
    });
  } catch (err) {
    console.error('❌ OCR API error:', err);
    return NextResponse.json({ error: 'Failed to analyze passport' }, { status: 500 });
  }
}
