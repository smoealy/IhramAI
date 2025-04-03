export const runtime = "nodejs";

import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import csv from "csv-parser";
import Fuse from "fuse.js";

export async function POST(req) {
  const body = await req.json();
  console.log("📥 Request body:", body);

  const {
    travelers,
    country,
    city,
    date,
    makkahHotel,
    madinahHotel,
    makkahNights,
    madinahNights,
  } = body;

  const filePath = path.join(process.cwd(), "data", "prices.csv");
  const hotelData = [];

  const readCSV = () =>
    new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => hotelData.push(row))
        .on("end", () => resolve())
        .on("error", (err) => reject(err));
    });

  try {
    await readCSV();

    const fuse = new Fuse(hotelData, {
      keys: ["Hotel Name"],
      threshold: 0.5,
    });

    const makkahMatch = fuse
      .search(makkahHotel)
      .find((r) => r.item.City?.toLowerCase() === "makkah")?.item;
    const madinahMatch = fuse
      .search(madinahHotel)
      .find((r) => r.item.City?.toLowerCase() === "madinah")?.item;

    if (!makkahMatch && !madinahMatch) {
      return NextResponse.json(
        { error: "No matching hotel found in either city." },
        { status: 404 }
      );
    }

    const getAvgHotel = (city, hotelName) => {
      const matchedRows = hotelData.filter(
        (row) =>
          row["Hotel Name"] === hotelName &&
          row.City?.toLowerCase() === city
      );
      return matchedRows.length
        ? matchedRows.reduce(
            (sum, row) => sum + parseFloat(row.Price || 0),
            0
          ) / matchedRows.length
        : 0;
    };

    const pax = parseInt(travelers);
    const nightsMakkah = parseInt(makkahNights);
    const nightsMadinah = parseInt(madinahNights);

    const visaCost = 560;
    const transportCost = 400 / pax;

    // REGION-BASED fallback airfare
    const regionAirfare = {
      "north america": 5000,
      "south asia": 1750,
      "far east": 3200,
      "africa": 3500,
      "gcc": 1500,
    };

    let estimatedAirfare = 3000;
    const c = country?.toLowerCase();
    if (["pakistan", "india", "bangladesh"].includes(c))
      estimatedAirfare = regionAirfare["south asia"];
    else if (["usa", "canada"].includes(c))
      estimatedAirfare = regionAirfare["north america"];
    else if (["malaysia", "indonesia", "singapore"].includes(c))
      estimatedAirfare = regionAirfare["far east"];
    else if (["nigeria", "kenya", "sudan", "kazakhstan"].includes(c))
      estimatedAirfare = regionAirfare["africa"];
    else if (["uae", "oman", "egypt", "saudi arabia", "morocco"].includes(c))
      estimatedAirfare = regionAirfare["gcc"];

    // ✈️ Try to fetch real-time airfare via Amadeus
    let airfareCost = estimatedAirfare;

    try {
      const flightRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/flights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city,
          departureDate: date,
          adults: travelers,
        }),
      });

      const flightJson = await flightRes.json();
      if (flightRes.ok && flightJson.price) {
        airfareCost = parseFloat(flightJson.price);
      } else {
        console.warn("⚠️ Falling back to region-based airfare");
      }
    } catch (e) {
      console.error("❌ Failed to fetch real-time flight data", e);
    }

    const makkahCost = makkahMatch
      ? getAvgHotel("makkah", makkahMatch["Hotel Name"]) * nightsMakkah
      : 0;

    const madinahCost = madinahMatch
      ? getAvgHotel("madinah", madinahMatch["Hotel Name"]) * nightsMadinah
      : 0;

    const hotelCostPerPassenger = (makkahCost + madinahCost) / pax;
    const perPerson =
      airfareCost + hotelCostPerPassenger + visaCost + transportCost;
    const totalPrice = perPerson * pax;
    const discountRate = 0.05;
    const discounted = totalPrice * (1 - discountRate);

    return NextResponse.json({
      price: totalPrice.toFixed(2),
      tokens: discounted.toFixed(0),
      discount: (totalPrice - discounted).toFixed(2),
      nights: nightsMakkah + nightsMadinah,
      city: "Makkah + Madinah",
      makkahHotel: makkahMatch?.["Hotel Name"] || "N/A",
      madinahHotel: madinahMatch?.["Hotel Name"] || "N/A",
      breakdown: {
        airfare: airfareCost.toFixed(2),
        hotel: hotelCostPerPassenger.toFixed(2),
        visa: visaCost.toFixed(2),
        transport: transportCost.toFixed(2),
      },
    });
  } catch (err) {
    console.error("❌ Pricing API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
