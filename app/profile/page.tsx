"use client";
import {useEffect,useLayoutEffect,useState} from "react";
import {collection,doc,onSnapshot,orderBy,query,setDoc,where} from "firebase/firestore";
import {getDownloadURL,ref,uploadBytes} from "firebase/storage";
import {db,storage} from "@/lib/firebase";
import {useApp} from "@/components/providers";
import {toast} from "sonner";
import type {Dict} from "@/lib/i18n";

function authErrorMessage(error:any,t:Dict){
 const code=String(error?.code||"");
 switch(code){
  case "auth/invalid-credential":
  case "auth/wrong-password":
  case "auth/user-not-found":
  case "auth/missing-password": return t.invalidCredentials;
  case "auth/email-already-in-use": return t.authEmailInUse;
  case "auth/invalid-email": return t.authInvalidEmail;
  case "auth/weak-password": return t.passwordMin;
  case "auth/too-many-requests": return t.authTooManyRequests;
  case "auth/popup-closed-by-user":
  case "auth/cancelled-popup-request": return t.authPopupClosed;
  case "auth/popup-blocked": return t.authPopupBlocked;
  case "auth/network-request-failed": return t.authNetworkError;
  case "auth/user-disabled": return t.authUserDisabled;
  case "auth/requires-recent-login": return t.recentLoginRequired;
  case "auth/provider-already-linked": return t.authProviderLinked;
  case "auth/credential-already-in-use": return t.authCredentialInUse;
  case "auth/operation-not-allowed": return t.authOperationNotAllowed;
  default: return t.authGenericError;
 }
}

function GoogleIcon(){return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.39a4.61 4.61 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.97-4.33 2.97-7.38z"/><path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.63-2.39l-3.24-2.51c-.9.6-2.05.95-3.39.95-2.61 0-4.82-1.76-5.61-4.13H3.04v2.59A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.39 13.92A6.02 6.02 0 0 1 6.08 12c0-.67.11-1.32.31-1.92V7.49H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.51l3.35-2.59z"/><path fill="#EA4335" d="M12 5.95c1.47 0 2.79.5 3.83 1.5l2.87-2.87C16.96 2.96 14.7 2 12 2a10 10 0 0 0-8.96 5.49l3.35 2.59C7.18 7.71 9.39 5.95 12 5.95z"/></svg>}

