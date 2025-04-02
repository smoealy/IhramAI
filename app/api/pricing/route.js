export async function POST(req) {
  const body = await req.json();
  const { travelers, country, date, duration, hotel } = body;

  // --- Mock base prices per person (USD) ---
  const basePrices = {
    "3-star": 1200,
    "4-star": 1800,
    "5-star": 2500,
  };

  const durationMultiplier = {
    "5": 0.9,
    "7": 1,
    "10": 1.3,
  };

  const basePrice = basePrices[hotel] || 1500;
  const total =
    travelers * basePrice * (durationMultiplier[duration] || 1);

  // --- Ihram Token Discount ---
  const tokenDiscountRate = 0.12; // 12% discount with $IHRAM
  const discounted = total * (1 - tokenDiscountRate);
  const ihramTokens = discounted.toFixed(0); // 1 $IHRAM = $1 equivalent (mock)

  return Response.json({
    price: total.toFixed(2),
    tokens: ihramTokens,
    discount: (total - discounted).toFixed(2),
  });
}
