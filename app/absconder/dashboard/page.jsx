'use client';
import { useState } from 'react';

export default function AbsconderDashboard() {
  const [files, setFiles] = useState([]);
  const [meta, setMeta] = useState({
    visaType: 'Umrah',
    portOfEntry: 'Jeddah',
    returnTicket: 'yes',
    familyInSaudi: 'no',
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFiles = (e) => setFiles(Array.from(e.target.files));
  const handleChange = (e) => setMeta({ ...meta, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setLoading(true);
    const formData = new FormData();
    files.forEach((file) => formData.append('passports', file));
    Object.entries(meta).forEach(([key, value]) => formData.append(key, value));

    const res = await fetch('/api/absconder/batch', {
      method: 'POST',
      body: formData,
    });

    const json = await res.json();
    setResults(json.results || []);
    setLoading(false);
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">📊 Absconder Risk Dashboard</h1>

      <div className="space-y-4">
        <input type="file" multiple accept="image/*,.pdf" onChange={handleFiles} />
        
        <div className="grid grid-cols-2 gap-4">
          <label>
            Visa Type
            <select name="visaType" value={meta.visaType} onChange={handleChange} className="w-full border p-2 rounded">
              <option>Umrah</option>
              <option>Hajj</option>
              <option>Tourist</option>
            </select>
          </label>
          <label>
            Port of Entry
            <select name="portOfEntry" value={meta.portOfEntry} onChange={handleChange} className="w-full border p-2 rounded">
              <option>Jeddah</option>
              <option>Madinah</option>
              <option>Riyadh</option>
            </select>
          </label>
          <label>
            Return Ticket
            <select name="returnTicket" value={meta.returnTicket} onChange={handleChange} className="w-full border p-2 rounded">
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label>
            Family in Saudi?
            <select name="familyInSaudi" value={meta.familyInSaudi} onChange={handleChange} className="w-full border p-2 rounded">
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </label>
        </div>

        <button
          onClick={handleSubmit}
          className="mt-4 bg-green-600 text-white px-6 py-2 rounded"
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Run Batch Check'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-2">📄 Results</h2>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Filename</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Risk</th>
                <th className="border p-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="text-sm">
                  <td className="border p-2">{r.filename}</td>
                  <td className="border p-2">{r.status}</td>
                  <td className={`border p-2 font-bold ${r.color === 'red' ? 'text-red-600' : r.color === 'yellow' ? 'text-yellow-500' : 'text-green-600'}`}>
                    {r.color.toUpperCase()}
                  </td>
                  <td className="border p-2">{r.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
