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
    makkahHotelName,
    makkahNights,
    madinahHotelName,
    madinahNights,
    city, // still used for backward compatibility (e.g., just "Makkah")
    country,
    travelers,
    date,
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

  await readCSV();

  const fuse = new Fuse(hotelData, {
    keys: ["Hotel Name"],
    threshold: 0.4,
  });

  const matchHotel = (name, city) => {
    const fuzzy = fuse.search(name);
    const matched = fuzzy.find((item) => item.item["City"].toLowerCase() === city.toLowerCase());
    return matched?.item?.["Hotel Name"] || null;
  };

  const getAvgPrice = (hotelName, city) => {
    const matches = hotelData.filter(
      (row) =>
        row["Hotel Name"] === hotelName &&
        row["City"]?.toLowerCase() === city?.toLowerCase()
    );

    if (!matches.length) return 0;
    return (
      matches.reduce((sum, row) => sum + parseFloat(row.Price || 0), 0) /
      matches.length
    );
  };

  const numTravelers = parseInt(travelers);
  const nightsMakkah = parseInt(makkahNights || 0);
  const nightsMadinah = parseInt(madinahNights || 0);

  // --- Match hotels ---
  const matchedMakkah = makkahHotelName ? matchHotel(makkahHotelName, "Makkah") : null;
  const matchedMadinah = madinahHotelName ? matchHotel(madinahHotelName, "Madinah") : null;

  if (!matchedMakkah && !matchedMadinah) {
    return NextResponse.json({ error: "No matching hotel found in either city." }, { status: 404 });
  }

  // --- Avg hotel cost ---
  const avgMakkah = matchedMakkah ? getAvgPrice(matchedMakkah, "Makkah") : 0;
  const avgMadinah = matchedMadinah ? getAvgPrice(matchedMadinah, "Madinah") : 0;

  const makkahHotelCost = (avgMakkah / numTravelers) * nightsMakkah;
  const madinahHotelCost = (avgMadinah / numTravelers) * nightsMadinah;
  const totalHotelCost = makkahHotelCost + madinahHotelCost;

  // --- Visa ---
  const visaCost = 560;

  // --- Transport ---
  const transportVehicleCost = 400;
  const transportCost = transportVehicleCost / numTravelers;

  // --- Airfare ---
  const regionAirfare = {
    "north america": 5000,
    "south asia": 1750,
    "far east": 3200,
    "africa": 3500,
    "gcc": 1500,
  };

  const countryLC = (country || "").toLowerCase();
  let airfareCost = 3000;
  if (["pakistan", "india", "bangladesh"].includes(countryLC)) airfareCost = regionAirfare["south asia"];
  else if (["canada", "usa"].includes(countryLC)) airfareCost = regionAirfare["north america"];
  else if (["malaysia", "indonesia", "singapore"].includes(countryLC)) airfareCost = regionAirfare["far east"];
  else if (["nigeria", "kenya", "uganda", "sudan", "uzbekistan", "kazakhstan"].includes(countryLC)) airfareCost = regionAirfare["africa"];
  else if (["saudi arabia", "uae", "oman", "bahrain", "kuwait", "qatar", "egypt", "jordan", "iraq", "morocco"].includes(countryLC)) airfareCost = regionAirfare["gcc"];

  // --- Total ---
  const perPerson = airfareCost + totalHotelCost + transportCost + visaCost;
  const totalPrice = perPerson * numTravelers;

  const discountRate = 0.12;
  const discounted = totalPrice * (1 - discountRate);

  return NextResponse.json({
    price: totalPrice.toFixed(2),
    tokens: discounted.toFixed(0),
    discount: (totalPrice - discounted).toFixed(2),
    breakdown: {
      airfare: airfareCost.toFixed(2),
      visa: visaCost.toFixed(2),
      transport: transportCost.toFixed(2),
      makkahHotel: matchedMakkah || "N/A",
      madinahHotel: matchedMadinah || "N/A",
      makkahHotelCost: makkahHotelCost.toFixed(2),
      madinahHotelCost: madinahHotelCost.toFixed(2),
    },
  });
}
