"use client";
import { useEffect, useState } from "react";
export function Splash(){
  const [show,setShow]=useState(true);
  useEffect(()=>{const id=setTimeout(()=>setShow(false),700);return()=>clearTimeout(id)},[]);
  if(!show)return null;
  return <div className="splash-screen"><img src="/brand/goldmate-mark.png" alt="GoldMate"/></div>
}
