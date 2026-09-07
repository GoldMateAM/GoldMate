"use client";
import {createContext,useContext,useEffect,useMemo,useState} from "react";
import {
  AuthCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  linkWithCredential,
  linkWithPopup,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile
} from "firebase/auth";
import {collection,doc,getDoc,getDocs,limit,query,serverTimestamp,setDoc,where} from "firebase/firestore";
import {auth,db,googleProvider} from "@/lib/firebase";
import {AppUser,Locale} from "@/lib/types";
import {getDict,Dict} from "@/lib/i18n";
import {Currency,formatMoney} from "@/lib/utils";

type C={
  user:any;
  profile:AppUser|null;
  loading:boolean;
  vipAccess:boolean;
  locale:Locale;
  t:Dict;
  currency:Currency;
  usdAmd:number;
  pendingGoogleEmail:string;
  setLocale:(l:Locale)=>void;
  setCurrency:(c:Currency)=>void;
  money:(amountAMD:number)=>string;
  google:()=>Promise<void>;
  completeGoogleLink:(password:string)=>Promise<void>;
  cancelGoogleLink:()=>void;
  connectGoogle:()=>Promise<void>;
  login:(e:string,p:string)=>Promise<void>;
  register:(n:string,e:string,p:string)=>Promise<void>;
  resetPassword:(e:string)=>Promise<void>;
  setAccountPassword:(password:string)=>Promise<void>;
  logout:()=>Promise<void>;
  refresh:()=>Promise<void>;
};
const Ctx=createContext<C|null>(null);

