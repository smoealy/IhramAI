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

  const { travelers, city, date, duration, hotelName } = body;
  const filePath = path.join(process.cwd(), "public", "data", "prices.csv");
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

    // --- Fuzzy Search using Fuse.js ---
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
    const totalPrice = avgPricePerNight * totalNights * travelers;
    const discountRate = 0.12;
    const discounted = totalPrice * (1 - discountRate);

    return NextResponse.json({
      price: totalPrice.toFixed(2),
      tokens: discounted.toFixed(0),
      discount: (totalPrice - discounted).toFixed(2),
      hotel: matchedHotelName,
      nights: totalNights,
      city,
    });
  } catch (err) {
    console.error("❌ Pricing API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
