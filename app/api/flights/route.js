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

    const tokenJson = await tokenRes.json();
    const access_token = tokenJson.access_token;

    if (!access_token) {
      console.error('❌ Failed to retrieve access token:', tokenJson);
      return NextResponse.json({ error: 'Failed to authenticate with Amadeus' }, { status: 401 });
    }

    // Step 2: Convert city name to airport code
    const locationRes = await fetch(
      `https://test.api.amadeus.com/v1/reference-data/locations?keyword=${encodeURIComponent(
        city
      )}&subType=AIRPORT,CITY&view=LIGHT&page[limit]=5`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    let locationJson;
    try {
      locationJson = await locationRes.json();
    } catch (parseErr) {
      console.error('❌ Failed to parse location JSON:', parseErr);
      return NextResponse.json({ error: 'Invalid location response from Amadeus' }, { status: 502 });
    }

    const bestMatch = locationJson?.data?.find(loc => loc.iataCode && loc.subType === 'AIRPORT')
      || locationJson?.data?.find(loc => loc.iataCode);

    const origin = bestMatch?.iataCode;
    if (!origin) {
      console.warn(`⚠️ No airport found for city: ${city}`);
      return NextResponse.json({ error: `Could not find airport for city "${city}"` }, { status: 400 });
    }

    console.log(`✈️ Using IATA code for ${city}: ${origin}`);

    // Step 3: Search flight to Jeddah
    const flightRes = await fetch(
      `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${origin}&destinationLocationCode=JED&departureDate=${departureDate}&adults=${adults}&currencyCode=SAR&max=1`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    let flightData;
    try {
      flightData = await flightRes.json();
    } catch (parseErr) {
      console.error('❌ Failed to parse flight JSON:', parseErr);
      return NextResponse.json({ error: 'Invalid flight response from Amadeus' }, { status: 502 });
    }

    const price = flightData?.data?.[0]?.price?.total;

    if (!price || price === 'N/A') {
      console.warn(`⚠️ No price returned for ${origin} to JED on ${departureDate}`);
      return NextResponse.json({ error: 'No flights found for this route or date.' }, { status: 404 });
    }

    console.log(`✅ Found flight from ${origin} to JED: ${price} SAR`);

    return NextResponse.json({ price });
  } catch (err) {
    console.error('❌ Flights API Error:', err);
    return NextResponse.json({ error: 'Internal server error during flight fetch.' }, { status: 500 });
  }
}
