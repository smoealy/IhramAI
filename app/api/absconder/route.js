// app/api/absconder/route.js

export const runtime = 'nodejs'; // ✅ Modern way to define runtime in Next.js

import { NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';
import { Readable } from 'stream';

// Helper function to convert web ReadableStream to Node stream buffer
async function getBufferFromRequest(req) {
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    throw new Error('Unsupported content-type. Must be multipart/form-data');
  }

  const boundary = contentType.split('boundary=')[1];
  const body = await req.arrayBuffer();
  const rawBody = Buffer.from(body);

  // Manually extract file content from multipart
  const parts = rawBody
    .toString()
    .split(boundary)
    .filter((part) => part.includes('filename='))
    .map((part) => part.trim());

  if (parts.length === 0) throw new Error('No file uploaded.');

  const start = parts[0].indexOf('\r\n\r\n') + 4;
  const end = parts[0].lastIndexOf('--') === -1 ? parts[0].length : parts[0].lastIndexOf('--');
  const fileBuffer = Buffer.from(parts[0].slice(start, end), 'binary');

  return fileBuffer;
}

export async function POST(req) {
  try {
    const buffer = await getBufferFromRequest(req);

    const worker = await createWorker('eng');
    const {
      data: { text },
    } = await worker.recognize(buffer);
    await worker.terminate();

    const lowerText = text.toLowerCase();
    let score = 0;
    const redFlags = [];

    // --- Heuristics for absconder risk ---
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
      reason: redFlags.join(', ') || 'No significant red flags detected',
      extracted: text,
    });
  } catch (err) {
    console.error('❌ OCR API error:', err);
    return NextResponse.json({ error: err.message || 'Failed to analyze passport' }, { status: 500 });
  }
}
