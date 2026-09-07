"use client";
import { useEffect,useState } from "react";
import { doc,onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useApp } from "./providers";
import { AMD } from "@/lib/utils";

export function RateStrip(){
 const {t}=useApp(); const [data,setData]=useState<any>(null),[cfg,setCfg]=useState<any>({buyAdjustmentPct:-3,sellAdjustmentPct:4});
 useEffect(()=>{let alive=true;const load=()=>fetch("/api/market-rates").then(r=>r.ok?r.json():null).then(x=>alive&&x&&setData(x)).catch(()=>{});load();const timer=setInterval(load,15*60*1000);const u=onSnapshot(doc(db,"settings","pricing"),s=>s.exists()&&setCfg((v:any)=>({...v,...s.data()})));return()=>{alive=false;clearInterval(timer);u()}},[]);
 const rows=(data?.purities||[]).map((x:any)=>({...x,buy:x.referenceAMD*(1+(cfg[`buy_${x.purity}`]??cfg.buyAdjustmentPct)/100),sell:x.referenceAMD*(1+(cfg[`sell_${x.purity}`]??cfg.sellAdjustmentPct)/100)}));
 if(!rows.length)return null;
 return <div className="rate-strip"><div className="rate-strip-inner"><span className="rate-strip-title">{t.rateTitle}</span>{rows.map((r:any)=><span className="rate-chip" key={r.purity}><b>{r.purity}</b><em>{t.buyPrice} {AMD.format(r.buy)}</em><em>{t.sellPrice} {AMD.format(r.sell)}</em></span>)}</div></div>
}
