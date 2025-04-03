// app/api/pricing/route.js

export const runtime = "nodejs";

import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { NextResponse } from "next/server";

export async function POST(req) {
  const body = await req.json();
  const { travelers, city, hotelName, duration } = body;

  console.log("📥 Request body:", body);

  const filePath = path.join(process.cwd(), "app", "data", "prices.csv");
  const hotelData = [];

  const readCSV = () =>
    new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => hotelData.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

  try {
    await readCSV();

    const matches = hotelData.filter((row) => {
      const h = row["Hotel Name"];
      const c = row["City"];
      return (
        h && c &&
        h.toLowerCase().includes(hotelName?.toLowerCase() || "") &&
        c.toLowerCase() === (city?.toLowerCase() || "")
      );
    });

    if (!matches.length) {
      console.warn(`⚠️ No matches found for ${hotelName} in ${city}`);
      return NextResponse.json({ error: "No matching hotel found." }, { status: 404 });
    }

    const avgPricePerNight = matches.reduce((sum, row) => {
      return sum + parseFloat(row.Price || "0");
    }, 0) / matches.length;

    const totalNights = parseInt(duration);
    const totalPrice = avgPricePerNight * totalNights * travelers;

    const discountRate = 0.12;
    const discounted = totalPrice * (1 - discountRate);

    return NextResponse.json({
      hotel: hotelName,
      city,
      nights: totalNights,
      travelers,
      price: totalPrice.toFixed(2),
      discount: (totalPrice - discounted).toFixed(2),
      tokens: discounted.toFixed(0),
    });
  } catch (err) {
    console.error("❌ Pricing API error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