export default function Profile(){
 const {user,profile,loading,t,google,completeGoogleLink,cancelGoogleLink,pendingGoogleEmail,connectGoogle,login,register,resetPassword,setAccountPassword,logout,refresh,money}=useApp();
 const [mode,setMode]=useState<"login"|"register">("login"),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[name,setName]=useState(""),[phone,setPhone]=useState(""),[orders,setOrders]=useState<any[]>([]),[file,setFile]=useState<File|null>(null),[linkPassword,setLinkPassword]=useState(""),[newPassword,setNewPassword]=useState(""),[confirmPassword,setConfirmPassword]=useState(""),[busy,setBusy]=useState(false);

 useEffect(()=>{
  if(!profile)return;

  setName(profile.displayName||"");
  setPhone(profile.phone||"");
},[profile?.id,profile?.displayName,profile?.phone]);

useEffect(()=>{
  if(!profile?.id)return;

  const q=query(
    collection(db,"orders"),
    where("buyerId","==",profile.id),
    orderBy("createdAt","desc")
  );

  return onSnapshot(
    q,
    s=>setOrders(
      s.docs.map(d=>({
        id:d.id,
        ...d.data()
      }))
    )
  );
},[profile?.id]);

 if(loading)return <main className="shell page">{t.loading}</main>;

 if(!profile){
   async function submit(){
     if(
  !email.trim() ||
  !password ||
  (mode==="register" && !name.trim())
){
  return toast.error(t.authRequired);
}
     if(password.length<6)return toast.error(t.passwordMin);
     setBusy(true);
     try{mode==="login"?await login(email.trim(),password):await register(name.trim(),email.trim(),password)}catch(e:any){toast.error(authErrorMessage(e,t))}finally{setBusy(false)}
   }
   async function startGoogle(){
     setBusy(true);
     try{await google()}catch(e:any){if(e?.code==="goldmate/google-link-required")toast.message(t.googleLinkText);else toast.error(authErrorMessage(e,t))}finally{setBusy(false)}
   }
   async function finishGoogleLink(){
     if(linkPassword.length<6)return toast.error(t.passwordMin);
     setBusy(true);
     try{await completeGoogleLink(linkPassword);toast.success(t.googleConnected)}catch(e:any){toast.error(authErrorMessage(e,t))}finally{setBusy(false)}
   }
   async function forgot(){
     const target=(pendingGoogleEmail||email).trim();
     if(!target)return toast.error(t.enterEmailFirst);
     setBusy(true);
     try{await resetPassword(target);toast.success(t.resetSent)}catch(e:any){toast.error(authErrorMessage(e,t))}finally{setBusy(false)}
   }
   return <main className="shell page"><div className="panel" style={{maxWidth:500,margin:"40px auto"}}><div className="eyebrow">GoldMate</div><h1 style={{fontFamily:"Georgia",fontWeight:500,fontSize:40}}>{pendingGoogleEmail?t.googleLinkTitle:mode==="login"?t.signin:t.register}</h1>
   {pendingGoogleEmail?<div style={{display:"grid",gap:10}}><p className="muted" style={{marginTop:0}}>{t.googleLinkText}</p><input className="field" value={pendingGoogleEmail} disabled/><input className="field" type="password" placeholder={t.password} value={linkPassword} onChange={e=>setLinkPassword(e.target.value)}/><button className="btn-primary" disabled={busy} onClick={finishGoogleLink}>{t.linkGoogle}</button><button className="btn-secondary" disabled={busy} onClick={forgot}>{t.forgotPassword}</button><button className="btn-secondary" onClick={()=>{cancelGoogleLink();setLinkPassword("")}}>{t.cancel}</button></div>
   :<div style={{display:"grid",gap:10}}>{mode==="register"&&<input className="field" placeholder={t.name} value={name} onChange={e=>setName(e.target.value)}/>}<input className="field" placeholder={t.email} value={email} onChange={e=>setEmail(e.target.value)}/><input className="field" type="password" placeholder={t.password} value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")submit()}}/><button className="btn-primary" disabled={busy} onClick={submit}>{mode==="login"?t.signin:t.createAccount}</button>{mode==="login"&&<button className="btn-secondary" style={{border:0,background:"transparent",padding:"4px 8px"}} disabled={busy} onClick={forgot}>{t.forgotPassword}</button>}<div style={{display:"flex",alignItems:"center",gap:10,color:"var(--muted)",fontSize:12}}><span style={{height:1,background:"var(--line)",flex:1}}/><span>{t.or}</span><span style={{height:1,background:"var(--line)",flex:1}}/></div><button className="btn-secondary" disabled={busy} onClick={startGoogle} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}><GoogleIcon/>{t.google}</button><button className="btn-secondary" onClick={()=>setMode(mode==="login"?"register":"login")}>{mode==="login"?t.noAccount:t.haveAccount}</button></div>}</div></main>
 }

 async function save(){if(!profile)return;try{let photoURL=profile.photoURL||"";if(file){const s=ref(storage,`public/${profile.id}/profile-${Date.now()}-${file.name}`);await uploadBytes(s,file);photoURL=await getDownloadURL(s)}await setDoc(doc(db,"users",profile.id),{displayName:name,phone,photoURL},{merge:true});await refresh();toast.success(t.success)}catch{toast.error(t.error)}}

 const providers=user?.providerData?.map((p:any)=>p.providerId)||[];
 const hasPassword=providers.includes("password"),hasGoogle=providers.includes("google.com");

 async function savePassword(){
   if(newPassword.length<6)return toast.error(t.passwordMin);
   if(newPassword!==confirmPassword)return toast.error(t.passwordsDoNotMatch);
   setBusy(true);
   try{await setAccountPassword(newPassword);setNewPassword("");setConfirmPassword("");toast.success(hasPassword?t.passwordChanged:t.passwordSet)}catch(e:any){toast.error(authErrorMessage(e,t))}finally{setBusy(false)}
 }
 async function addGoogle(){setBusy(true);try{await connectGoogle();toast.success(t.googleConnected)}catch(e:any){toast.error(authErrorMessage(e,t))}finally{setBusy(false)}}

 return <main className="shell page"><div className="page-title"><div className="eyebrow">GoldMate</div><h1>{t.profileTitle}</h1></div><div className="profile-grid"><div className="panel profile-card"><img className="avatar" src={profile.photoURL||"/brand/goldmate-logo.png"}/><h2>{profile.displayName}</h2><p>{profile.email}</p><div style={{marginTop:18}}>{profile.sellerApproved?<span className="verified">✓ {t.sellerApproved}</span>:<a className="btn-secondary" href="/seller/apply">{t.sellerApply}</a>}</div><button className="btn-secondary" onClick={logout} style={{marginTop:12}}>{t.signout}</button></div><div><div className="panel"><h2>{t.editProfile}</h2><div className="form-grid"><label><span className="form-label">{t.name}</span><input className="field" value={name} onChange={e=>setName(e.target.value)}/></label><label><span className="form-label">{t.phone}</span><input className="field" value={phone} onChange={e=>setPhone(e.target.value)}/></label><label className="full"><span className="form-label">{t.photos}</span><input className="field" type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0]||null)}/></label></div><button className="btn-primary" style={{marginTop:14}} onClick={save}>{t.save}</button></div>
 <div className="panel" style={{marginTop:16}}><h2>{t.passwordSecurity}</h2><div style={{display:"grid",gap:10}}><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><span className="verified">{hasGoogle?"✓ ":""}Google</span><span className="verified">{hasPassword?"✓ ":""}{t.password}</span></div>{!hasGoogle&&<button className="btn-secondary" disabled={busy} onClick={addGoogle} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,maxWidth:280}}><GoogleIcon/>{t.connectGoogle}</button>}<input className="field" type="password" placeholder={t.newPassword} value={newPassword} onChange={e=>setNewPassword(e.target.value)}/><input className="field" type="password" placeholder={t.confirmPassword} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)}/><button className="btn-primary" disabled={busy} onClick={savePassword}>{hasPassword?t.changePassword:t.setPassword}</button></div></div>
 <div className="panel" style={{marginTop:16}}><h2>{t.myOrders}</h2>{orders.length?orders.map(o=><div key={o.id} style={{padding:"14px 0",borderBottom:"1px solid var(--line)",display:"flex",justifyContent:"space-between"}}><div><strong>{o.productTitle}</strong><div className="muted">{o.status==="new"?t.orderNew:o.status==="confirmed"?t.orderConfirmed:o.status==="completed"?t.orderCompleted:t.orderCancelled}</div></div><div>{money(o.amountAMD||0)}</div></div>):<div className="empty">{t.empty}</div>}</div></div></div></main>
}
