export const runtime = "nodejs";

import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import csv from "csv-parser";

export async function POST(req) {
  const body = await req.json();
  console.log("📥 Received pricing request:", body);

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

    const matches = hotelData.filter((row) => {
      const hotel = row["Hotel Name"] || "";
      const rowCity = row["City"] || "";
      return (
        hotel.toLowerCase().includes(hotelName?.toLowerCase?.() || "") &&
        rowCity.toLowerCase() === city?.toLowerCase?.()
      );
    });

    if (!matches.length) {
      console.warn("⚠️ No matches found for", hotelName, city);
      return NextResponse.json(
        { error: "No matching hotel found." },
        { status: 404 }
      );
    }

    const avgPricePerNight =
      matches.reduce((sum, row) => sum + parseFloat(row.Price || 0), 0) /
      matches.length;

    const totalNights = parseInt(duration || 1);
    const totalPrice = avgPricePerNight * totalNights * travelers;

    const discountRate = 0.12;
    const discounted = totalPrice * (1 - discountRate);

    return NextResponse.json({
      price: totalPrice.toFixed(2),
      tokens: discounted.toFixed(0),
      discount: (totalPrice - discounted).toFixed(2),
      hotel: hotelName,
      nights: totalNights,
      city,
    });
  } catch (err) {
    console.error("❌ Pricing API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
