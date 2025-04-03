// app/absconder/dashboard/page.jsx
'use client';

import { useState } from 'react';

export default function AbsconderDashboard() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [filter, setFilter] = useState('all');

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    files.forEach((file) => formData.append('passports', file));

    const res = await fetch('/api/absconder/batch', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    setResults(data.results || []);
  };

  const filteredResults = results.filter((r) => {
    if (filter === 'all') return true;
    return r.color === filter;
  });

  const exportFlagged = () => {
    const flagged = results.filter((r) => r.color !== 'green');
    const csv = ['Filename,Status,Reason'].concat(
      flagged.map((r) => `${r.filename},${r.status},${r.reason}`)
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'flagged_users.csv';
    link.click();
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">📊 Absconder Dashboard</h1>

      <div className="mb-4">
        <input type="file" multiple accept="image/*,.pdf" onChange={handleFileChange} />
        <button onClick={handleSubmit} className="ml-4 bg-blue-600 text-white px-4 py-2 rounded">Analyze</button>
        <button onClick={exportFlagged} className="ml-2 bg-yellow-500 text-white px-4 py-2 rounded">Export Flagged</button>
      </div>

      <div className="mb-4">
        <label className="mr-2 font-medium">Filter:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border px-2 py-1">
          <option value="all">All</option>
          <option value="red">Red (Likely)</option>
          <option value="yellow">Yellow (Moderate)</option>
          <option value="green">Green (Low)</option>
        </select>
      </div>

      {filteredResults.length > 0 && (
        <table className="w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">Filename</th>
              <th className="border p-2 text-left">Status</th>
              <th className="border p-2 text-left">Reason</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.map((r, idx) => (
              <tr key={idx} className={
                r.color === 'red' ? 'bg-red-100' :
                r.color === 'yellow' ? 'bg-yellow-100' :
                'bg-green-100'}>
                <td className="border p-2">{r.filename}</td>
                <td className="border p-2 font-semibold">{r.status}</td>
                <td className="border p-2">{r.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {filteredResults.length === 0 && (
        <p className="mt-4 text-gray-500">No results yet. Upload passport files to begin analysis.</p>
      )}
    </main>
  );
}
