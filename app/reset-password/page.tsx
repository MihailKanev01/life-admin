"use client";

import {FormEvent,useEffect,useState} from "react";
import {resetPassword} from "../api-client";

type ResetState="loading"|"form"|"success"|"invalid";

export default function ResetPasswordPage(){
 const [state,setState]=useState<ResetState>("loading");
 const [token,setToken]=useState("");
 const [password,setPassword]=useState("");
 const [confirmPassword,setConfirmPassword]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");

 useEffect(()=>{
  const value=new URLSearchParams(window.location.search).get("token")?.trim()||"";
  setToken(value);
  setState(value?"form":"invalid");
 },[]);

 const submit=async(event:FormEvent)=>{
  event.preventDefault();
  setError("");

  if(!token){
   setState("invalid");
   return;
  }
  if(password.length<12){
   setError("Use a password with at least 12 characters.");
   return;
  }
  if(password.length>256){
   setError("Use a password with no more than 256 characters.");
   return;
  }
  if(password!==confirmPassword){
   setError("Passwords do not match.");
   return;
  }

  setBusy(true);
  try{
   await resetPassword({token,password});
   setPassword("");
   setConfirmPassword("");
   setState("success");
  }catch(caught){
   setError(caught instanceof Error?caught.message:"Could not update your password.");
  }finally{
   setBusy(false);
  }
 };

 const backToLifeAdmin=()=>{window.location.href="/";};

 if(state==="loading"){
  return <main className="auth-shell"><div className="auth-card"><div className="auth-brand">LIFE ADMIN<span>.</span></div><div className="auth-copy"><p className="eyebrow">Password recovery</p><h1>Checking your reset link…</h1><p>We’re preparing a secure password reset.</p></div></div></main>;
 }

 return <main className="auth-shell">
  <div className="auth-card">
   <div className="auth-brand">LIFE ADMIN<span>.</span></div>

   {state==="success"
    ?<>
      <div className="reset-result">
       <div className="reset-icon">✓</div>
       <div className="auth-copy">
        <p className="eyebrow">Password updated</p>
        <h1>You’re ready to sign in.</h1>
        <p>Your password has been changed successfully. The reset link can no longer be used.</p>
       </div>
      </div>
      <button className="dark full auth-submit" onClick={backToLifeAdmin}>Back to Life Admin</button>
     </>
    :state==="invalid"
     ?<>
       <div className="reset-result">
        <div className="reset-icon">!</div>
        <div className="auth-copy">
         <p className="eyebrow">Reset link</p>
         <h1>This reset link isn’t valid.</h1>
         <p>Open the latest password reset email and use its link. Reset links expire after 30 minutes and can only be used once.</p>
        </div>
       </div>
       <button className="dark full auth-submit" onClick={backToLifeAdmin}>Back to Life Admin</button>
      </>
     :<form onSubmit={submit}>
       <div className="auth-copy">
        <p className="eyebrow">Password recovery</p>
        <h1>Choose a new password</h1>
        <p>Create a new password for your Life Admin account.</p>
       </div>

       <label className="auth-field">
        <span>New password</span>
        <input
         autoFocus
         value={password}
         onChange={event=>setPassword(event.target.value)}
         placeholder="At least 12 characters"
         type="password"
         autoComplete="new-password"
         disabled={busy}
        />
       </label>

       <label className="auth-field">
        <span>Confirm password</span>
        <input
         value={confirmPassword}
         onChange={event=>setConfirmPassword(event.target.value)}
         placeholder="Repeat your password"
         type="password"
         autoComplete="new-password"
         disabled={busy}
        />
       </label>

       {error&&<div className="auth-error" role="alert">{error}</div>}

       <button className="dark full auth-submit" disabled={busy}>
        {busy?"Updating password…":"Update password"}
       </button>
       <button className="text full" type="button" disabled={busy} onClick={backToLifeAdmin}>Cancel</button>
       <div className="auth-note"><strong>Secure reset</strong><span>Your reset token is stored only as a one-way hash and expires after 30 minutes.</span></div>
      </form>}
  </div>
 </main>;
}
