'use client';
import { useState } from 'react';

export default function AbsconderDashboard() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFiles([...e.target.files]);
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      setError('Please upload at least one file.');
      return;
    }

    setError('');
    setLoading(true);
    setResults([]);

    const formData = new FormData();
    files.forEach((file) => formData.append('passports', file));

    try {
      const res = await fetch('/api/absconder/batch', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (res.ok) {
        setResults(json.results);
      } else {
        setError(json.error || 'Something went wrong.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to submit files.');
    } finally {
      setLoading(false);
    }
  };

  const getBoxColor = (color) => {
    if (color === 'red') return 'border-red-600 bg-red-100';
    if (color === 'yellow') return 'border-yellow-500 bg-yellow-100';
    return 'border-green-600 bg-green-100';
  };

  const getBadgeColor = (color) => {
    if (color === 'red') return 'bg-red-600';
    if (color === 'yellow') return 'bg-yellow-500';
    return 'bg-green-600';
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">📊 Visa Risk Dashboard</h1>

      <p className="mb-2 text-sm text-gray-500">
        Upload multiple passport PDFs or images to check absconder risk.
      </p>

      <input
        type="file"
        accept="image/*,.pdf"
        multiple
        onChange={handleChange}
        className="mb-4"
      />
      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? 'Analyzing...' : 'Analyze Files'}
      </button>

      {error && <div className="mt-4 text-red-600 font-medium">{error}</div>}

      {results.length > 0 && (
        <div className="mt-6 space-y-4">
          {results.map((res, index) => (
            <div
              key={index}
              className={`border rounded p-4 ${getBoxColor(res.color)}`}
            >
              <h2 className="text-lg font-semibold">
                {res.filename || `File #${index + 1}`}
              </h2>
              <p className="mt-1">
                <strong>Status:</strong>{' '}
                <span
                  className={`inline-block px-2 py-0.5 rounded text-white text-sm font-semibold ${getBadgeColor(
                    res.color
                  )}`}
                >
                  {res.status}
                </span>
              </p>
              <p className="mt-1">
                <strong>🧠 Reason:</strong> {res.reason}
              </p>
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer">View Extracted Text</summary>
                <pre className="mt-2 whitespace-pre-wrap bg-white p-2 rounded border border-gray-300 max-h-64 overflow-y-auto">
                  {res.extracted}
                </pre>
              </details>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
