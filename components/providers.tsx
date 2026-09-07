"use client";
import {createContext,useContext,useEffect,useMemo,useState} from "react";
import {createUserWithEmailAndPassword,onAuthStateChanged,signInWithEmailAndPassword,signInWithPopup,signOut,updateProfile} from "firebase/auth";
import {collection,doc,getDoc,getDocs,limit,query,serverTimestamp,setDoc,where} from "firebase/firestore";
import {auth,db,googleProvider} from "@/lib/firebase";
import {AppUser,Locale} from "@/lib/types";
import {getDict,Dict} from "@/lib/i18n";
import {Currency,formatMoney} from "@/lib/utils";

type C={user:any;profile:AppUser|null;loading:boolean;vipAccess:boolean;locale:Locale;t:Dict;currency:Currency;usdAmd:number;setLocale:(l:Locale)=>void;setCurrency:(c:Currency)=>void;money:(amountAMD:number)=>string;google:()=>Promise<void>;login:(e:string,p:string)=>Promise<void>;register:(n:string,e:string,p:string)=>Promise<void>;logout:()=>Promise<void>;refresh:()=>Promise<void>};
const Ctx=createContext<C|null>(null);

export function Providers({children}:{children:React.ReactNode}){
 const [user,setUser]=useState<any>(null),[profile,setProfile]=useState<AppUser|null>(null),[loading,setLoading]=useState(true),[vipAccess,setVipAccess]=useState(false),[locale,setLocaleState]=useState<Locale>("hy"),[currency,setCurrencyState]=useState<Currency>("USD"),[usdAmd,setUsdAmd]=useState(0);
 async function load(u:any){
   const r=doc(db,"users",u.uid),s=await getDoc(r);
   if(!s.exists()){
     const d={displayName:u.displayName||u.email?.split("@")[0]||"",email:u.email||"",photoURL:u.photoURL||"",phone:"",role:"buyer",sellerApproved:false,locale,createdAt:serverTimestamp()};
     await setDoc(r,d);setProfile({id:u.uid,...d} as any)
   }else{
     const d=s.data() as any;setProfile({id:u.uid,...d});if(d.locale)setLocaleState(d.locale)
   }
   const current=s.exists()?s.data() as any:null;
   if(current?.role==="admin") setVipAccess(true);
   else if(u.email){try{const vs=await getDocs(query(collection(db,"vipVaultItems"),where("sharedEmails","array-contains",String(u.email).toLowerCase()),limit(1)));setVipAccess(!vs.empty)}catch{setVipAccess(false)}}
 }
 useEffect(()=>{
   const savedLocale=localStorage.getItem("gm_locale") as Locale|null;
   const savedCurrency=localStorage.getItem("gm_currency") as Currency|null;
   if(savedLocale)setLocaleState(savedLocale);
   if(savedCurrency==="USD"||savedCurrency==="AMD")setCurrencyState(savedCurrency);
   fetch("/api/market-rates").then(r=>r.ok?r.json():null).then(x=>{if(x?.usdAmd)setUsdAmd(Number(x.usdAmd))}).catch(()=>{});
   return onAuthStateChanged(auth,async u=>{setUser(u);if(u)await load(u);else{setProfile(null);setVipAccess(false)}setLoading(false)})
 },[]);
 const setLocale=(l:Locale)=>{setLocaleState(l);localStorage.setItem("gm_locale",l);if(user)setDoc(doc(db,"users",user.uid),{locale:l},{merge:true}).catch(()=>{})};
 const setCurrency=(c:Currency)=>{setCurrencyState(c);localStorage.setItem("gm_currency",c)};
 const value=useMemo<C>(()=>({user,profile,loading,vipAccess,locale,t:getDict(locale),currency,usdAmd,setLocale,setCurrency,money:(amountAMD:number)=>formatMoney(amountAMD,currency,usdAmd),google:async()=>{await signInWithPopup(auth,googleProvider)},login:async(e,p)=>{await signInWithEmailAndPassword(auth,e,p)},register:async(n,e,p)=>{const c=await createUserWithEmailAndPassword(auth,e,p);await updateProfile(c.user,{displayName:n});await setDoc(doc(db,"users",c.user.uid),{displayName:n,email:e,photoURL:"",phone:"",role:"buyer",sellerApproved:false,locale,createdAt:serverTimestamp()})},logout:async()=>{await signOut(auth)},refresh:async()=>{if(auth.currentUser)await load(auth.currentUser)}}),[user,profile,loading,vipAccess,locale,currency,usdAmd]);
 return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export function useApp(){const x=useContext(Ctx);if(!x)throw new Error("Providers missing");return x}
