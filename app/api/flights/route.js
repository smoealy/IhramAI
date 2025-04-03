// app/api/flights/route.js

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function POST(req) {
  const { city, departureDate, adults } = await req.json();

  if (!city || !departureDate || !adults) {
    return NextResponse.json(
      { error: 'Missing required fields: city, departureDate, or adults' },
      { status: 400 }
    );
  }

  const client_id = process.env.AMADEUS_CLIENT_ID;
  const client_secret = process.env.AMADEUS_CLIENT_SECRET;

  try {
    // Get access token
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

    // Get airport code using city name
    const locationRes = await fetch(
      `https://test.api.amadeus.com/v1/reference-data/locations?keyword=${encodeURIComponent(city)}&subType=AIRPORT,CITY&view=LIGHT`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const locationData = await locationRes.json();
    const locations = Array.isArray(locationData?.data) ? locationData.data : [];

    const match = locations.find(loc => loc.iataCode);
    const origin = match?.iataCode;

    if (!origin) {
      return NextResponse.json(
        { error: `Could not find airport for city "${city}"` },
        { status: 400 }
      );
    }

    // Get flight offer to Jeddah (JED)
    const flightRes = await fetch(
      `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${origin}&destinationLocationCode=JED&departureDate=${departureDate}&adults=${adults}&currencyCode=SAR&max=1`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const data = await flightRes.json();
    const price = data?.data?.[0]?.price?.total;

    if (!price || price === 'N/A') {
      return NextResponse.json(
        { error: 'No flight data available for that route or date.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ price });
  } catch (err) {
    console.error('❌ Amadeus API Error:', err);
    return NextResponse.json({ error: 'Failed to fetch flight data' }, { status: 500 });
  }
}