export function Providers({children}:{children:React.ReactNode}){
 const [user,setUser]=useState<any>(null),[profile,setProfile]=useState<AppUser|null>(null),[loading,setLoading]=useState(true),[vipAccess,setVipAccess]=useState(false),[locale,setLocaleState]=useState<Locale>("hy"),[currency,setCurrencyState]=useState<Currency>("USD"),[usdAmd,setUsdAmd]=useState(0),[pendingGoogleCredential,setPendingGoogleCredential]=useState<AuthCredential|null>(null),[pendingGoogleEmail,setPendingGoogleEmail]=useState(""),[authVersion,setAuthVersion]=useState(0);

 async function load(u:any){
   const r=doc(db,"users",u.uid),s=await getDoc(r);
   if(!s.exists()){
     const d={
  displayName:u.displayName||"",
  email:u.email||"",
  photoURL:u.photoURL||"",
  phone:"",
  role:"buyer",
  sellerApproved:false,
  locale,
  createdAt:serverTimestamp()
};
     await setDoc(r,d);setProfile({id:u.uid,...d} as any)
   }else{
     const d=s.data() as any;setProfile({id:u.uid,...d});if(d.locale)setLocaleState(d.locale)
   }
   const current=s.exists()?s.data() as any:null;
   if(current?.role==="admin") setVipAccess(true);
   else if(u.email){try{const vs=await getDocs(query(collection(db,"vipVaultItems"),where("sharedEmails","array-contains",String(u.email).toLowerCase()),limit(1)));setVipAccess(!vs.empty)}catch{setVipAccess(false)}}
 }

 useEffect(()=>{
   const savedLocale=localStorage.getItem("gm_locale");
const savedCurrency=localStorage.getItem("gm_currency");

if(
  savedLocale==="hy" ||
  savedLocale==="en" ||
  savedLocale==="ru"
){
  setLocaleState(savedLocale);
}else{
  localStorage.removeItem("gm_locale");
  setLocaleState("hy");
}

if(savedCurrency==="USD" || savedCurrency==="AMD"){
  setCurrencyState(savedCurrency);
}else{
  localStorage.removeItem("gm_currency");
  setCurrencyState("USD");
}
   const loadFx=()=>fetch("/api/market-rates",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(x=>{if(x?.usdAmd)setUsdAmd(Number(x.usdAmd))}).catch(()=>{});
   loadFx();
   const fxTimer=setInterval(loadFx,5*60*1000);
   const unsub=onAuthStateChanged(auth,async u=>{setUser(u);if(u)await load(u);else{setProfile(null);setVipAccess(false)}setLoading(false)});
   return()=>{clearInterval(fxTimer);unsub()}
 },[]);

 const setLocale=(l:Locale)=>{setLocaleState(l);localStorage.setItem("gm_locale",l);if(user)setDoc(doc(db,"users",user.uid),{locale:l},{merge:true}).catch(()=>{})};
 const setCurrency=(c:Currency)=>{setCurrencyState(c);localStorage.setItem("gm_currency",c)};

 async function google(){
   try{
     await signInWithPopup(auth,googleProvider);
     setPendingGoogleCredential(null);
     setPendingGoogleEmail("");
   }catch(e:any){
     if(e?.code==="auth/account-exists-with-different-credential"){
       const credential=GoogleAuthProvider.credentialFromError(e);
       const email=String(e?.customData?.email||"");
       if(credential&&email){
         setPendingGoogleCredential(credential);
         setPendingGoogleEmail(email);
         const err:any=new Error("GOOGLE_LINK_REQUIRED");
         err.code="goldmate/google-link-required";
         throw err;
       }
     }
     throw e;
   }
 }

 async function completeGoogleLink(password:string){
   if(!pendingGoogleCredential||!pendingGoogleEmail)throw new Error("No pending Google account link.");
   const result=await signInWithEmailAndPassword(auth,pendingGoogleEmail,password);
   await linkWithCredential(result.user,pendingGoogleCredential);
   await result.user.reload();
   setAuthVersion(v=>v+1);
   setPendingGoogleCredential(null);
   setPendingGoogleEmail("");
 }

 function cancelGoogleLink(){setPendingGoogleCredential(null);setPendingGoogleEmail("")}

 async function connectGoogle(){
   if(!auth.currentUser)throw new Error("Not signed in.");
   if(auth.currentUser.providerData.some(p=>p.providerId==="google.com"))return;
   await linkWithPopup(auth.currentUser,googleProvider);
   await auth.currentUser.reload();
   setAuthVersion(v=>v+1);
 }

 async function resetPassword(email:string){
   await sendPasswordResetEmail(auth,email.trim());
 }

 async function setAccountPassword(password:string){
   const u=auth.currentUser;
   if(!u||!u.email)throw new Error("No signed-in email account.");
   const hasPassword=u.providerData.some(p=>p.providerId==="password");
   if(hasPassword) await updatePassword(u,password);
   else await linkWithCredential(u,EmailAuthProvider.credential(u.email,password));
   await u.reload();
   setAuthVersion(v=>v+1);
 }

 const value=useMemo<C>(()=>({
   user,profile,loading,vipAccess,locale,t:getDict(locale),currency,usdAmd,pendingGoogleEmail,
   setLocale,setCurrency,money:(amountAMD:number)=>formatMoney(amountAMD,currency,usdAmd),
   google,completeGoogleLink,cancelGoogleLink,connectGoogle,
   login:async(e,p)=>{await signInWithEmailAndPassword(auth,e,p)},
   register:async(n,e,p)=>{
  const cleanName=n.trim();
  const cleanEmail=e.trim().toLowerCase();

  const c=await createUserWithEmailAndPassword(
    auth,
    cleanEmail,
    p
  );

  await updateProfile(c.user,{
    displayName:cleanName
  });

  await setDoc(
    doc(db,"users",c.user.uid),
    {
      displayName:cleanName,
      email:cleanEmail,
      photoURL:"",
      phone:"",
      role:"buyer",
      sellerApproved:false,
      locale,
      createdAt:serverTimestamp()
    },
    {merge:true}
  );

  setProfile({
  id:c.user.uid,
  displayName:cleanName,
  email:cleanEmail,
  photoURL:"",
  phone:"",
  role:"buyer",
  sellerApproved:false,
  locale
} as AppUser);
},
   resetPassword,setAccountPassword,
   logout:async()=>{await signOut(auth)},
   refresh:async()=>{if(auth.currentUser)await load(auth.currentUser)}
 }),[user,profile,loading,vipAccess,locale,currency,usdAmd,pendingGoogleEmail,pendingGoogleCredential,authVersion]);
 return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export function useApp(){const x=useContext(Ctx);if(!x)throw new Error("Providers missing");return x}
