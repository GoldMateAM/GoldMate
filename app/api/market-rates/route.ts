import { NextResponse } from "next/server";

export const revalidate = 900;
const PURITIES = [585, 750, 916, 999] as const;

function extract(xml: string, tag: string) {
  const m = xml.match(new RegExp(`<${tag}>([^<]+)</${tag}>`));
  return m?.[1] || "";
}

export async function GET() {
  const body = `<?xml version="1.0" encoding="utf-8"?>
  <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
      <ExchangeRatesLatestByISO xmlns="http://www.cba.am/">
        <ISO>XAU</ISO>
      </ExchangeRatesLatestByISO>
    </soap:Body>
  </soap:Envelope>`;

  try {
    const r = await fetch("https://api.cba.am/exchangerates.asmx", {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: "http://www.cba.am/ExchangeRatesLatestByISO"
      },
      body,
      next: { revalidate: 900 }
    });
    if (!r.ok) throw new Error(`CBA ${r.status}`);
    const xml = await r.text();
    const rate = Number(extract(xml, "Rate"));
    const amount = Number(extract(xml, "Amount") || 1);
    const difference = Number(extract(xml, "Difference") || 0);
    const sourceDate = extract(xml, "CurrentDate") || new Date().toISOString();
    if (!rate) throw new Error("No XAU rate");

    const fineGoldAMDPerGram = rate / amount;
    const purities = PURITIES.map(p => ({
      purity: p,
      referenceAMD: fineGoldAMDPerGram * (p / 999)
    }));

    return NextResponse.json({
      fineGoldAMDPerGram,
      difference,
      purities,
      updatedAt: sourceDate,
      fetchedAt: new Date().toISOString(),
      source: "Central Bank of Armenia · XAU"
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "rate_service_unavailable" }, { status: 502 });
  }
}
