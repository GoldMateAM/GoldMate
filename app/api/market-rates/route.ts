import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PURITIES = [585, 750, 916, 999] as const;
const GRAMS_PER_TROY_OUNCE = 31.1034768;

function extract(xml: string, tag: string) {
  const m = xml.match(new RegExp(`<${tag}>([^<]+)</${tag}>`));
  return m?.[1] || "";
}

async function fetchCbaISO(iso: string) {
  const body = `<?xml version="1.0" encoding="utf-8"?>
  <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body><ExchangeRatesLatestByISO xmlns="http://www.cba.am/"><ISO>${iso}</ISO></ExchangeRatesLatestByISO></soap:Body>
  </soap:Envelope>`;

  const r = await fetch("https://api.cba.am/exchangerates.asmx", {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: "http://www.cba.am/ExchangeRatesLatestByISO",
    },
    body,
    next: { revalidate: 900 },
  });

  if (!r.ok) throw new Error(`CBA ${iso} ${r.status}`);
  const xml = await r.text();
  const rate = Number(extract(xml, "Rate"));
  const amount = Number(extract(xml, "Amount") || 1);
  const difference = Number(extract(xml, "Difference") || 0);
  const currentDate = extract(xml, "CurrentDate") || new Date().toISOString();
  if (!rate) throw new Error(`No ${iso} rate`);

  return { value: rate / amount, difference, currentDate };
}

async function fetchLiveGoldUsdPerOz() {
  const r = await fetch("https://api.gold-api.com/price/XAU", {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!r.ok) throw new Error(`Gold API ${r.status}`);

  const data = await r.json();
  const price = Number(data?.price);
  if (!Number.isFinite(price) || price <= 0) throw new Error("Gold API returned invalid XAU price");

  return {
    price,
    updatedAt: data?.updatedAt || data?.timestamp || new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const usd = await fetchCbaISO("USD");

    try {
      const live = await fetchLiveGoldUsdPerOz();
      const spotUSDPerGram = live.price / GRAMS_PER_TROY_OUNCE;

      // Keep the project's existing convention: fineGoldAMDPerGram is the 999 reference.
      // metalValue() then scales other purities by purity / 999.
      const fineGoldAMDPerGram = spotUSDPerGram * usd.value * 0.999;

      return NextResponse.json(
        {
          fineGoldAMDPerGram,
          usdAmd: usd.value,
          spotUSDPerOz: live.price,
          spotUSDPerGram,
          purities: PURITIES.map((purity) => ({
            purity,
            referenceAMD: fineGoldAMDPerGram * (purity / 999),
          })),
          updatedAt: live.updatedAt,
          fetchedAt: new Date().toISOString(),
          source: "Gold API · XAU/USD + Central Bank of Armenia · USD/AMD",
          live: true,
        },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
      );
    } catch {
      // Fallback: if the live provider is temporarily unavailable, keep GoldMate usable with CBA XAU.
      const xau = await fetchCbaISO("XAU");
      const fineGoldAMDPerGram = xau.value;

      return NextResponse.json(
        {
          fineGoldAMDPerGram,
          usdAmd: usd.value,
          spotUSDPerOz: null,
          spotUSDPerGram: null,
          difference: xau.difference,
          purities: PURITIES.map((purity) => ({
            purity,
            referenceAMD: fineGoldAMDPerGram * (purity / 999),
          })),
          updatedAt: xau.currentDate,
          fetchedAt: new Date().toISOString(),
          source: "Central Bank of Armenia · XAU / USD · fallback",
          live: false,
        },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
      );
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "rate_service_unavailable" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
