"use client";

import {useEffect,useState} from "react";
import {resetPassword} from "../api-client";

export default function ResetPasswordPage(){
 const [token,setToken]=useState("");
 const [password,setPassword]=useState("");
 const [confirmPassword,setConfirmPassword]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");

 useEffect(()=>{
  const value=new URLSearchParams(window.location.search).get("token")||"";
  setToken(value);
 },[]);

 const submit=async()=>{
  setError("");
  setNotice("");
  if(!token){
   setError("This reset link is invalid or has expired.");
   return;
  }
  if(password.length<12){
   setError("Use a password with at least 12 characters.");
   return;
  }
  if(password!==confirmPassword){
   setError("Passwords do not match.");
   return;
  }

  setBusy(true);
  try{
   const result=await resetPassword({token,password});
   setNotice(result.message);
  }catch(caught){
   setError(caught instanceof Error?caught.message:"Could not update your password.");
  }finally{
   setBusy(false);
  }
 };

 return <main className="auth-shell">
  <div className="auth-card">
   <div className="auth-brand">LIFE ADMIN<span>.</span></div>
   <div className="auth-copy">
    <p className="eyebrow">Password recovery</p>
    <h1>Choose a new password</h1>
    <p>Create a new password for your Life Admin account. Your reset link can only be used once.</p>
   </div>
   <label className="auth-field">
    <span>New password</span>
    <input value={password} onChange={event=>setPassword(event.target.value)} placeholder="At least 12 characters" type="password" autoComplete="new-password"/>
   </label>
   <label className="auth-field">
    <span>Confirm password</span>
    <input value={confirmPassword} onChange={event=>setConfirmPassword(event.target.value)} placeholder="Repeat your password" type="password" autoComplete="new-password"/>
   </label>
   {error&&<div className="auth-error" role="alert">{error}</div>}
   {notice&&<div className="auth-notice" role="status">{notice}</div>}
   {notice
    ?<button className="dark full auth-submit" onClick={()=>{window.location.href="/";}}>Back to sign in</button>
    :<button className="dark full auth-submit" disabled={busy} onClick={submit}>{busy?"Please wait…":"Update password"}</button>}
   <button className="text full" disabled={busy} onClick={()=>{window.location.href="/";}}>Cancel</button>
   <div className="auth-note"><strong>Secure account</strong><span>Your reset token is stored only as a one-way hash and expires after 30 minutes.</span></div>
  </div>
 </main>;
}
