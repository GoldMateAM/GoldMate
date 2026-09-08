"use client";

import {useEffect,useState} from "react";
import {X} from "lucide-react";

export type ImagePickerItem=
  | {kind:"existing";url:string}
  | {kind:"file";file:File};

type Props={
  items:ImagePickerItem[];
  onChange:(items:ImagePickerItem[])=>void;
  label:string;
  max?:number;
};

function Preview({item}:{item:ImagePickerItem}){
  const [src,setSrc]=useState(item.kind==="existing" ? item.url : "");

  useEffect(()=>{
    if(item.kind==="existing"){
      setSrc(item.url);
      return;
    }

    const objectUrl=URL.createObjectURL(item.file);
    setSrc(objectUrl);

    return ()=>{
      URL.revokeObjectURL(objectUrl);
    };
  },[item]);

  if(!src){
    return <div style={{width:"100%",height:"100%"}}/>;
  }

  return (
    <img
      src={src}
      alt=""
      draggable={false}
      style={{
        width:"100%",
        height:"100%",
        objectFit:"cover",
        display:"block"
      }}
    />
  );
}

export function ImagePicker({items,onChange,label,max=10}:Props){
  const [dragIndex,setDragIndex]=useState<number|null>(null);
  const [overIndex,setOverIndex]=useState<number|null>(null);

  const reorder=(from:number,to:number)=>{
    if(
      from===to ||
      from<0 ||
      to<0 ||
      from>=items.length ||
      to>=items.length
    ) return;

    const next=[...items];
    const [moved]=next.splice(from,1);
    next.splice(to,0,moved);
    onChange(next);
  };

  const remove=(index:number)=>{
    onChange(items.filter((_,i)=>i!==index));
  };

  return (
    <div className="image-picker">
      <span className="form-label">
        {label} · {items.length}/{max}
      </span>

      <div className="image-preview-grid">
        {items.map((item,i)=>(
          <div
            className="image-preview"
            key={
              item.kind==="existing"
                ? `e-${item.url}`
                : `f-${item.file.name}-${item.file.size}-${item.file.lastModified}`
            }
            draggable
            onDragStart={e=>{
              setDragIndex(i);
              setOverIndex(i);
              e.dataTransfer.effectAllowed="move";
              e.dataTransfer.setData("text/plain",String(i));
            }}
            onDragEnter={e=>{
              e.preventDefault();
              if(dragIndex!==null) setOverIndex(i);
            }}
            onDragOver={e=>{
              e.preventDefault();
              e.dataTransfer.dropEffect="move";
              if(dragIndex!==null) setOverIndex(i);
            }}
            onDrop={e=>{
              e.preventDefault();

              const fallback=Number(
                e.dataTransfer.getData("text/plain")
              );

              const from=
                dragIndex!==null
                  ? dragIndex
                  : fallback;

              if(Number.isInteger(from)){
                reorder(from,i);
              }

              setDragIndex(null);
              setOverIndex(null);
            }}
            onDragEnd={()=>{
              setDragIndex(null);
              setOverIndex(null);
            }}
            style={{
              cursor:dragIndex===i ? "grabbing" : "grab",
              opacity:dragIndex===i ? .55 : 1,
              outline:
                overIndex===i &&
                dragIndex!==null &&
                dragIndex!==i
                  ? "2px solid rgba(231,201,0,.7)"
                  : "none",
              outlineOffset:2
            }}
            title="Քաշեք՝ նկարների հերթականությունը փոխելու համար"
          >
            <Preview item={item}/>

            <button
              type="button"
              onPointerDown={e=>e.stopPropagation()}
              onMouseDown={e=>e.stopPropagation()}
              onDragStart={e=>e.stopPropagation()}
              onClick={e=>{
                e.preventDefault();
                e.stopPropagation();
                remove(i);
              }}
              aria-label="Հեռացնել նկարը"
              title="Հեռացնել"
            >
              <X size={15}/>
            </button>
          </div>
        ))}
      </div>

      {items.length<max&&(
        <input
          className="field"
          type="file"
          multiple
          accept="image/*"
          onChange={e=>{
            const selected=Array.from(
              e.currentTarget.files||[]
            );

            const free=Math.max(
              0,
              max-items.length
            );

            const incoming=selected
              .slice(0,free)
              .map(file=>({
                kind:"file" as const,
                file
              }));

            if(incoming.length){
              onChange([
                ...items,
                ...incoming
              ]);
            }

            e.currentTarget.value="";
          }}
        />
      )}
    </div>
  );
}
