'use client';
import { useState } from 'react';

export default function PlannerPage() {
  const [form, setForm] = useState({
    hotelName: '',
    city: '',
    date: '',
    duration: '',
    travelers: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const getEstimate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setResult(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-4xl font-bold text-green-700">Ihram AI Planner</h1>
      <p className="text-lg text-gray-600">
        Personalized, logistics-powered journey planning for your Hajj or Umrah — powered by 15+ years of real experience.
      </p>

      {/* Pricing Estimator */}
      <section className="p-4 bg-white border rounded-xl shadow space-y-4">
        <h2 className="text-xl font-semibold">📊 Estimate Your Package Cost</h2>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            name="hotelName"
            placeholder="Hotel Name"
            value={form.hotelName}
            onChange={handleChange}
            className="p-2 border rounded"
          />
          <input
            type="text"
            name="city"
            placeholder="City (e.g., Makkah)"
            value={form.city}
            onChange={handleChange}
            className="p-2 border rounded"
          />
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="p-2 border rounded"
          />
          <input
            type="number"
            name="duration"
            placeholder="Duration (nights)"
            value={form.duration}
            onChange={handleChange}
            className="p-2 border rounded"
          />
          <input
            type="number"
            name="travelers"
            placeholder="Number of Travelers"
            value={form.travelers}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <button
          onClick={getEstimate}
          className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          disabled={loading}
        >
          {loading ? 'Calculating...' : 'Get Estimate'}
        </button>

        {result && (
          <div className="mt-4 bg-gray-100 p-4 rounded text-green-700">
            <p><strong>Total Price:</strong> SAR {result.price}</p>
            <p><strong>Ihram Token Discount:</strong> SAR {result.discount}</p>
            <p><strong>Tokens Required:</strong> {result.tokens} $IHRAM</p>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-100 p-4 rounded text-red-700">
            ❌ {error}
          </div>
        )}
      </section>
    </main>
  );
}
