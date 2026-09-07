"use client";
import Link from "next/link";
import {ArrowRight,ShieldCheck,Scale,Gem,Store,LockKeyhole,Sparkles,Coins,Landmark,ChevronRight} from "lucide-react";
import {useEffect,useState} from "react";
import {collection,limit,onSnapshot,orderBy,query,where} from "firebase/firestore";
import {db} from "@/lib/firebase";
import {Product} from "@/lib/types";
import {useApp} from "@/components/providers";
import {ProductCard} from "@/components/product-card";

const cats=[
 ["Մատանիներ",Gem],["Վզնոցներ",Sparkles],["Ականջօղեր",Gem],["Ապարանջաններ",Coins],["Շղթաներ",Scale],["Ոսկու ձուլակտորներ",Landmark]
] as const;
export default function Home(){
 const {t,locale}=useApp(),[items,setItems]=useState<Product[]>([]);
 useEffect(()=>{const q=query(collection(db,"products"),where("status","==","active"),orderBy("createdAt","desc"),limit(8));return onSnapshot(q,s=>setItems(s.docs.map(d=>({id:d.id,...d.data()} as Product))))},[]);
 const hy=locale==="hy";
 return <main>
  <section className="hero-luxe"><div className="hero-glow"/><div className="hero-luxe-inner">
   <div className="hero-copy"><div className="eyebrow">GOLDMATE · GOLD & FINE JEWELRY</div><h1>{hy?<>Ավելին, քան<br/><em>ոսկի</em></>:t.heroTitle}</h1><p>{hy?"Որակ, վստահություն և իրական արժեք։ Բացահայտեք ընտրված զարդեր ու ոսկու թարմ գներ՝ մեկ ամբողջական հարթակում։":t.heroText}</p><div className="hero-actions"><Link className="btn-primary" href="/market">{t.explore}<ArrowRight size={16}/></Link><Link className="btn-ghost" href="/rates">{t.seeRates}</Link></div>
   <div className="trust-row"><span><ShieldCheck/>{t.trusted}</span><span><Scale/>{t.live}</span><span><Gem/>{t.premium}</span></div></div>
   <div className="hero-jewel"><div className="orbital o1"/><div className="orbital o2"/><div className="gold-disc"><img src="/brand/goldmate-mark.png" alt="GoldMate"/></div><div className="hero-signature">TIMELESS PIECES<br/>LASTING VALUE.</div></div>
  </div></section>

  <section className="section shell"><div className="section-head"><div><div className="eyebrow">GOLDMATE COLLECTION</div><h2>{hy?"Մեր հավաքածուն":t.featured}</h2></div><Link className="gold-link" href="/market">{t.viewAll} <ArrowRight size={14}/></Link></div>
   <div className="category-grid">{cats.map(([label,Icon],i)=><Link href="/market" className="category-card" key={label}><div className="category-art"><Icon strokeWidth={1.05}/><span>0{i+1}</span></div><div><b>{hy?label:["Rings","Necklaces","Earrings","Bracelets","Chains","Gold bars"][i]}</b><ChevronRight size={15}/></div></Link>)}</div>
  </section>

  <section className="section shell"><div className="editorial"><div className="editorial-copy"><div className="eyebrow">GOLDMATE</div><h2>{hy?<>Ավելին, քան պարզապես <em>զարդեր</em></>:t.why}</h2><p>{hy?"GoldMate-ը ոսկու, արժեքի և վստահության մասին է։ Հստակ տվյալներ, ընտրված վաճառողներ և ժամանակակից գործիքներ՝ ձեր ամենակարևոր ընտրությունների համար։":`${t.why1}. ${t.why2}. ${t.why3}.`}</p><Link href="/market" className="text-arrow">{t.explore}<ArrowRight/></Link></div><div className="gold-object"><div className="ingot"><small>GOLDMATE</small><strong>FINE GOLD</strong><span>999.9</span></div></div></div></section>

  <section className="section shell"><div className="vault-feature"><div className="vault-visual"><div className="vault-door"><div className="vault-ring"><LockKeyhole/></div></div></div><div className="vault-copy"><div className="eyebrow">PRIVATE · GOLDMATE</div><h2>{hy?"Ընտանեկան պահոց":t.vipTitle}</h2><p>{hy?"Ձեր ընտանիքի ոսկու հավաքածուն՝ մեկ ապահով, փակ տարածքում։ Գրանցեք զարդերը, քաշը, գնման արժեքը և տեսեք ամբողջ հավաքածուի ընթացիկ գնահատված արժեքը։":t.vipText}</p><Link className="btn-ghost" href="/vip">{hy?"Մուտք պահոց":t.vip}<ArrowRight size={15}/></Link><div className="vault-points"><span><ShieldCheck/> {hy?"Մասնավոր մուտք":"Private access"}</span><span><Gem/> {hy?"Հավաքածուի գնահատում":"Collection valuation"}</span></div></div></div></section>

  <section className="section shell"><div className="section-head"><div><div className="eyebrow">GOLDMATE SELECT</div><h2>{t.featured}</h2><p>{t.featuredText}</p></div><Link className="gold-link" href="/market">{t.viewAll} <ArrowRight size={14}/></Link></div>{items.length?<div className="product-grid">{items.map(p=><ProductCard p={p} key={p.id}/>)}</div>:<div className="product-empty"><Gem/><h3>{hy?"Առաջին ընտրանին շուտով այստեղ կլինի":"The first collection will appear here"}</h3><p>{hy?"Վաճառողները կարող են հրապարակել իրենց հաստատված զարդերը GoldMate-ում։":t.empty}</p><Link className="btn-ghost" href="/market">{t.explore}</Link></div>}</section>

  <section className="section shell"><div className="values-luxe">{[[ShieldCheck,t.why1],[Gem,t.why2],[Store,t.why3],[Scale,t.why4]].map(([Icon,text]:any,i)=><div className="value-luxe" key={i}><div className="value-icon"><Icon/></div><span>0{i+1}</span><p>{text}</p></div>)}</div></section>
 </main>
}
