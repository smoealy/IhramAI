// app/absconder/page.jsx (stub layout)
'use client';
import { useState } from 'react';

export default function AbsconderCheck() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);

  const handleFile = (e) => setFile(e.target.files[0]);

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append('passport', file);

    const res = await fetch('/api/absconder', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    setResult(data);
  };

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Visa Risk Checker</h1>
      <input type="file" accept="image/*,.pdf" onChange={handleFile} />
      <button onClick={handleSubmit} className="mt-4 bg-green-600 text-white px-4 py-2 rounded">Analyze</button>

      {result && (
        <div className={`mt-6 p-4 rounded text-white ${result.color === 'red' ? 'bg-red-600' : result.color === 'yellow' ? 'bg-yellow-500' : 'bg-green-600'}`}>
          <p><strong>Status:</strong> {result.status}</p>
          <p><strong>Reason:</strong> {result.reason}</p>
        </div>
      )}
    </main>
  );
}
