'use client';

import { useState } from 'react';

export default function AbsconderCheck() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setError('');
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please upload a passport file');
      return;
    }

    setLoading(true);
    setResult(null);
    setError('');

    const formData = new FormData();
    formData.append('passport', file);

    try {
      const res = await fetch('/api/absconder', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
      } else {
        setResult(data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to analyze document.');
    }

    setLoading(false);
  };

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-green-700">Visa Risk Checker 🛂</h1>
      <p className="text-gray-600">
        Upload a passport image or PDF to evaluate absconder risk.
      </p>

      <div className="bg-white border rounded-lg shadow p-4 space-y-4">
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={handleFile}
          className="w-full border p-2 rounded"
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded">
          ⚠️ {error}
        </div>
      )}

      {result && (
        <div
          className={`p-4 rounded shadow text-white ${
            result.color === 'red'
              ? 'bg-red-600'
              : result.color === 'yellow'
              ? 'bg-yellow-500'
              : 'bg-green-600'
          }`}
        >
          <p className="text-xl font-bold">Status: {result.status}</p>
          <p className="mt-2">🧠 Reason: {result.reason}</p>
        </div>
      )}
    </main>
  );
}
