// app/planner/page.jsx
export default function PlannerPage() {
  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-4xl font-bold text-green-700">Ihram AI Planner</h1>
      <p className="text-lg text-gray-600">
        Personalized, logistics-powered journey planning for your Hajj or Umrah — powered by 15+ years of real experience.
      </p>

      <section className="p-4 bg-gray-100 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-2">🧭 Start Your Journey</h2>
        <p>We'll guide you day by day, hour by hour.</p>
        {/* Placeholder for AI planner wizard */}
        <button className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          Launch Planner
        </button>
      </section>

      <section className="p-4 bg-white border rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-2">📊 Real Pricing Data</h2>
        <p>Compare pricing from B2B suppliers vs retail. Redeem points from Ihram Token.</p>
        {/* Placeholder for pricing tables or token rewards */}
      </section>
    </main>
  );
}
