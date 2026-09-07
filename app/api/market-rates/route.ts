import { NextResponse } from "next/server";

export const revalidate = 900;
const PURITIES = [585, 750, 916, 999] as const;

function extract(xml: string, tag: string) {
  const m = xml.match(new RegExp(`<${tag}>([^<]+)</${tag}>`));
  return m?.[1] || "";
}

async function fetchISO(iso:string){
  const body=`<?xml version="1.0" encoding="utf-8"?>
  <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body><ExchangeRatesLatestByISO xmlns="http://www.cba.am/"><ISO>${iso}</ISO></ExchangeRatesLatestByISO></soap:Body>
  </soap:Envelope>`;
  const r=await fetch("https://api.cba.am/exchangerates.asmx",{method:"POST",headers:{"Content-Type":"text/xml; charset=utf-8",SOAPAction:"http://www.cba.am/ExchangeRatesLatestByISO"},body,next:{revalidate:900}});
  if(!r.ok)throw new Error(`CBA ${iso} ${r.status}`);
  const xml=await r.text();
  const rate=Number(extract(xml,"Rate")),amount=Number(extract(xml,"Amount")||1),difference=Number(extract(xml,"Difference")||0),currentDate=extract(xml,"CurrentDate")||new Date().toISOString();
  if(!rate)throw new Error(`No ${iso} rate`);
  return {value:rate/amount,difference,currentDate};
}

export async function GET(){
  try{
    const [xau,usd]=await Promise.all([fetchISO("XAU"),fetchISO("USD")]);
    const fineGoldAMDPerGram=xau.value;
    return NextResponse.json({fineGoldAMDPerGram,usdAmd:usd.value,difference:xau.difference,purities:PURITIES.map(purity=>({purity,referenceAMD:fineGoldAMDPerGram*(purity/999)})),updatedAt:xau.currentDate,fetchedAt:new Date().toISOString(),source:"Central Bank of Armenia · XAU / USD"});
  }catch(e:any){return NextResponse.json({error:e.message||"rate_service_unavailable"},{status:502})}
}
