"use client";
import {useEffect} from "react";
import {ChevronLeft,ChevronRight,X} from "lucide-react";

export function ImageLightbox({images,index,onClose,onChange}:{images:string[];index:number;onClose:()=>void;onChange:(i:number)=>void}){
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose();if(e.key==="ArrowLeft")onChange((index-1+images.length)%images.length);if(e.key==="ArrowRight")onChange((index+1)%images.length)};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key)},[images,index,onClose,onChange]);
 if(!images.length)return null;
 return <div className="image-lightbox" onClick={onClose}><button className="lightbox-close" onClick={onClose}><X/></button>{images.length>1&&<button className="lightbox-prev" onClick={e=>{e.stopPropagation();onChange((index-1+images.length)%images.length)}}><ChevronLeft/></button>}<img src={images[index]} alt="" onClick={e=>e.stopPropagation()}/>{images.length>1&&<button className="lightbox-next" onClick={e=>{e.stopPropagation();onChange((index+1)%images.length)}}><ChevronRight/></button>}</div>
}
