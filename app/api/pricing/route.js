export const runtime = "nodejs";

import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import csv from "csv-parser";
import Fuse from "fuse.js";

export async function POST(req) {
  const body = await req.json();
  console.log("📥 Request body:", body);

  const { travelers, country, date, duration, makkahHotel, madinahHotel } = body;
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

    const fuse = new Fuse(hotelData, { keys: ["Hotel Name"], threshold: 0.5 });

    const makkahMatch = fuse.search(makkahHotel).find(r => r.item.City?.toLowerCase() === "makkah")?.item;
    const madinahMatch = fuse.search(madinahHotel).find(r => r.item.City?.toLowerCase() === "madinah")?.item;

    if (!makkahMatch && !madinahMatch) {
      console.warn("⚠️ No matching hotel found in either city.");
      return NextResponse.json({ error: "No matching hotel found in either city." }, { status: 404 });
    }

    const getAvgHotel = (city, hotelName) => {
      const matchedRows = hotelData.filter(row =>
        row["Hotel Name"] === hotelName && row.City?.toLowerCase() === city
      );
      return matchedRows.length
        ? matchedRows.reduce((sum, row) => sum + parseFloat(row.Price || 0), 0) / matchedRows.length
        : 0;
    };

    const nights = parseInt(duration);
    const pax = parseInt(travelers);

    // Base pricing logic
    const visaCost = 560;
    const transportCost = 400 / pax;

    const regionAirfare = {
      "north america": 5000,
      "south asia": 1750,
      "far east": 3200,
      "africa": 3500,
      "gcc": 1500,
    };

    let airfareCost = 3000;
    const c = country?.toLowerCase();
    if (["pakistan", "india", "bangladesh"].includes(c)) airfareCost = regionAirfare["south asia"];
    else if (["usa", "canada"].includes(c)) airfareCost = regionAirfare["north america"];
    else if (["malaysia", "indonesia", "singapore"].includes(c)) airfareCost = regionAirfare["far east"];
    else if (["nigeria", "kenya", "sudan", "kazakhstan"].includes(c)) airfareCost = regionAirfare["africa"];
    else if (["uae", "oman", "egypt", "saudi arabia", "morocco"].includes(c)) airfareCost = regionAirfare["gcc"];

    const makkahHotelCost = makkahMatch
      ? (getAvgHotel("makkah", makkahMatch["Hotel Name"]) / pax) * nights
      : 0;

    const madinahHotelCost = madinahMatch
      ? (getAvgHotel("madinah", madinahMatch["Hotel Name"]) / pax) * nights
      : 0;

    const hotelTotal = makkahHotelCost + madinahHotelCost;

    const perPerson = airfareCost + hotelTotal + visaCost + transportCost;
    const totalPrice = perPerson * pax;
    const discountRate = 0.12;
    const discounted = totalPrice * (1 - discountRate);

    return NextResponse.json({
      price: totalPrice.toFixed(2),
      tokens: discounted.toFixed(0),
      discount: (totalPrice - discounted).toFixed(2),
      nights,
      city: "Makkah + Madinah",
      hotels: {
        makkah: makkahMatch?.["Hotel Name"] || "N/A",
        madinah: madinahMatch?.["Hotel Name"] || "N/A",
      },
      breakdown: {
        airfare: airfareCost.toFixed(2),
        hotel: hotelTotal.toFixed(2),
        visa: visaCost.toFixed(2),
        transport: transportCost.toFixed(2),
      },
    });
  } catch (err) {
    console.error("❌ Pricing API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
