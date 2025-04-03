'use client';
import { useState } from 'react';

export default function AbsconderCheck() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFile = (e) => {
    setResult(null);
    setError('');
    setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) return setError('Please upload a passport file.');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('passport', file);

      const res = await fetch('/api/absconder', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
      } else {
        setResult(data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to analyze the passport.');
    }

    setLoading(false);
  };

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-green-700">Visa Risk Checker 🛂</h1>
      <p className="text-gray-600">Upload a passport image or PDF to evaluate absconder risk.</p>

      <input
        type="file"
        accept="image/*,.pdf"
        onChange={handleFile}
        className="block border p-2 rounded w-full"
      />

      <button
        onClick={handleSubmit}
        className="mt-4 px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 disabled:opacity-50"
        disabled={loading || !file}
      >
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded shadow">
          ⚠️ {error}
        </div>
      )}

      {result && (
        <div className={`mt-6 p-4 rounded shadow text-white ${result.color === 'red' ? 'bg-red-600' : result.color === 'yellow' ? 'bg-yellow-500' : 'bg-green-600'}`}>
          <p><strong>Status:</strong> {result.status}</p>
          <p><strong>Reason:</strong> {result.reason}</p>
        </div>
      )}
    </main>
  );
}
