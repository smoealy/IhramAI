'use client';

import { useState } from 'react';

export default function PlannerPage() {
  const [formData, setFormData] = useState({
    hotelName: '',
    city: '',
    date: '',
    duration: '',
    travelers: '',
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);
    setError('');

    try {
      const res = await fetch('/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Failed to fetch estimate.');
    }

    setLoading(false);
  };

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-4xl font-bold text-green-700">Ihram AI Planner</h1>
      <p className="text-lg text-gray-600">
        Personalized, logistics-powered journey planning for your Hajj or Umrah — powered by 15+ years of real experience.
      </p>

      <section className="p-4 bg-white border rounded-xl shadow space-y-4">
        <h2 className="text-xl font-semibold mb-2">📊 Get Real-Time Estimate</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <input
            name="hotelName"
            placeholder="Hotel Name"
            className="border p-2 rounded"
            value={formData.hotelName}
            onChange={handleChange}
          />
          <input
            name="city"
            placeholder="City (Makkah or Madinah)"
            className="border p-2 rounded"
            value={formData.city}
            onChange={handleChange}
          />
          <input
            name="date"
            type="date"
            className="border p-2 rounded"
            value={formData.date}
            onChange={handleChange}
          />
          <input
            name="duration"
            placeholder="Duration (nights)"
            className="border p-2 rounded"
            value={formData.duration}
            onChange={handleChange}
          />
          <input
            name="travelers"
            placeholder="Number of Travelers"
            className="border p-2 rounded"
            value={formData.travelers}
            onChange={handleChange}
          />
        </div>

        <button
          onClick={handleSubmit}
          className="px-6 py-2 bg-green-700 text-white rounded hover:bg-green-800"
        >
          {loading ? 'Calculating...' : 'Get Estimate'}
        </button>
      </section>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded shadow">
          ⚠️ {error}
        </div>
      )}

      {result && (
        <section className="p-4 bg-green-50 border border-green-200 rounded-xl shadow space-y-2">
          <h2 className="text-xl font-bold text-green-700">💡 Estimated Pricing</h2>
          <p><strong>Hotel:</strong> {result.hotel}</p>
          <p><strong>City:</strong> {result.city}</p>
          <p><strong>Nights:</strong> {result.nights}</p>
          <p><strong>Total Price:</strong> SAR {result.price}</p>
          <p><strong>Ihram Token Discount:</strong> SAR {result.discount}</p>
          <p><strong>Tokens Needed:</strong> {result.tokens} $IHRAM</p>
        </section>
      )}
    </main>
  );
}
