'use client';
import { useState } from 'react';

export default function AbsconderDashboard() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async () => {
    setLoading(true);
    const newResults = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append('passport', file);

      try {
        const res = await fetch('/api/absconder', {
          method: 'POST',
          body: formData
        });

        const data = await res.json();
        newResults.push({ filename: file.name, ...data });
      } catch (err) {
        newResults.push({ filename: file.name, error: 'Failed to analyze' });
      }
    }

    setResults(newResults);
    setLoading(false);
  };

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">📊 Admin Dashboard — Visa Risk Checker</h1>
      <p className="text-gray-600">Upload multiple passport images or PDFs to check absconder risk.</p>

      <input
        type="file"
        multiple
        accept="image/*,.pdf"
        onChange={handleFileChange}
        className="border p-2 rounded"
      />

      <button
        onClick={handleSubmit}
        className="bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={loading || files.length === 0}
      >
        {loading ? 'Analyzing...' : 'Run Batch Check'}
      </button>

      <div className="mt-6 space-y-4">
        {results.map((res, idx) => (
          <div key={idx} className={`p-4 rounded border shadow ${res.color === 'red' ? 'bg-red-100' : res.color === 'yellow' ? 'bg-yellow-100' : 'bg-green-100'}`}>
            <strong>{res.filename}</strong>
            <p>Status: <span className={`font-bold ${res.color === 'red' ? 'text-red-700' : res.color === 'yellow' ? 'text-yellow-700' : 'text-green-700'}`}>{res.status}</span></p>
            <p>🧠 Reason: {res.reason || res.error}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
