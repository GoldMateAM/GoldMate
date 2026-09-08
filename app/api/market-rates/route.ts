import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PURITIES = [585, 750, 900, 916, 958, 995, 999] as const;
const GRAMS_PER_TROY_OUNCE = 31.1034768;
const GOLDCENTER_URL = "https://goldcenter.am/price";
const LIVE_CACHE_MS = 8_000;
const STALE_CACHE_MS = 30 * 60 * 1000;

type LocalRate = { buyUSD: number; sellUSD: number };
type LocalSnapshot = {
  rates: Record<number, LocalRate>;
  fetchedAt: number;
};

let lastLocalRates: LocalSnapshot | null = null;

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

function decodeHtml(v: string) {
  return v
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#36;/g, "$")
    .replace(/&#x24;/gi, "$")
    .replace(/\s+/g, " ")
    .trim();
}

function parsePair(text: string, purity: string): LocalRate | null {
  const p = purity.replace(".", "\\.");
  const re = new RegExp(`${p}\\s+([0-9]{2,3}(?:\\.[0-9]+)?)\\s+([0-9]{2,3}(?:\\.[0-9]+)?)`, "i");
  const m = text.match(re);
  if (!m) return null;

  const buyUSD = Number(m[1]);
  const sellUSD = Number(m[2]);
  if (![buyUSD, sellUSD].every((x) => Number.isFinite(x) && x > 30 && x < 500)) return null;
  if (sellUSD <= buyUSD || sellUSD - buyUSD > 5) return null;
  return { buyUSD, sellUSD };
}

function validateGoldCenter(r9999: LocalRate, r585: LocalRate) {
  // Guard against accidentally parsing a different table/section.
  const ratioBuy = r585.buyUSD / r9999.buyUSD;
  const ratioSell = r585.sellUSD / r9999.sellUSD;
  return ratioBuy > 0.55 && ratioBuy < 0.61 && ratioSell > 0.55 && ratioSell < 0.61;
}

async function fetchGoldCenterYerevanRates(): Promise<LocalSnapshot> {
  if (lastLocalRates && Date.now() - lastLocalRates.fetchedAt < LIVE_CACHE_MS) {
    return lastLocalRates;
  }

  const r = await fetch(GOLDCENTER_URL, {
    cache: "no-store",
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "Mozilla/5.0 (compatible; GoldMate/1.0; +https://goldcenter.am/price)",
    },
  });
  if (!r.ok) throw new Error(`GoldCenter ${r.status}`);

  const html = await r.text();
  const text = decodeHtml(
    html
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );

  const upper = text.toUpperCase();
  const yerevanIndex = Math.max(text.indexOf("ԵՐԵՎԱՆ"), upper.indexOf("YEREVAN"));
  const silverIndexCandidates = [text.indexOf("Արծաթ"), upper.indexOf("SILVER")].filter((x) => x > yerevanIndex);
  const silverIndex = silverIndexCandidates.length ? Math.min(...silverIndexCandidates) : -1;
  const section = yerevanIndex >= 0 ? text.slice(yerevanIndex, silverIndex > yerevanIndex ? silverIndex : undefined) : text;

  let r9999 = parsePair(section, "999.9");
  let r585 = parsePair(section, "585");

  if (!r9999 || !r585) {
    const allText = decodeHtml(html.replace(/<[^>]+>/g, " "));
    r9999 = r9999 || parsePair(allText, "999.9");
    r585 = r585 || parsePair(allText, "585");
  }

  if (!r9999 || !r585 || !validateGoldCenter(r9999, r585)) {
    throw new Error("GoldCenter Yerevan rates could not be validated");
  }

  const rates: Record<number, LocalRate> = {
    // 585 is published directly by GoldCenter, so keep it exact.
    585: r585,
    // GoldCenter does not publish 750/916 in the public table; derive them from 999.9.
    750: {
      buyUSD: r9999.buyUSD * (750 / 999.9),
      sellUSD: r9999.sellUSD * (750 / 999.9),
    },
    900: {
    buyUSD: r9999.buyUSD * (900 / 999.9),
    sellUSD: r9999.sellUSD * (900 / 999.9),
    },
    916: {
      buyUSD: r9999.buyUSD * (916 / 999.9),
      sellUSD: r9999.sellUSD * (916 / 999.9),
    },
     958: {
    buyUSD: r9999.buyUSD * (958 / 999.9),
    sellUSD: r9999.sellUSD * (958 / 999.9),
    },
     995: {
    buyUSD: r9999.buyUSD * (995 / 999.9),
    sellUSD: r9999.sellUSD * (995 / 999.9),
  },
    // GoldMate uses 999. Convert the published 999.9 rate proportionally.
    999: {
      buyUSD: r9999.buyUSD * (999 / 999.9),
      sellUSD: r9999.sellUSD * (999 / 999.9),
    },
  };

  lastLocalRates = { rates, fetchedAt: Date.now() };
  return lastLocalRates;
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
  return { price, updatedAt: data?.updatedAt || data?.timestamp || new Date().toISOString() };
}

