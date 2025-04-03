export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('passport');

    if (!file || !file.arrayBuffer) {
      return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    const ocrRes = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        apikey: process.env.OCR_SPACE_API_KEY || 'helloworld',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        base64Image: `data:${file.type};base64,${base64}`,
        language: 'eng',
        isOverlayRequired: 'false',
      }),
    });

    const json = await ocrRes.json();
    const text = json.ParsedResults?.[0]?.ParsedText || '';
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
    console.error('❌ OCR API error:', err);
    return NextResponse.json({ error: 'Failed to analyze passport' }, { status: 500 });
  }
}
