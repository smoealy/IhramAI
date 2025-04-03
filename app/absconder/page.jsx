'use client';
import { useState } from 'react';

export default function AbsconderDashboard() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
    setResults([]);
  };

  const handleSubmit = async () => {
    if (!files.length) return;

    setLoading(true);
    const newResults = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append('passport', file);

      try {
        const res = await fetch('/api/absconder', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        newResults.push({
          filename: file.name,
          ...data,
        });
      } catch (err) {
        newResults.push({
          filename: file.name,
          status: 'Error',
          color: 'gray',
          reason: 'Failed to analyze',
        });
      }
    }

    setResults(newResults);
    setLoading(false);
  };

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-green-700">Visa Risk Checker 🛂</h1>
      <p className="text-gray-600">Upload passport images or PDFs to evaluate absconder risk using AI + heuristics.</p>

      <div className="space-y-4 p-4 border bg-white rounded-xl shadow">
        <input type="file" multiple accept="image/*,.pdf" onChange={handleFileChange} />
        <button
          onClick={handleSubmit}
          className="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800"
        >
          {loading ? 'Analyzing...' : 'Analyze Files'}
        </button>
      </div>

      {results.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">📊 Results</h2>
          <div className="grid grid-cols-1 gap-4">
            {results.map((r, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl shadow border text-white ${
                  r.color === 'red'
                    ? 'bg-red-600'
                    : r.color === 'yellow'
                    ? 'bg-yellow-500 text-black'
                    : r.color === 'green'
                    ? 'bg-green-600'
                    : 'bg-gray-500'
                }`}
              >
                <h3 className="text-lg font-bold">{r.filename}</h3>
                <p><strong>Status:</strong> {r.status}</p>
                <p><strong>Reason:</strong> {r.reason}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
