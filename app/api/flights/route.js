// app/api/flights/route.js

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function POST(req) {
  const { city, departureDate, adults } = await req.json();

  const client_id = process.env.AMADEUS_CLIENT_ID;
  const client_secret = process.env.AMADEUS_CLIENT_SECRET;

  try {
    // Step 1: Get access token
    const tokenRes = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id,
        client_secret,
      }),
    });

    const { access_token } = await tokenRes.json();

    // Step 2: Convert city to IATA airport code
    const locationRes = await fetch(
      `https://test.api.amadeus.com/v1/reference-data/locations?keyword=${city}&subType=AIRPORT&countryCode=&view=LIGHT`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const locationData = await locationRes.json();
    const origin = locationData?.data?.[0]?.iataCode || null;

    if (!origin) {
      return NextResponse.json({ error: 'Could not find airport for that city' }, { status: 400 });
    }

    // Step 3: Search flight offers to Jeddah (JED) or Madinah (MED)
    const flightRes = await fetch(
      `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${origin}&destinationLocationCode=JED&departureDate=${departureDate}&adults=${adults}&currencyCode=SAR&max=1`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const data = await flightRes.json();
    const price = data?.data?.[0]?.price?.total || 'N/A';

    return NextResponse.json({ price });
  } catch (err) {
    console.error('❌ Amadeus API Error:', err);
    return NextResponse.json({ error: 'Failed to fetch flight data' }, { status: 500 });
  }
}
