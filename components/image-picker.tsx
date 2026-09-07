"use client";
import {useEffect,useState} from "react";
import {X} from "lucide-react";

export function ImagePicker({existing,onExistingChange,files,onFilesChange,label,max=10}:{existing:string[];onExistingChange:(v:string[])=>void;files:File[];onFilesChange:(v:File[])=>void;label:string;max?:number}){
 const [previews,setPreviews]=useState<string[]>([]);
 useEffect(()=>{const urls=files.map(f=>URL.createObjectURL(f));setPreviews(urls);return()=>urls.forEach(URL.revokeObjectURL)},[files]);
 const total=existing.length+files.length;
 return <div className="image-picker"><span className="form-label">{label} · {total}/{max}</span><div className="image-preview-grid">{existing.map((src,i)=><div className="image-preview" key={`e-${src}-${i}`}><img src={src} alt=""/><button type="button" onClick={()=>onExistingChange(existing.filter((_,n)=>n!==i))}><X size={15}/></button></div>)}{previews.map((src,i)=><div className="image-preview" key={`n-${i}`}><img src={src} alt=""/><button type="button" onClick={()=>onFilesChange(files.filter((_,n)=>n!==i))}><X size={15}/></button></div>)}</div>{total<max&&<input className="field" type="file" multiple accept="image/*" onChange={e=>{const incoming=Array.from(e.target.files||[]);onFilesChange([...files,...incoming].slice(0,Math.max(0,max-existing.length)));e.currentTarget.value=""}}/>}</div>
}
