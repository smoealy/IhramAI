// app/api/pricing/route.js

export const runtime = "nodejs";

import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import csv from "csv-parser";
import Fuse from "fuse.js";

export async function POST(req) {
  const body = await req.json();
  console.log("📥 Request body:", body);

  const { travelers, city, country, date, duration, hotelName } = body;
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

    // --- Fuzzy Hotel Matching ---
    const fuse = new Fuse(hotelData, {
      keys: ["Hotel Name"],
      threshold: 0.4,
    });
    const fuzzyResults = fuse.search(hotelName);
    const matchedHotelName = fuzzyResults[0]?.item?.["Hotel Name"] || null;

    if (!matchedHotelName) {
      console.warn("⚠️ No fuzzy match found for", hotelName, city);
      return NextResponse.json({ error: "No matching hotel found." }, { status: 404 });
    }

    const matches = hotelData.filter((row) => {
      return (
        row["Hotel Name"] === matchedHotelName &&
        row["City"]?.toLowerCase() === city?.toLowerCase()
      );
    });

    if (!matches.length) {
      console.warn("⚠️ No matches found for", matchedHotelName, city);
      return NextResponse.json({ error: "No matching hotel in city." }, { status: 404 });
    }

    const avgPricePerNight =
      matches.reduce((sum, row) => sum + parseFloat(row.Price || 0), 0) /
      matches.length;

    const totalNights = parseInt(duration);
    const numTravelers = parseInt(travelers);

    // --- Visa ---
    const visaCost = 560;

    // --- Transport ---
    const transportVehicleCost = 400;
    const transportCost = transportVehicleCost / numTravelers;

    // --- Airfare by region ---
    const regionAirfare = {
      "north america": 5000,
      "south asia": 1750,
      "far east": 3200,
      "africa": 3500,
      "gcc": 1500,
    };

    let airfareCost = 3000; // default
    const countryLC = country?.toLowerCase() || "";

    if (["pakistan", "india", "bangladesh"].includes(countryLC)) airfareCost = regionAirfare["south asia"];
    else if (["canada", "usa"].includes(countryLC)) airfareCost = regionAirfare["north america"];
    else if (["malaysia", "indonesia", "singapore"].includes(countryLC)) airfareCost = regionAirfare["far east"];
    else if (["nigeria", "kenya", "uganda", "sudan", "uzbekistan", "kazakhstan"].includes(countryLC)) airfareCost = regionAirfare["africa"];
    else if (["saudi arabia", "uae", "oman", "bahrain", "kuwait", "qatar", "egypt", "jordan", "iraq", "morocco"].includes(countryLC)) airfareCost = regionAirfare["gcc"];

    // --- Hotel cost ---
    const hotelCost = (avgPricePerNight / numTravelers) * totalNights;

    // --- Total per person and total for group ---
    const perPerson = airfareCost + hotelCost + transportCost + visaCost;
    const totalPrice = perPerson * numTravelers;

    // --- Ihram Token Discount ---
    const discountRate = 0.12;
    const discounted = totalPrice * (1 - discountRate);

    return NextResponse.json({
      price: totalPrice.toFixed(2),
      tokens: discounted.toFixed(0),
      discount: (totalPrice - discounted).toFixed(2),
      hotel: matchedHotelName,
      nights: totalNights,
      city,
      breakdown: {
        airfare: airfareCost.toFixed(2),
        hotel: hotelCost.toFixed(2),
        transport: transportCost.toFixed(2),
        visa: visaCost.toFixed(2),
      },
    });
  } catch (err) {
    console.error("❌ Pricing API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
