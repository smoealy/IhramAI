// app/api/absconder/route.js

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get('passport');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString('base64');

    // OCR.Space API
    const res = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        apikey: process.env.OCR_SPACE_API_KEY || 'helloworld', // replace with real key
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        base64Image: `data:application/pdf;base64,${base64Image}`,
        language: 'eng',
        isOverlayRequired: 'false',
      }),
    });

    const ocr = await res.json();
    const text = ocr?.ParsedResults?.[0]?.ParsedText || '';
    const lowerText = text.toLowerCase();

    // Risk logic
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
    return NextResponse.json({ error: 'Failed to process document.' }, { status: 500 });
  }
}
