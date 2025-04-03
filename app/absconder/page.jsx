'use client';
import { useState } from 'react';

export default function AbsconderCheck() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFile = (e) => {
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result.split(',')[1]); // Remove data:image/... prefix
    reader.readAsDataURL(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!image) return;
    setLoading(true);
    setResult(null);

    const res = await fetch('/api/absconder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: image }),
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">🛂 Visa Risk Checker</h1>
      <input type="file" accept="image/*" onChange={handleFile} />
      <button onClick={handleSubmit} className="mt-4 bg-green-600 text-white px-4 py-2 rounded">
        {loading ? 'Analyzing...' : 'Analyze Passport'}
      </button>

      {result && (
        <div className={`mt-6 p-4 rounded text-white ${result.color === 'red' ? 'bg-red-600' : result.color === 'yellow' ? 'bg-yellow-500' : 'bg-green-600'}`}>
          <p><strong>Status:</strong> {result.status}</p>
          <p><strong>Reason:</strong> {result.reason}</p>
        </div>
      )}
    </main>
  );
}
