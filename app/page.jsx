'use client';

import { useState } from 'react';

export default function PlannerPage() {
  const [formData, setFormData] = useState({
    makkahHotel: '',
    madinahHotel: '',
    country: '',
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
            name="makkahHotel"
            placeholder="Makkah Hotel Name"
            className="border p-2 rounded"
            value={formData.makkahHotel}
            onChange={handleChange}
          />
          <input
            name="madinahHotel"
            placeholder="Madinah Hotel Name"
            className="border p-2 rounded"
            value={formData.madinahHotel}
            onChange={handleChange}
          />
          <input
            name="country"
            placeholder="Traveler Country"
            className="border p-2 rounded"
            value={formData.country}
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

          {["makkah", "madinah"].map((city) => (
            result[city] && (
              <div key={city} className="mb-4">
                <h3 className="text-lg font-semibold capitalize text-green-600">{city}:</h3>
                <p><strong>Hotel:</strong> {result[city].hotel}</p>
                <p><strong>Airfare:</strong> {result[city].breakdown.airfare} SAR</p>
                <p><strong>Hotel:</strong> {result[city].breakdown.hotel} SAR</p>
                <p><strong>Transport:</strong> {result[city].breakdown.transport} SAR</p>
                <p><strong>Visa:</strong> {result[city].breakdown.visa} SAR</p>
              </div>
            )
          ))}

          <hr className="my-2" />
          <p><strong>Total Price:</strong> SAR {result.price}</p>
          <p><strong>Ihram Token Discount:</strong> SAR {result.discount}</p>
          <p><strong>Tokens Needed:</strong> {result.tokens} $IHRAM</p>
        </section>
      )}
    </main>
  );
}
