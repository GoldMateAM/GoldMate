"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {collection,doc,onSnapshot,orderBy,query,serverTimestamp,updateDoc,where} from "firebase/firestore";
import {db} from "@/lib/firebase";
import {useApp} from "@/components/providers";
import {Brand,Product} from "@/lib/types";
import {Archive,CheckCircle2,Pencil} from "lucide-react";
import {toast} from "sonner";

type ProductFilter="all"|Product["status"];

export default function Seller(){
  const {profile,t,money}=useApp();
  const [brand,setBrand]=useState<Brand|null>(null);
  const [products,setProducts]=useState<Product[]>([]);
  const [orders,setOrders]=useState<any[]>([]);
  const [filter,setFilter]=useState<ProductFilter>("all");
  const [changingId,setChangingId]=useState<string|null>(null);

  useEffect(()=>{
    if(!profile)return;
    const ub=onSnapshot(
      query(collection(db,"brands"),where("ownerId","==",profile.id)),
      s=>setBrand(s.empty?null:{id:s.docs[0].id,...s.docs[0].data()} as Brand),
      ()=>{}
    );
    const up=onSnapshot(
      query(collection(db,"products"),where("sellerId","==",profile.id)),
      s=>setProducts(
        s.docs
          .map(d=>({id:d.id,...d.data()} as Product))
          .sort((a,b)=>Number(b.createdAt?.seconds||0)-Number(a.createdAt?.seconds||0))
      ),
      ()=>{}
    );
    const uo=onSnapshot(
      query(collection(db,"orders"),where("sellerId","==",profile.id),orderBy("createdAt","desc")),
      s=>setOrders(s.docs.map(d=>({id:d.id,...d.data()}))),
      ()=>{}
    );
    return()=>{ub();up();uo()};
  },[profile?.id]);

  const visibleProducts=useMemo(
    ()=>filter==="all"?products:products.filter(p=>p.status===filter),
    [products,filter]
  );

  async function setProductStatus(product:Product,status:Product["status"]){
    if(!profile||changingId)return;
    setChangingId(product.id);
    try{
      await updateDoc(doc(db,"products",product.id),{status,updatedAt:serverTimestamp()});
      toast.success(status==="archived"?t.productArchived:t.productActivated);
    }catch{
      toast.error(t.error);
    }finally{
      setChangingId(null);
    }
  }

  if(!profile?.sellerApproved&&profile?.role!=="admin"){
    return <main className="shell page"><div className="empty">{t.sellerPending}</div></main>;
  }

  const filterOptions:ProductFilter[]=["all","active","archived","sold","draft"];

  return <main className="shell page">
    <div className="seller-head">
      <div className="page-title"><div className="eyebrow">GoldMate</div><h1>{t.sellerTitle}</h1></div>
      <div style={{display:"flex",gap:10}}>
        <Link className="btn-secondary" href="/seller/brand">{t.editBrand}</Link>
        {brand&&<Link className="btn-primary" href="/seller/new">+ {t.addProduct}</Link>}
      </div>
    </div>

    {brand?<>
      <div className="stats" style={{marginTop:24}}>
        <div className="stat"><span>{t.products}</span><strong>{products.length}</strong></div>
        <div className="stat"><span>{t.active}</span><strong>{products.filter(p=>p.status==="active").length}</strong></div>
        <div className="stat"><span>{t.archived}</span><strong>{products.filter(p=>p.status==="archived").length}</strong></div>
        <div className="stat"><span>{t.orders}</span><strong>{orders.length}</strong></div>
      </div>

      <div className="panel" style={{marginTop:20}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:14,flexWrap:"wrap"}}>
          <h2 style={{margin:0}}>{t.products}</h2>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {filterOptions.map(x=><button
              key={x}
              type="button"
              className={filter===x?"btn-primary":"btn-secondary"}
              onClick={()=>setFilter(x)}
              style={{padding:"8px 12px"}}
            >{x==="all"?t.all:t[x as keyof typeof t] as string}</button>)}
          </div>
        </div>

        <p className="muted" style={{margin:"12px 0 4px"}}>{t.archiveHint}</p>

        {visibleProducts.length?<div className="table">
          {visibleProducts.map(p=><div className="table-row seller-product-row" key={p.id}>
            <img className="thumb" src={p.images?.[0]||"/brand/goldmate-logo.png"}/>
            <div><strong>{p.title.hy}</strong><div className="muted">{p.purity} · {p.weightGrams}g</div></div>
            <div>{money(p.priceAMD)}</div>
            <div><span className="status-pill">{t[p.status as keyof typeof t] as string}</span></div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              {p.status==="active"?<button
                className="iconbtn"
                type="button"
                disabled={changingId===p.id}
                title={t.archiveProduct}
                aria-label={t.archiveProduct}
                onClick={()=>setProductStatus(p,"archived")}
              ><Archive size={16}/></button>:<button
                className="iconbtn"
                type="button"
                disabled={changingId===p.id}
                title={t.activateProduct}
                aria-label={t.activateProduct}
                onClick={()=>setProductStatus(p,"active")}
              ><CheckCircle2 size={16}/></button>}
              <Link className="iconbtn seller-edit-btn" href={`/seller/product/${p.id}`} aria-label={t.editProduct} title={t.editProduct}><Pencil size={16}/></Link>
            </div>
          </div>)}
        </div>:<div className="empty">{t.empty}</div>}
      </div>

      <div className="panel" style={{marginTop:20}}>
        <h2>{t.orders}</h2>
        {orders.length?orders.map(o=><div key={o.id} style={{padding:"14px 0",borderBottom:"1px solid var(--line)",display:"flex",justifyContent:"space-between"}}>
          <div><strong>{o.productTitle}</strong><div className="muted">{o.customerName} · {o.phone}</div></div>
          <span>{o.status==="new"?t.orderNew:o.status==="confirmed"?t.orderConfirmed:o.status==="completed"?t.orderCompleted:t.orderCancelled}</span>
        </div>):<div className="empty">{t.empty}</div>}
      </div>
    </>:<div className="panel" style={{marginTop:24}}><p className="muted">{t.brandNotReady}</p><Link className="btn-primary" href="/seller/brand">{t.editBrand}</Link></div>}
  </main>;
}
