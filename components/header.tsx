"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {Menu,UserRound,X} from "lucide-react";
import {useState} from "react";
import {Logo} from "./logo";
import {useApp} from "./providers";

export function Header(){
 const {profile,vipAccess,locale,setLocale,t}=useApp();
 const p=usePathname(); const [open,setOpen]=useState(false);
 const nav:Array<[string,string]>=[["/",t.home],["/market",t.market],["/rates",t.rates]];
 if(profile)nav.push(["/profile",t.profile]);
 if(profile?.sellerApproved)nav.push(["/seller",t.seller],["/finance",t.finance]);
 if(vipAccess)nav.push(["/vip",t.vip]);
 if(profile?.role==="admin")nav.push(["/admin",t.admin]);
 return <header className="site-header"><div className="nav-inner"><Link href="/" className="nav-brand"><Logo compact/></Link><nav className="desktop-nav">{nav.map(([h,l])=><Link key={h} href={h} className={p===h?"navlink active":"navlink"}>{l}</Link>)}</nav><div className="nav-tools"><div className="lang-switch">{(["hy","en","ru"] as const).map(l=><button key={l} onClick={()=>setLocale(l)} className={locale===l?"selected":""}>{l.toUpperCase()}</button>)}</div><Link className="profile-btn" href="/profile">{profile?.photoURL?<img src={profile.photoURL} alt=""/>:<UserRound size={18}/>}</Link><button className="menu-btn" onClick={()=>setOpen(!open)}>{open?<X size={20}/>:<Menu size={20}/>}</button></div></div>{open&&<nav className="mobile-nav">{nav.map(([h,l])=><Link key={h} onClick={()=>setOpen(false)} href={h}>{l}</Link>)}</nav>}</header>
}
