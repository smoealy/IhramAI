// app/api/pricing/route.js

export const runtime = "nodejs";

import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import csv from "csv-parser";
import Fuse from "fuse.js";

const visaCost = 560;
const transportCost = 400;

const regionAirfare = {
  "north america": 5000,
  "south asia": 1750,
  "far east asia": 3200,
  "africa and central asia": 3500,
  "gcc and mena": 1500,
};

export async function POST(req) {
  const body = await req.json();
  console.log("📥 Request body:", body);

  const { travelers, city, country, date, duration, hotelName } = body;
  const travelerCount = parseInt(travelers);
  const totalNights = parseInt(duration);

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

    // --- Fuzzy match hotel name ---
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

    // --- Calculate hotel cost per traveler ---
    const avgRoomRate =
      matches.reduce((sum, row) => sum + parseFloat(row.Price || 0), 0) / matches.length;

    const hotelCostPerTraveler = (avgRoomRate * totalNights) / travelerCount;

    // --- Determine airfare ---
    const region = country?.toLowerCase().trim();
    const airfare = regionAirfare[region] || 2500; // Default fallback

    // --- Transport cost per traveler ---
    const transportPerTraveler = transportCost / travelerCount;

    // --- Total per person ---
    const perPersonTotal = airfare + hotelCostPerTraveler + visaCost + transportPerTraveler;
    const totalPackage = perPersonTotal * travelerCount;
    const discountRate = 0.12;
    const discounted = totalPackage * (1 - discountRate);

    return NextResponse.json({
      hotel: matchedHotelName,
      city,
      nights: totalNights,
      travelers: travelerCount,
      airfare,
      hotelCostPerTraveler: hotelCostPerTraveler.toFixed(2),
      visaCost,
      transportPerTraveler: transportPerTraveler.toFixed(2),
      price: totalPackage.toFixed(2),
      tokens: discounted.toFixed(0),
      discount: (totalPackage - discounted).toFixed(2),
    });
  } catch (err) {
    console.error("❌ Pricing API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
