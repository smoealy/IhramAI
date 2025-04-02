"use client";
import { useState } from "react";

export default function PlannerPage() {
  const [form, setForm] = useState({
    travelers: 1,
    country: "Canada",
    date: "",
    duration: "7",
    hotel: "3-star",
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-center text-green-700 mb-6">
        Ihram Planner – Estimate Your Umrah
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="travelers"
          type="number"
          min="1"
          className="w-full p-2 border rounded"
          placeholder="Number of Travelers"
          value={form.travelers}
          onChange={handleChange}
        />
        <input
          name="country"
          type="text"
          className="w-full p-2 border rounded"
          placeholder="Country of Departure"
          value={form.country}
          onChange={handleChange}
        />
        <input
          name="date"
          type="date"
          className="w-full p-2 border rounded"
          value={form.date}
          onChange={handleChange}
        />
        <select
          name="duration"
          className="w-full p-2 border rounded"
          value={form.duration}
          onChange={handleChange}
        >
          <option value="5">5 Days</option>
          <option value="7">7 Days</option>
          <option value="10">10 Days</option>
        </select>
        <select
          name="hotel"
          className="w-full p-2 border rounded"
          value={form.hotel}
          onChange={handleChange}
        >
          <option value="3-star">3-Star</option>
          <option value="4-star">4-Star</option>
          <option value="5-star">5-Star</option>
        </select>

        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full"
        >
          {loading ? "Calculating..." : "Estimate Price"}
        </button>
      </form>

      {result && (
        <div className="mt-8 bg-gray-100 p-4 rounded shadow text-center">
          <h2 className="text-xl font-semibold mb-2">Your Estimate</h2>
          <p>Total Cost: <strong>${result.price}</strong></p>
          <p>Ihram Token Value: <strong>{result.tokens} $IHRAM</strong></p>
          <p>You Save: <strong>${result.discount}</strong> using token pricing</p>
        </div>
      )}
    </div>
  );
}
