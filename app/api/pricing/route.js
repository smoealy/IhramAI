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

    const filtered = hotelData.filter((row) =>
      row["Hotel Name"] === matchedHotelName &&
      row["City"]?.toLowerCase() === city?.toLowerCase()
    );

    if (!filtered.length) {
      return NextResponse.json({ error: "No matching hotel in city." }, { status: 404 });
    }

    const avgPricePerNight =
      filtered.reduce((sum, row) => sum + parseFloat(row.Price || 0), 0) / filtered.length;

    const nights = parseInt(duration);
    const numTravelers = parseInt(travelers);

    if (!nights || !numTravelers) {
      return NextResponse.json({ error: "Invalid duration or traveler count" }, { status: 400 });
    }

    // ✈️ Airfare by region
    const airfareMap = {
      "north america": 5000,
      "south asia": 1750,
      "far east": 3200,
      "africa": 3500,
      "gcc": 1500,
    };

    const countryLC = country?.toLowerCase() || "";
    let airfareCost = 3000;

    if (/pakistan|india|bangladesh/.test(countryLC)) airfareCost = airfareMap["south asia"];
    else if (/canada|usa/.test(countryLC)) airfareCost = airfareMap["north america"];
    else if (/malaysia|indonesia|singapore/.test(countryLC)) airfareCost = airfareMap["far east"];
    else if (/nigeria|kenya|uganda|sudan|uzbekistan|kazakhstan/.test(countryLC)) airfareCost = airfareMap["africa"];
    else if (/saudi|uae|oman|bahrain|kuwait|qatar|egypt|jordan|iraq|morocco/.test(countryLC)) airfareCost = airfareMap["gcc"];

    const visaCost = 560;
    const transportCost = 400 / numTravelers;
    const hotelCost = (avgPricePerNight / numTravelers) * nights;

    const perPerson = airfareCost + hotelCost + transportCost + visaCost;
    const totalPrice = perPerson * numTravelers;

    const discountRate = 0.12;
    const discounted = totalPrice * (1 - discountRate);

    return NextResponse.json({
      price: totalPrice.toFixed(2),
      tokens: discounted.toFixed(0),
      discount: (totalPrice - discounted).toFixed(2),
      hotel: matchedHotelName,
      nights,
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