function emergencyLocalFromSpot(spotUSDPerGram: number) {
  // Only used when GoldCenter is unavailable and no recent GoldCenter snapshot exists.
  const buy9999 = spotUSDPerGram * 0.971;
  const sell9999 = spotUSDPerGram * 0.982;
  return Object.fromEntries(
    PURITIES.map((purity) => [
      purity,
      {
        buyUSD: buy9999 * (purity / 999.9),
        sellUSD: sell9999 * (purity / 999.9),
      },
    ]),
  ) as Record<number, LocalRate>;
}

export async function GET() {
  try {
    const usd = await fetchCbaISO("USD");

    let localRates: Record<number, LocalRate>;
    let localSource = "GoldCenter.am · Yerevan";
    let exactLocal = true;
    let stale = false;
    let goldCenterFetchedAt: string | null = null;

    try {
      const snap = await fetchGoldCenterYerevanRates();
      localRates = snap.rates;
      goldCenterFetchedAt = new Date(snap.fetchedAt).toISOString();
    } catch {
      if (lastLocalRates && Date.now() - lastLocalRates.fetchedAt < STALE_CACHE_MS) {
        localRates = lastLocalRates.rates;
        localSource = "GoldCenter.am · Yerevan · last good snapshot";
        goldCenterFetchedAt = new Date(lastLocalRates.fetchedAt).toISOString();
        stale = true;
      } else {
        const live = await fetchLiveGoldUsdPerOz();
        localRates = emergencyLocalFromSpot(live.price / GRAMS_PER_TROY_OUNCE);
        localSource = "Gold";
        exactLocal = false;
        stale = true;
      }
    }

    let globalSpotUSDPerOz: number | null = null;
    let globalSpotUSDPerGram: number | null = null;
    try {
      const live = await fetchLiveGoldUsdPerOz();
      globalSpotUSDPerOz = live.price;
      globalSpotUSDPerGram = live.price / GRAMS_PER_TROY_OUNCE;
    } catch {}

    const purities = PURITIES.map((purity) => {
      const r = localRates[purity];
      const buyAMD = r.buyUSD * usd.value;
      const sellAMD = r.sellUSD * usd.value;
      return {
        purity,
        buyUSD: Number(r.buyUSD.toFixed(4)),
        sellUSD: Number(r.sellUSD.toFixed(4)),
        buyAMD,
        sellAMD,
        referenceAMD: (buyAMD + sellAMD) / 2,
      };
    });

    const p999 = purities.find((x) => x.purity === 999)!;

    return NextResponse.json(
      {
        fineGoldAMDPerGram: p999.referenceAMD,
        vaultBuyAMDPerGram: p999.buyAMD,
        usdAmd: usd.value,
        spotUSDPerOz: globalSpotUSDPerOz,
        spotUSDPerGram: globalSpotUSDPerGram,
        purities,
        updatedAt: new Date().toISOString(),
        fetchedAt: new Date().toISOString(),
        goldCenterFetchedAt,
        source: localSource,
        sourceUrl: GOLDCENTER_URL,
        localMarket: true,
        exactLocal,
        stale,
        live: exactLocal && !stale,
      },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "rate_service_unavailable" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
