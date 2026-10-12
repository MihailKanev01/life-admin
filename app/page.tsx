"use client";
import {useEffect,useRef,useState} from "react";
import {I18nProvider,LanguageSwitcher,useI18n,translate,type Locale} from "./i18n";
import {
  ApiReminder,
  ApiNote,
  ApiPayment,
  ApiThing,
  ApiSearchResult,
  ApiUser,
  archiveThing,
  completeOnboarding,
  completeReminder,
  createNote,
  createExpiryQuickAdd,
  createPayment,
  createReminder,
  createThing,
  cancelPayment,
  getCurrentUser,
  getNotes,
  getPayments,
  getReminders,
  getThings,
  loginAccount,
  logoutAccount,
  deleteNote,
  markPaymentPaid,
  registerAccount,
  requestPasswordReset,
  skipPayment,
  rescheduleReminder,
  searchLife,
  snoozeReminder,
  updateReminder,
  updateNote,
  updatePayment,
  updateThing,
} from "./api-client";
import DocumentsPanel from "./documents-panel";

type Section="home"|"things"|"payments"|"documents"|"search";
type Theme="light"|"dark";
type AuthMode="create"|"login"|"forgot";

type Account={
 id:string;
 name:string;
 email:string;
 timezone:string;
 onboardingComplete:boolean;
 createdAt:string;
};

type AttentionItem={
 id:string;
 title:string;
 meta:string;
 amount:string;
 urgent:boolean;
 context:string;
 dueDate:string|null;
 thingId:string|null;
};

type QuickProposal={
 type:"Reminder"|"Thing"|"Payment"|"Document";
 title:string;
 context:string;
 due:string;
 thingId?:string|null;
 thingName?:string|null;
 thingType?:string;
 recordTitle?:string;
 expiresOn?:string;
 reminderOn?:string;
};

function mapUser(user:ApiUser):Account{
 return {
  id:user.id,
  name:user.displayName,
  email:user.email,
  timezone:user.timezone,
  onboardingComplete:user.onboardingComplete,
  createdAt:user.createdAt,
 };
}

const initialAttention:AttentionItem[]=[];


const walkthroughSteps=[
 {
  eyebrow:"Welcome to Life Admin",
  title:"Your life admin, without the mental load.",
  text:"Create one personal workspace for the things you own, the payments you make and the tasks that need attention.",
  visual:<div className="walkvisual"><div className="walkquote">“What matters right now?”</div><div className="walkline"><span/><span/><span/></div></div>,
 },
 {
  eyebrow:"Things",
  title:"Start with what you manage.",
  text:"Cars, homes, devices and other real-world things keep their reminders, documents, payments and history together.",
  visual:<div className="walkvisual"><div className="walkthing"><span>🚗</span><div><strong>Mazda 6</strong><small>1 thing needs attention</small></div><b>›</b></div><div className="walkcontext"><span>Car insurance</span><span>Insurance policy</span><span>Service history</span></div></div>,
 },
 {
  eyebrow:"Quick Add",
  title:"Tell us naturally.",
  text:"Write something the way you would normally say it. Life Admin proposes the details and asks you to confirm before saving.",
  visual:<div className="walkvisual"><div className="walkinput">Car insurance expires June 14</div><div className="walkproposal"><span>Reminder</span><span>Mazda 6</span><span>June 14</span></div></div>,
 },
 {
  eyebrow:"Home",
  title:"Know what deserves your attention.",
  text:"Instead of another giant task list, Home keeps the next important things visible and connected to the context you need.",
  visual:<div className="walkvisual"><div className="walkhome"><small>Needs attention</small><strong>Car insurance</strong><span>Due in 5 days · Mazda 6</span></div><div className="walkhome mutedwalk"><small>Coming up</small><strong>TV warranty</strong><span>24 days</span></div></div>,
 },
];

function subtractDaysFromIso(isoDate:string,days:number):string|null{
 const parts=isoDate.split("-").map(Number);
 if(parts.length!==3||parts.some(value=>!Number.isFinite(value)))return null;
 const date=new Date(Date.UTC(parts[0],parts[1]-1,parts[2]));
 if(Number.isNaN(date.getTime()))return null;
 date.setUTCDate(date.getUTCDate()-days);
 return date.toISOString().slice(0,10);
}

function formatQuickAddDate(isoDate:string,locale:Locale="en"){
 const parts=isoDate.split("-").map(Number);
 if(parts.length!==3||parts.some(value=>!Number.isFinite(value)))return isoDate;
 return new Intl.DateTimeFormat(locale,{
  month:"long",day:"numeric",year:"numeric",timeZone:"UTC",
 }).format(new Date(Date.UTC(parts[0],parts[1]-1,parts[2])));
}

function inferThingTypeFromQuickAdd(text:string,thingName:string){
 const lower=(text+" "+thingName).toLowerCase();
 if(/\b(home|house|flat|apartment|boiler)\b/.test(lower))return "Home";
 if(/\b(dog|cat|pet|bella)\b/.test(lower))return "Pet";
 if(/\b(phone|laptop|computer|tablet|device)\b/.test(lower))return "Device";
 if(/\b(car|vehicle|mazda|toyota|bmw|golf|audi|ford|volkswagen|vw|skoda|honda|volvo)\b/.test(lower))return "Vehicle";
 return "Other";
}

function buildQuickProposal(text:string,things:ApiThing[]=[],selectedThingId:string|null=null):QuickProposal{
 const normalized=text.trim();
 const lower=normalized.toLowerCase();
 const dateMatch=normalized.match(/\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\b/i);
 const due=dateMatch?dateMatch[0]:"Choose a date";

 // The documented expiry intent captures a Thing, a record and a 30-day reminder.
 const expiryIntent=Boolean(dateMatch)&&/\b(?:expire(?:s|d|ing)?|expiry|expiration|renew(?:s|al)?)\b/i.test(lower);
 if(expiryIntent&&dateMatch){
  const phraseMatch=normalized.match(/\bfor\s+(.+?)\s+(?:expire(?:s|d|ing)?|expiry|expiration|renew(?:s|al)?)\b/i);
  const requestedThingName=phraseMatch?.[1]?.trim()||null;
  const selectedThing=selectedThingId?things.find(item=>item.id===selectedThingId):undefined;
  const namedThing=requestedThingName
   ?things.find(item=>item.name.toLowerCase()===requestedThingName.toLowerCase())
      ||things.find(item=>item.name.toLowerCase().includes(requestedThingName.toLowerCase())
        ||requestedThingName.toLowerCase().includes(item.name.toLowerCase()))
   :undefined;
  const linkedThing=namedThing||selectedThing;
  const thingName=linkedThing?.name||requestedThingName||null;
  const expiresOn=proposalDueDate(dateMatch[0]);
  const reminderOn=expiresOn?subtractDaysFromIso(expiresOn,30):null;
  const recordTitle=lower.includes("insurance")?"Insurance"
   :lower.includes("warranty")?"Warranty"
   :lower.includes("registration")?"Registration"
   :lower.includes("service")||lower.includes("maintenance")?"Service"
   :lower.includes("subscription")?"Subscription"
   :"Renewal";
  if(thingName&&expiresOn&&reminderOn){
   return {
    type:"Reminder",
    title:recordTitle+" reminder",
    context:thingName,
    due:dateMatch[0],
    thingId:linkedThing?.id??null,
    thingName,
    thingType:linkedThing?.type||inferThingTypeFromQuickAdd(normalized,thingName),
    recordTitle,
    expiresOn,
    reminderOn,
   };
  }
 }

 if(lower.includes("internet payment"))return {type:"Reminder",title:"Internet payment",context:"Personal",due};
 if(lower.includes("insurance")||lower.includes("car insurance"))return {type:"Reminder",title:"Car insurance",context:"Mazda 6",due};
 if(lower.includes("add a thing"))return {type:"Thing",title:"New thing",context:"Personal",due};
 if(lower.includes("add a payment"))return {type:"Payment",title:"New payment",context:"Recurring payment",due};
 if(lower.includes("add a document"))return {type:"Document",title:"New document",context:"Personal",due};
 if(lower.includes("spotify")||lower.includes("netflix")||lower.includes("subscription"))return {type:"Payment",title:normalized||"Subscription",context:"Recurring payment",due};
 if(lower.includes("warranty"))return {type:"Document",title:"TV warranty",context:"TV",due};
 if(lower.includes("car")||lower.includes("service")||lower.includes("maintenance"))return {type:"Reminder",title:"Car service",context:"Mazda 6",due};
 return {type:"Reminder",title:normalized||"New reminder",context:"Personal",due};
}

type LandingPreviewSection="home"|"things"|"payments"|"search";

function LandingPreview({onTryQuickAdd}:{onTryQuickAdd?:()=>void}){
  const {t,locale}=useI18n();
 const [section,setSection]=useState<LandingPreviewSection>("home");
 const [quickOpen,setQuickOpen]=useState(false);
 const [quickText,setQuickText]=useState("Car insurance expires December 14");
 const [proposal,setProposal]=useState<QuickProposal|null>(null);
 const [saved,setSaved]=useState(false);
 const [searchText,setSearchText]=useState("car");

 const openQuickAdd=(seed?:string)=>{
  setSection("home");
  setQuickOpen(true);
  setQuickText(seed||"Car insurance expires December 14");
  setProposal(null);
  setSaved(false);
  onTryQuickAdd?.();
 };

 const review=()=>{
  if(!quickText.trim())return;
  setProposal(buildQuickProposal(quickText));
 };

 const save=()=>{
  setSaved(true);
  setQuickOpen(false);
  setProposal(null);
 };

 const resetPreview=()=>{
  setQuickText("Car insurance expires December 14");
  setProposal(null);
  setSaved(false);
 };

 const tabs=[
  ["home","Home"],
  ["things","Things"],
  ["payments","Payments"],
  ["search","Search"],
 ] as const;
 const sampleSearchResults=[
  {kind:"Reminder",title:"Car insurance",detail:"Due Dec 14 · Mazda 6"},
  {kind:"Thing",title:"Mazda 6",detail:"235,420 km · Vehicle"},
  {kind:"Payment",title:"Car insurance",detail:"€480.00 · Every year"},
  {kind:"Payment",title:"Netflix",detail:"€14.99 · Every month"},
 ];
 const query=searchText.trim().toLowerCase();
 const visibleSearchResults=sampleSearchResults.filter(item=>
  (item.kind+" "+item.title+" "+item.detail).toLowerCase().includes(query)
 );

 return <section className="landing-demo" aria-label="Interactive Life Admin preview">
  <div className="landing-demo-top">
   <div>
    <span className="landing-demo-kicker">{t("INTERACTIVE PRODUCT PREVIEW")}</span>
    <strong>{t("Explore the workspace")}</strong>
   </div>
   <span className="landing-demo-badge">{t("Sample data · try the tabs and Quick Add")}</span>
  </div>

  <div className="landing-window">
   <div className="landing-window-top">
    <div className="landing-window-brand">LIFE ADMIN<span>.</span></div>
    <button type="button" className="landing-window-search" onClick={()=>setSection("search")} aria-label={t("Search the example workspace")}>⌕ <span>{t("Search the example workspace...")}</span><kbd>{t("Open")}</kbd></button>
    <button className="landing-window-add" onClick={()=>openQuickAdd()}>+ {t("Quick add")}</button>
   </div>

   <div className="landing-window-body">
    <nav className="landing-window-nav" aria-label="Preview sections">
     {tabs.map(([key,label])=><button
      key={key}
      className={section===key?"active":""}
      aria-pressed={section===key}
      onClick={()=>setSection(key)}
     >{key==="home"?"⌂":key==="things"?"◫":key==="payments"?"€":"⌕"} {t(label)}</button>)}
    </nav>

    <div className="landing-window-content">
     {section==="home"&&<div className="landing-preview-page">
      <div className="landing-preview-heading">
       <div><span>{t("YOUR DAY AT A GLANCE")}</span><h3>{t("Good afternoon")}, Alex</h3><p>{saved?t("One sample reminder saved in this demo."):t("See what needs attention and what’s coming up.")}</p></div>
       <button onClick={()=>openQuickAdd()}>+ {t("Quick add")}</button>
      </div>
      <div className="landing-preview-section-heading"><span>{t("NEEDS ATTENTION")}</span><strong>{t(saved?"Take care of this first":"Nothing urgent")}</strong></div>
      {saved
       ?<button className="landing-preview-row" onClick={()=>openQuickAdd()}><i/><span><strong>Car insurance</strong><small>{t("Due")} Dec 14 · Mazda 6</small></span><b>›</b></button>
       :<div className="landing-preview-empty"><span>✓</span><div><strong>{t("Nothing urgent right now.")}</strong><small>{t("Your upcoming reminders and payments are still visible below.")}</small></div></div>}
      <div className="landing-preview-columns">
       <div className="landing-preview-card"><span>{t("COMING UP")}</span><strong>{t("Next on your radar")}</strong><div><b>▱</b><span>TV warranty<small>24 days</small></span></div><div><b>↻</b><span>Car service<small>1,200 km</small></span></div></div>
       <div className="landing-preview-card"><span>{t("WAITING")}</span><strong>{t("Not in your hands")}</strong><div><b>□</b><span>Amazon return<small>{t("Tomorrow")}</small></span></div></div>
      </div>
     </div>}

     {section==="things"&&<div className="landing-preview-page">
      <div className="landing-preview-heading"><div><span>{t("THINGS")}</span><h3>{t("Your real life, organized")}</h3><p>{t("Keep reminders and payments connected to what they belong to.")}</p></div><button onClick={()=>openQuickAdd("Add a thing")}>+ {t("Add thing")}</button></div>
      <div className="landing-preview-grid">
       {[
        ["🚗","Mazda 6","235,420 km","1 attention"],
        ["⌂","Home","Primary home","No attention"],
        ["◉","Laptop","MacBook Pro","No attention"],
       ].map(([icon,name,detail,status])=><div className="landing-preview-thing" key={name}><b>{icon}</b><strong>{name}</strong><small>{detail}</small><em>{status}</em></div>)}
      </div>
     </div>}

     {section==="payments"&&<div className="landing-preview-page">
      <div className="landing-preview-heading"><div><span>{t("PAYMENTS")}</span><h3>{t("Know what leaves your account")}</h3><p>{t("Recurring bills and subscriptions, without becoming a banking app.")}</p></div><button onClick={()=>openQuickAdd("Add a payment")}>+ {t("Add payment")}</button></div>
      <div className="landing-payment-list">
       {[
        ["Internet","€25.00","Every month","Oct 12"],
        ["Netflix","€14.99","Every month","Oct 18"],
        ["Car insurance","€480.00","Every year","Dec 14"],
       ].map(([name,amount,frequency,due])=><div className="landing-payment-row" key={name}><span><strong>{name}</strong><small>{frequency} · due {due}</small></span><b>{amount}</b></div>)}
      </div>
     </div>}

     {section==="search"&&<div className="landing-preview-page">
      <div className="landing-search-heading"><span>{t("SEARCH")}</span><h3>{t("Find anything you saved")}</h3><p>{t("Search across your things, reminders and payments from one place.")}</p></div>
      <label className="landing-search-box"><span aria-hidden="true">⌕</span><input type="search" value={searchText} onChange={event=>setSearchText(event.target.value)} placeholder={t("Try car, insurance or Netflix")} aria-label={t("Search the sample workspace")}/></label>
      <div className="landing-search-results">
       {visibleSearchResults.map(item=><div key={item.kind+"-"+item.title}><i>{t(item.kind)}</i><strong>{item.title}</strong><small>{item.detail}</small></div>)}
       {!visibleSearchResults.length&&<div className="landing-search-empty">{t("No sample items match that search. Try “car” or “Netflix”.")}</div>}
      </div>
     </div>}
    </div>
   </div>
  </div>

  {saved&&<div className="landing-demo-saved" role="status"><span>✓</span><div><strong>{t("Saved to the demo preview.")}</strong><small>{t("Nothing was sent to a server or account.")}</small></div><button onClick={resetPreview}>{t("Try again")}</button></div>}

  {quickOpen&&<div className="landing-quick-backdrop" onClick={()=>setQuickOpen(false)}>
   <div className="landing-quick-card" onClick={event=>event.stopPropagation()}>
    <div className="landing-quick-top"><div><span>{t("QUICK ADD")}</span><h3>{t("What do you want to remember?")}</h3></div><button aria-label={t("Close preview")} onClick={()=>setQuickOpen(false)}>×</button></div>
    <textarea value={quickText} onChange={event=>{setQuickText(event.target.value);setProposal(null)}} placeholder={t("e.g. Car insurance expires June 14")}/>
    <div className="landing-quick-examples" aria-label={t("Try a sample entry")}><span>{t("Try an example")}</span>{[["Car insurance","Car insurance expires December 14"],["Subscription","Netflix subscription"],["A thing","Add a thing: Home"]].map(([label,value])=><button type="button" key={label} onClick={()=>{setQuickText(value);setProposal(null)}}>{label}</button>)}</div>
    <div className="landing-quick-hint"><b>✦</b><span>{t(proposal?"Review before saving":"We’ll organize it for you.")}<small>{t(proposal?"Nothing is saved until you confirm.":"Type, context and date are proposed before anything is saved.")}</small></span></div>
    {proposal&&<div className="landing-quick-proposal">
     <div><small>{t("TYPE")}</small><strong>{t(proposal.type)}</strong></div>
     <div><small>{t("CONTEXT")}</small><strong>{proposal.context}</strong></div>
     <div><small>{t("WHEN")}</small><strong>{proposal.due}</strong></div>
     <div><small>{t("SAVE AS")}</small><strong>{proposal.title}</strong></div>
    </div>}
    <button className="dark full" disabled={!quickText.trim()} onClick={proposal?save:review}>{t(proposal?"Save to Life Admin":"Review details")}</button>
   </div>
  </div>}
 </section>;
}

function LandingPage({onOpenAuth,theme,onToggleTheme}:{onOpenAuth:(mode:AuthMode)=>void;theme:Theme;onToggleTheme:()=>void}){
  const {t}=useI18n();
 const openPreview=()=>{
  window.setTimeout(()=>document.getElementById("landing-preview")?.scrollIntoView({behavior:"smooth",block:"center"}),0);
 };

 return <main className="landing-page">
  <header className="landing-nav">
   <div className="landing-brand">LIFE ADMIN<span>.</span></div>
   <nav aria-label="Account actions">
     <LanguageSwitcher compact/>
    <button className="landing-nav-link" onClick={()=>onOpenAuth("login")}>{t("Sign in")}</button>
    <button className="landing-nav-theme" type="button" onClick={onToggleTheme} aria-label={theme==="dark"?t("Switch to light theme"):t("Switch to dark theme")} aria-pressed={theme==="dark"}><span aria-hidden="true">{theme==="dark"?"☀":"☾"}</span><span>{theme==="dark"?t("Light theme"):t("Dark theme")}</span></button>
    <button className="dark landing-nav-cta" onClick={()=>onOpenAuth("create")}>{t("Create account")}</button>
   </nav>
  </header>

  <section className="landing-hero" aria-labelledby="landing-hero-title">
   <div className="landing-hero-copy">
    <p className="eyebrow">{t("YOUR LIFE, WITHOUT THE MENTAL LOAD")}</p>
    <h1 id="landing-hero-title">{t("Your reminders, bills and important things. All in one place.")}</h1>
    <p className="landing-lead">{t("Life Admin helps you organize the things you own, recurring bills, documents and reminders in one searchable workspace — so the details you need are there when you need them. No bank connection required.")}</p>
    <div className="landing-actions">
     <button className="dark landing-primary" onClick={()=>onOpenAuth("create")}>{t("Create your account")} <span>→</span></button>
     <button className="light landing-secondary" onClick={openPreview}>{t("See how it works")}</button>
    </div>
    <div className="landing-note"><span>✓</span><span>{t("Start with your own workspace. The interactive preview uses sample data only.")}</span></div>
    <div className="landing-feature-list" aria-label={t("What Life Admin helps you manage")}><span><b>✓</b> {t("Things you own")}</span><span><b>✓</b> {t("Bills and subscriptions")}</span><span><b>✓</b> {t("Reminders and documents")}</span></div>
   </div>

   <div id="landing-preview"><LandingPreview/></div>
  </section>

  <section className="landing-steps" aria-labelledby="landing-steps-title">
   <div className="landing-steps-heading">
    <p className="eyebrow">{t("HOW IT WORKS")}</p>
    <h2 id="landing-steps-title">{t("Capture the thought. Keep the context. Act when it matters.")}</h2>
   </div>
   <div className="landing-steps-grid">
    <article><span>01</span><strong>{t("Capture it naturally")}</strong><p>{t("Write the reminder in your own words instead of filling out a form first.")}</p></article>
    <article><span>02</span><strong>{t("Keep what belongs together")}</strong><p>{t("Connect the reminder to the car, home or other thing it belongs to, with payment context alongside it.")}</p></article>
    <article><span>03</span><strong>{t("See what needs action")}</strong><p>{t("Come back to a focused view of what needs attention, what is next and what you’re waiting on.")}</p></article>
   </div>
  </section>

  <section className="landing-value">
   <div className="landing-value-heading"><p className="eyebrow">{t("BUILT AROUND REAL LIFE")}</p><h2>{t("Less remembering. More knowing what matters.")}</h2></div>
   <div className="landing-value-grid">
    <article><span>01</span><strong>{t("Things stay connected")}</strong><p>{t("Your car, home and devices can have their own reminders and recurring costs, instead of scattered notes.")}</p></article>
    <article><span>02</span><strong>{t("Quick Add starts naturally")}</strong><p>{t("Write something the way you normally would. Life Admin proposes the details before you confirm them.")}</p></article>
    <article><span>03</span><strong>{t("Attention comes first")}</strong><p>{t("Home gives you a simple view of what needs action, what is coming up and what you’re waiting on.")}</p></article>
   </div>
  </section>

  <section className="landing-bottom-cta">
   <div><p className="eyebrow">{t("READY WHEN YOU ARE")}</p><h2>{t("Give your life admin a home.")}</h2><p>{t("Set up your workspace once. Then keep the details that matter close when you need them.")}</p></div>
   <button className="dark landing-primary" onClick={()=>onOpenAuth("create")}>{t("Create your account")} <span>→</span></button>
  </section>

  <footer className="landing-footer"><span>LIFE ADMIN.</span><span>{t("Your personal life admin workspace.")}</span></footer>
 </main>;
}

function AccountGate({onAuthenticated,initialMode="create"}:{onAuthenticated:(account:Account)=>void;initialMode?:AuthMode}){
  const {t}=useI18n();
 const [mode,setMode]=useState<AuthMode>(initialMode);
 const [name,setName]=useState("");
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [confirmPassword,setConfirmPassword]=useState("");
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [busy,setBusy]=useState(false);
 const [showSlowRequestNotice,setShowSlowRequestNotice]=useState(false);

 useEffect(()=>{
  if(!busy||mode==="forgot"){
   setShowSlowRequestNotice(false);
   return;
  }
  const timer=window.setTimeout(()=>setShowSlowRequestNotice(true),5_000);
  return ()=>window.clearTimeout(timer);
 },[busy,mode]);

 const submitPasswordReset=async()=>{
  setError("");
  setNotice("");
  const normalizedEmail=email.trim().toLowerCase();
  if(!/^\S+@\S+\.\S+$/.test(normalizedEmail)){
   setError("Enter a valid email address.");
   return;
  }
  setBusy(true);
  try{
   const result=await requestPasswordReset(normalizedEmail);
   setNotice(result.message);
  }catch(caught){
   setError(caught instanceof Error?caught.message:"Could not start password recovery.");
  }finally{
   setBusy(false);
  }
 };

 const submit=async()=>{
  setError("");
  setNotice("");
  const normalizedEmail=email.trim().toLowerCase();

  if(!/^\S+@\S+\.\S+$/.test(normalizedEmail)){
   setError("Enter a valid email address.");
   return;
  }

  if(mode==="create"){
   if(name.trim().length<2){setError("Enter your name.");return;}
   if(password.length<12){setError("Use a password with at least 12 characters.");return;}
   if(password!==confirmPassword){setError("Passwords do not match.");return;}
  }else if(password.length===0){
   setError("Enter your password.");
   return;
  }

  setBusy(true);
  try{
   const timezone=Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC";
   const result=mode==="create"
    ?await registerAccount({email:normalizedEmail,password,displayName:name.trim(),timezone})
    :await loginAccount({email:normalizedEmail,password});
   onAuthenticated(mapUser(result.user));
  }catch(caught){
   setError(caught instanceof Error?caught.message:"Unable to sign in right now.");
  }finally{
   setBusy(false);
  }
 };

 const switchMode=(next:AuthMode)=>{
  setMode(next);
  setError("");
  setNotice("");
  setPassword("");
  setConfirmPassword("");
 };

 return <main className="auth-shell">
  <div className="auth-card">
   <div className="auth-brand">LIFE ADMIN<span>.</span></div>
   <div className="auth-copy">
    <p className="eyebrow">{t(mode==="create"?"Your personal workspace":mode==="login"?"Welcome back":"Password recovery")}</p>
    <h1>{t(mode==="create"?"Create your account":mode==="login"?"Sign in to Life Admin":"Forgot your password?")}</h1>
    <p>{t(mode==="create"?"Your information will belong to your own account and be available wherever you sign in.":mode==="login"?"Continue to your personal Life Admin workspace.":"Enter your email and we’ll send you a secure reset link if an account exists.")}</p>
   </div>
   {mode==="create"&&<label className="auth-field"><span>{t("Your name")}</span><input value={name} onChange={event=>setName(event.target.value)} placeholder="e.g. Mihail Kanev" autoComplete="name"/></label>}
   <label className="auth-field"><span>{t("Email address")}</span><input value={email} onChange={event=>setEmail(event.target.value)} placeholder="you@example.com" type="email" autoComplete="email"/></label>
   {mode!=="forgot"&&<label className="auth-field"><span>{t("Password")}</span><input value={password} onChange={event=>setPassword(event.target.value)} placeholder={t(mode==="create"?"At least 12 characters":"Your password")} type="password" autoComplete={mode==="create"?"new-password":"current-password"}/></label>}
   {mode==="create"&&<label className="auth-field"><span>{t("Confirm password")}</span><input value={confirmPassword} onChange={event=>setConfirmPassword(event.target.value)} placeholder={t("Repeat your password")} type="password" autoComplete="new-password"/></label>}
   {error&&<div className="auth-error" role="alert">{t(error)}</div>}
   {notice&&<div className="auth-notice" role="status">{notice}</div>}
   {busy&&showSlowRequestNotice&&mode!=="forgot"&&<div className="auth-notice" role="status">{t("The secure service is taking longer than usual to respond. It may be starting after inactivity; please keep this page open.")}</div>}
   <button type="button" className="dark full auth-submit" disabled={busy} onClick={mode==="forgot"?submitPasswordReset:submit}>{t(busy?(showSlowRequestNotice&&mode!=="forgot"?"Waiting for service…":mode==="forgot"?"Sending…":mode==="login"?"Signing in…":"Creating account…"):mode==="create"?"Create account":mode==="login"?"Sign in":"Send reset link")}</button>
   {mode==="login"&&<button className="text full auth-secondary" disabled={busy} onClick={()=>switchMode("forgot")}>{t("Forgot your password?")}</button>}
   {mode==="forgot"
    ?<button className="text full" disabled={busy} onClick={()=>switchMode("login")}>{t("Back to sign in")}</button>
    :<button className="text full" disabled={busy} onClick={()=>switchMode(mode==="create"?"login":"create")}>{t(mode==="create"?"Already have an account? Sign in":"New here? Create an account")}</button>}
   <div className="auth-note"><strong>{t("Secure account")}</strong><span>{t("Reset links expire after 30 minutes and can only be used once. Passwords are stored only as one-way Argon2 hashes.")}</span></div>
  </div>
 </main>;
}
function Walkthrough({account,onComplete}:{account:Account;onComplete:()=>void}){
  const {t}=useI18n();
 const [step,setStep]=useState(0);
 const [direction,setDirection]=useState<"forward"|"back">("forward");
 const [busy,setBusy]=useState(false);
 const current=walkthroughSteps[step];

 const finish=async()=>{
  setBusy(true);
  try{
   await completeOnboarding();
   onComplete();
  }finally{
   setBusy(false);
  }
 };

 return <main className="walkthrough-shell">
  <div className="walkthrough-top"><div className="auth-brand">LIFE ADMIN<span>.</span></div><button className="text" disabled={busy} onClick={finish}>{t("Skip walkthrough")}</button></div>
  <div className="walkthrough-card">
   <div className="walkthrough-progress">{walkthroughSteps.map((_,index)=><span key={index} className={index<=step?"done":""}/>)}</div>
   <div className="walkthrough-visual-wrap">
    <div key={"visual-"+step} className={"walkthrough-step-content "+direction}>{current.visual}</div>
   </div>
   <div key={"copy-"+step} className={"walkthrough-copy walkthrough-step-content "+direction}><p className="eyebrow">{t(current.eyebrow)}</p><h1>{t(current.title)}</h1><p>{t(current.text)}</p></div>
   <div className="walkthrough-actions">
    {step>0?<button className="light action" disabled={busy} onClick={()=>{setDirection("back");setStep(step-1)}}>{t("Back")}</button>:<span/>}
    {step<walkthroughSteps.length-1?<button className="dark action" disabled={busy} onClick={()=>{setDirection("forward");setStep(step+1)}}>{t("Next")}</button>:<button className="dark action" disabled={busy} onClick={finish}>{busy?"Saving…":"Start using Life Admin"}</button>}
   </div>
  </div>
 </main>;
}

const productTourSteps=[
 {target:"home",title:"Home keeps you focused.",text:"This is your daily overview. Important reminders appear first, while upcoming and waiting items stay close by."},
 {target:"add",title:"Quick Add is the fastest way in.",text:"Write what you need in normal language — a reminder, a payment, a Thing or a document — and Life Admin proposes the details before saving."},
 {target:"things",title:"Things connect your real life.",text:"Use Things for your car, home, devices and anything else you manage. Reminders and recurring costs can stay attached to the right Thing."},
 {target:"payments",title:"Payments show what leaves your account.",text:"Track bills, subscriptions and renewals, see what is coming up, and mark payments as paid."},
 {target:"search",title:"Search finds what you saved.",text:"Use Search when you remember the information but not where you put it. Things and payments appear together."},
 {target:"theme",title:"Make the workspace yours.",text:"Switch between light and dark mode whenever you prefer."},
 {target:"account",title:"Your account is your control center.",text:"Manage your profile, replay this tour and sign out from here."},
] as const;

function getVisibleTourTarget(target:string):HTMLElement|null{
 const elements=Array.from(document.querySelectorAll<HTMLElement>('[data-tour="' + target + '"]'));
 return elements.find(element=>{
  const rect=element.getBoundingClientRect();
  const style=window.getComputedStyle(element);
  return rect.width>0&&rect.height>0&&style.display!=="none"&&style.visibility!=="hidden";
 })??null;
}

function ProductTour({account,onComplete}:{account:Account;onComplete:()=>void}){
  const {t}=useI18n();
 const [step,setStep]=useState(0);
 const [direction,setDirection]=useState<"forward"|"back">("forward");
 const [targetRect,setTargetRect]=useState<{top:number;left:number;right:number;bottom:number;width:number;height:number}|null>(null);
 const [tooltipPosition,setTooltipPosition]=useState({top:120,left:24});
 const tooltipRef=useRef<HTMLDivElement|null>(null);
 const current=productTourSteps[step];

 const finish=()=>{
  window.localStorage.setItem("life-admin-product-tour-"+account.id+"-v1","1");
  onComplete();
 };

 const measure=()=>{
  const element=getVisibleTourTarget(current.target);
  if(!element){
   setTargetRect(null);
   setTooltipPosition({top:Math.max(24,(window.innerHeight-300)/2),left:16});
   return;
  }

  const rect=element.getBoundingClientRect();
  const nextRect={
   top:Math.max(6,rect.top-7),
   left:Math.max(6,rect.left-7),
   right:Math.min(window.innerWidth-6,rect.right+7),
   bottom:Math.min(window.innerHeight-6,rect.bottom+7),
   width:Math.min(window.innerWidth-12,rect.width+14),
   height:Math.min(window.innerHeight-12,rect.height+14),
  };
  setTargetRect(nextRect);

  const tooltip=tooltipRef.current;
  const width=tooltip?.offsetWidth??340;
  const height=tooltip?.offsetHeight??230;
  const gap=22;

  let left=rect.left+rect.width/2-width/2;
  let top=rect.bottom+gap;

  if(rect.top>window.innerHeight*0.66){
   left=rect.left+rect.width/2-width/2;
   top=rect.top-height-gap;
  }else if(rect.left<window.innerWidth*0.34){
   left=rect.right+gap;
   top=rect.top+rect.height/2-height/2;
  }else if(rect.right>window.innerWidth*0.66){
   left=rect.left-width-gap;
   top=rect.top+rect.height/2-height/2;
  }

  left=Math.min(Math.max(16,left),Math.max(16,window.innerWidth-width-16));
  top=Math.min(Math.max(16,top),Math.max(16,window.innerHeight-height-16));
  setTooltipPosition({top,left});
 };

 useEffect(()=>{
  const frame=window.requestAnimationFrame(measure);
  const retry=window.setTimeout(measure,60);
  const handleResize=()=>window.requestAnimationFrame(measure);
  window.addEventListener("resize",handleResize);
  window.addEventListener("scroll",handleResize,{passive:true});
  return()=>{
   window.cancelAnimationFrame(frame);
   window.clearTimeout(retry);
   window.removeEventListener("resize",handleResize);
   window.removeEventListener("scroll",handleResize);
  };
 },[step]);

 const next=()=>{
  if(step===productTourSteps.length-1){
   finish();
   return;
  }
  setDirection("forward");
  setStep(value=>value+1);
 };

 const previous=()=>{
  setDirection("back");
  setStep(value=>Math.max(0,value-1));
 };

 const focusCenterX=targetRect?(targetRect.left+targetRect.right)/2:window.innerWidth/2;
 const focusCenterY=targetRect?(targetRect.top+targetRect.bottom)/2:window.innerHeight/2;
 const tooltipWidth=tooltipRef.current?.offsetWidth??340;
 const tooltipHeight=tooltipRef.current?.offsetHeight??230;

 let startX=tooltipPosition.left+tooltipWidth/2;
 let startY=tooltipPosition.top+tooltipHeight/2;
 if(targetRect){
  if(focusCenterY>tooltipPosition.top+tooltipHeight)startY=tooltipPosition.top+tooltipHeight;
  else if(focusCenterY<tooltipPosition.top)startY=tooltipPosition.top;
  else if(focusCenterX<tooltipPosition.left)startX=tooltipPosition.left;
  else startX=tooltipPosition.left+tooltipWidth;
 }

 const dx=focusCenterX-startX;
 const dy=focusCenterY-startY;
 const arrowLength=Math.max(42,Math.sqrt(dx*dx+dy*dy));
 const arrowAngle=Math.atan2(dy,dx);

 return <div className="product-tour" aria-live="polite">
  {targetRect?<>
   <div className="product-tour-shade" style={{top:0,left:0,right:0,height:targetRect.top}}/>
   <div className="product-tour-shade" style={{top:targetRect.bottom,left:0,right:0,bottom:0}}/>
   <div className="product-tour-shade" style={{top:targetRect.top,left:0,width:targetRect.left,height:targetRect.height}}/>
   <div className="product-tour-shade" style={{top:targetRect.top,right:0,width:window.innerWidth-targetRect.right,height:targetRect.height}}/>
   <div className="product-tour-focus" style={{top:targetRect.top,left:targetRect.left,width:targetRect.width,height:targetRect.height}}/>
   <div className="product-tour-arrow" style={{left:startX,top:startY,width:arrowLength,transform:"rotate("+arrowAngle+"rad)"}}/>
  </>:<div className="product-tour-shade product-tour-shade-full"/>}

  <div ref={tooltipRef} className="product-tour-card" style={{top:tooltipPosition.top,left:tooltipPosition.left}} role="dialog" aria-modal="true" aria-labelledby="product-tour-title">
   <div key={"tour-content-"+step} className={"product-tour-content "+direction}>
    <div className="product-tour-step">{t("STEP")} {step+1} {t("OF")} {productTourSteps.length}</div>
    <p className="eyebrow">{t("Life Admin tour")}</p>
    <h2 id="product-tour-title">{current.title}</h2>
    <p>{current.text}</p>
   </div>
   <div className="product-tour-actions">
    <button className="text tour-skip" onClick={finish}>{t("Skip tour")}</button>
    <div>
     {step>0&&<button className="light tour-button" onClick={previous}>{t("Back")}</button>}
     <button className="dark tour-button" onClick={next}>{step===productTourSteps.length-1?"Done":"Next"}</button>
    </div>
   </div>
  </div>
 </div>;
}
function reminderMeta(dueDate:string|null,context:string,locale:Locale="en"){
 if(!dueDate)return context;
 const due=new Date(dueDate+"T00:00:00");
 const today=new Date();
 const start=new Date(today.getFullYear(),today.getMonth(),today.getDate());
 const tomorrow=new Date(start);
 tomorrow.setDate(tomorrow.getDate()+1);
 if(due.getTime()===start.getTime())return translate(locale,"Due today");
 if(due.getTime()===tomorrow.getTime())return translate(locale,"Tomorrow");
 return translate(locale,"Due")+" "+due.toLocaleDateString(locale,{month:"short",day:"numeric"});
}

function reminderAttention(reminder:ApiReminder):AttentionItem{
 return {
  id:reminder.id,
  title:reminder.title,
  meta:reminderMeta(reminder.dueDate,reminder.context),
  amount:"",
  urgent:reminder.dueDate===new Date().toISOString().slice(0,10),
  context:reminder.context,
  dueDate:reminder.dueDate,
  thingId:reminder.thingId,
 };
}

function proposalDueDate(due:string):string|null{
 const match=due.match(/^([A-Za-z]+)\s+(\d{1,2})$/);
 if(!match)return null;
 const months=["january","february","march","april","may","june","july","august","september","october","november","december"];
 const month=months.indexOf(match[1].toLowerCase());
 if(month<0)return null;
 let year=new Date().getFullYear();
 const candidate=new Date(year,month,Number(match[2]));
 const today=new Date();
 if(candidate<new Date(today.getFullYear(),today.getMonth(),today.getDate()))year++;
 return `${year}-${String(month+1).padStart(2,"0")}-${String(Number(match[2])).padStart(2,"0")}`;
}

function paymentDueLabel(nextDueDate:string|null,locale:Locale="en"){
  if(!nextDueDate)return translate(locale,"No date");
  const due=new Date(nextDueDate+"T00:00:00");
  const today=new Date();
  const start=new Date(today.getFullYear(),today.getMonth(),today.getDate());
  const tomorrow=new Date(start);
  tomorrow.setDate(tomorrow.getDate()+1);
  if(due.getTime()===start.getTime())return translate(locale,"Today");
  if(due.getTime()===tomorrow.getTime())return "Tomorrow";
  return due.toLocaleDateString(locale,{month:"short",day:"numeric"});
}

function paymentMonthlyEquivalent(payment:ApiPayment){
  if(payment.frequency==="YEARLY")return payment.amount/12;
  if(payment.frequency==="WEEKLY")return payment.amount*52/12;
  return payment.amount;
}

function paymentFrequencyLabel(frequency:string,locale:Locale="en"){
  if(frequency==="YEARLY")return translate(locale,"Every year");
  if(frequency==="WEEKLY")return translate(locale,"Every week");
  return translate(locale,"Every month");
}

function formatPaymentMoney(amount:number,currency:string,locale:Locale="en"){
  return new Intl.NumberFormat(locale,{style:"currency",currency,currencyDisplay:"symbol",maximumFractionDigits:2}).format(amount);
}

function AppContent(){
  const {t,locale}=useI18n();
 const [ready,setReady]=useState(true);
 const [account,setAccount]=useState<Account|null>(null);
 const [showAuth,setShowAuth]=useState(false);
 const [authMode,setAuthMode]=useState<AuthMode>("create");
 const [section,setSection]=useState<Section>("home");
 const [attention,setAttention]=useState<AttentionItem[]>(initialAttention);
 const [modal,setModal]=useState(false);
 const [selected,setSelected]=useState<AttentionItem|null>(null);
 const [reminderEdit,setReminderEdit]=useState<AttentionItem|null>(null);
 const [reminderTitle,setReminderTitle]=useState("");
 const [reminderContext,setReminderContext]=useState("");
 const [reminderDueDate,setReminderDueDate]=useState("");
 const [things,setThings]=useState<ApiThing[]>([]);
 const [payments,setPayments]=useState<ApiPayment[]>([]);
 const [documentsThingFilter,setDocumentsThingFilter]=useState("");
 const [paymentModal,setPaymentModal]=useState(false);
 const [paymentName,setPaymentName]=useState("");
 const [paymentType,setPaymentType]=useState("BILL");
 const [paymentAmount,setPaymentAmount]=useState("");
 const [paymentFrequency,setPaymentFrequency]=useState("MONTHLY");
 const [paymentDueDate,setPaymentDueDate]=useState("");
 const [paymentThingId,setPaymentThingId]=useState("");
 const [paymentEdit,setPaymentEdit]=useState<ApiPayment|null>(null);
 const [editPaymentName,setEditPaymentName]=useState("");
 const [editPaymentType,setEditPaymentType]=useState("BILL");
 const [editPaymentAmount,setEditPaymentAmount]=useState("");
 const [editPaymentFrequency,setEditPaymentFrequency]=useState("MONTHLY");
 const [editPaymentDueDate,setEditPaymentDueDate]=useState("");
 const [editPaymentThingId,setEditPaymentThingId]=useState("");
 const [selectedThing,setSelectedThing]=useState<ApiThing|null>(null);
 const [thingNotes,setThingNotes]=useState<ApiNote[]>([]);
 const [thingNotesLoading,setThingNotesLoading]=useState(false);
 const [noteModal,setNoteModal]=useState(false);
 const [noteEdit,setNoteEdit]=useState<ApiNote|null>(null);
 const [noteTitle,setNoteTitle]=useState("");
 const [noteBody,setNoteBody]=useState("");
 const [thingEdit,setThingEdit]=useState<ApiThing|null>(null);
 const [editThingName,setEditThingName]=useState("");
 const [editThingType,setEditThingType]=useState("Vehicle");
 const [editThingDetail,setEditThingDetail]=useState("");
 const [thingModal,setThingModal]=useState(false);
 const [quickThingId,setQuickThingId]=useState<string|null>(null);
 const [thingName,setThingName]=useState("");
 const [thingType,setThingType]=useState("Vehicle");
 const [thingDetail,setThingDetail]=useState("");
 const [accountSheet,setAccountSheet]=useState(false);
 const [q,setQ]=useState("");
 const [searchResults,setSearchResults]=useState<ApiSearchResult[]>([]);
 const [searchLoading,setSearchLoading]=useState(false);
 const [theme,setTheme]=useState<Theme>("light");
 const [quickText,setQuickText]=useState("");
 const [quickProposal,setQuickProposal]=useState<QuickProposal|null>(null);
 const attentionMutationVersion=useRef(0);
 const thingMutationVersion=useRef(0);
 const paymentMutationVersion=useRef(0);
 const [showWalkthrough,setShowWalkthrough]=useState(false),[showProductTour,setShowProductTour]=useState(false),[saving,setSaving]=useState(false),[appError,setAppError]=useState("");
 const initialSessionProbeActive=useRef(true);

 useEffect(()=>{
  const saved=window.localStorage.getItem("life-admin-theme") as Theme|null;
  const next=saved==="dark"||saved==="light"?saved:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");
  setTheme(next);
  document.documentElement.dataset.theme=next;

  // Do not block the initial UI on the remote session check.
  // The login screen remains usable even when the API is unavailable.
  setReady(true);

  getCurrentUser().then(({user})=>{
   if(!initialSessionProbeActive.current)return;
   const current=mapUser(user);
   setAccount(current);
   setShowWalkthrough(!current.onboardingComplete);
   setShowProductTour(false);
  }).catch(()=>{});
 },[]);

 useEffect(()=>{
  if(!ready||!account||showWalkthrough)return;
  const requestVersion=attentionMutationVersion.current;
  getReminders().then(data=>{if(requestVersion===attentionMutationVersion.current)setAttention(data.items.map(reminderAttention));}).catch(()=>{});
 },[ready,account,showWalkthrough]);

 useEffect(()=>{
  if(!ready||!account||showWalkthrough)return;
  const requestVersion=thingMutationVersion.current;
  getThings().then(data=>{if(requestVersion===thingMutationVersion.current)setThings(data.items);}).catch(()=>{});
 },[ready,account,showWalkthrough]);

 useEffect(()=>{
  if(!ready||!account||showWalkthrough)return;
  const requestVersion=paymentMutationVersion.current;
  getPayments().then(data=>{if(requestVersion===paymentMutationVersion.current)setPayments(data.items);}).catch(()=>{});
 },[ready,account,showWalkthrough]);

 useEffect(()=>{
  if(!ready||!account||showWalkthrough||!selectedThing){
   setThingNotes([]);
   setThingNotesLoading(false);
   return;
  }
  let active=true;
  setThingNotesLoading(true);
  getNotes(selectedThing.id).then(data=>{
   if(active)setThingNotes(data.items);
  }).catch(caught=>{
   if(active)setAppError(caught instanceof Error?caught.message:"Could not load notes for this Thing.");
  }).finally(()=>{
   if(active)setThingNotesLoading(false);
  });
  return ()=>{active=false;};
 },[ready,account,showWalkthrough,selectedThing?.id]);
 useEffect(()=>{
  if(!ready||!account||showWalkthrough||section!=="search"){
   setSearchResults([]);
   setSearchLoading(false);
   return;
  }
  const query=q.trim();
  if(!query){
   setSearchResults([]);
   setSearchLoading(false);
   return;
  }

  let active=true;
  setSearchLoading(true);
  const timer=window.setTimeout(()=>{
   searchLife(query).then(data=>{
    if(active)setSearchResults(data.items);
   }).catch(caught=>{
    if(active){
     setSearchResults([]);
     setAppError(caught instanceof Error?caught.message:"Could not search your Life Admin.");
    }
   }).finally(()=>{
    if(active)setSearchLoading(false);
   });
  },250);

  return ()=>{
   active=false;
   window.clearTimeout(timer);
  };
 },[ready,account,showWalkthrough,section,q]);

 const toggleTheme=()=>{
  setTheme(current=>{
   const next=current==="dark"?"light":"dark";
   document.documentElement.dataset.theme=next;
   window.localStorage.setItem("life-admin-theme",next);
   return next;
  });
 };

 const openQuickAdd=(prefill="",thingId:string|null=null)=>{
  setModal(true);
  setQuickText(prefill);
  setQuickProposal(null);
  setQuickThingId(thingId);
 };

 const openThingModal=()=>{
  setThingName("");setThingType("Vehicle");setThingDetail("");setThingModal(true);
 };

 const openNoteCreate=()=>{
  setNoteEdit(null);
  setNoteTitle("");
  setNoteBody("");
  setNoteModal(true);
 };

 const openNoteUpdate=(note:ApiNote)=>{
  setNoteEdit(note);
  setNoteTitle(note.title);
  setNoteBody(note.body);
  setNoteModal(true);
 };

 const saveThingNote=async()=>{
  if(!selectedThing)return;
  if(!noteTitle.trim()||!noteBody.trim()){
   setAppError("Add a title and some note details.");
   return;
  }
  setSaving(true);
  setAppError("");
  try{
   const payload={title:noteTitle.trim(),body:noteBody.trim()};
   const saved=noteEdit
    ?await updateNote(noteEdit.id,payload)
    :await createNote({...payload,thingId:selectedThing.id});
   setThingNotes(items=>noteEdit
    ?items.map(item=>item.id===saved.id?saved:item)
    :[saved,...items]);
   setNoteModal(false);
  }catch(caught){
   setAppError(caught instanceof Error?caught.message:"Could not save this note.");
  }finally{
   setSaving(false);
  }
 };

 const removeThingNote=async(note:ApiNote)=>{
  if(!window.confirm("Delete this note?"))return;
  setAppError("");
  try{
   await deleteNote(note.id);
   setThingNotes(items=>items.filter(item=>item.id!==note.id));
  }catch(caught){
   setAppError(caught instanceof Error?caught.message:"Could not delete this note.");
  }
 };

 const openThingEdit=(thing:ApiThing)=>{
  setThingEdit(thing);
  setEditThingName(thing.name);
  setEditThingType(thing.type);
  setEditThingDetail(thing.detail||"");
  setSelectedThing(null);
 };

 const saveThingEdit=async()=>{
  if(!thingEdit)return;
  if(!editThingName.trim()){setAppError("Give this thing a name.");return;}
  setSaving(true);
  setAppError("");
  try{
   const updated=await updateThing(thingEdit.id,{
    name:editThingName.trim(),
    type:editThingType,
    detail:editThingDetail.trim()||null,
   });
   thingMutationVersion.current+=1;
   setThings(items=>items.map(item=>item.id===updated.id?updated:item));
   setThingEdit(null);
  }catch(caught){
   setAppError(caught instanceof Error?caught.message:"Could not update this thing.");
  }finally{
   setSaving(false);
  }
 };

 const openReminderEdit=(item:AttentionItem)=>{
  setReminderEdit(item);
  setReminderTitle(item.title);
  setReminderContext(item.context);
  setReminderDueDate(item.dueDate||"");
  setSelected(null);
 };

 const saveReminderEdit=async()=>{
  if(!reminderEdit)return;
  if(!reminderTitle.trim()){setAppError("Give this reminder a title.");return;}
  if(!reminderContext.trim()){setAppError("Give this reminder a context.");return;}
  setSaving(true);
  setAppError("");
  try{
   const updated=await updateReminder(reminderEdit.id,{
    title:reminderTitle.trim(),
    context:reminderContext.trim(),
    dueDate:reminderDueDate||null,
    thingId:reminderEdit.thingId,
   });
   attentionMutationVersion.current+=1;
   setAttention(items=>items.map(item=>item.id===updated.id?reminderAttention(updated):item));
   setReminderEdit(null);
  }catch(caught){
   setAppError(caught instanceof Error?caught.message:"Could not update this reminder.");
  }finally{
   setSaving(false);
  }
 };

 const openPaymentModal=(prefillName="")=>{
  setPaymentName(prefillName);
  setPaymentType("BILL");
  setPaymentAmount("");
  setPaymentFrequency("MONTHLY");
  setPaymentDueDate("");
  setPaymentThingId("");
  setPaymentModal(true);
 };

 const openPaymentEdit=(payment:ApiPayment)=>{
  setPaymentEdit(payment);
  setEditPaymentName(payment.name);
  setEditPaymentType(payment.type);
  setEditPaymentAmount(String(payment.amount));
  setEditPaymentFrequency(payment.frequency);
  setEditPaymentDueDate(payment.nextDueDate||"");
  setEditPaymentThingId(payment.thingId||"");
 };

 const savePaymentEdit=async()=>{
  if(!paymentEdit)return;
  if(!editPaymentName.trim()){setAppError("Give this payment a name.");return;}
  const amount=Number(editPaymentAmount);
  if(!Number.isFinite(amount)||amount<=0){setAppError("Enter a valid amount.");return;}
  setSaving(true);
  setAppError("");
  try{
   const updated=await updatePayment(paymentEdit.id,{
    name:editPaymentName.trim(),
    type:editPaymentType,
    amount,
    currency:paymentEdit.currency||"EUR",
    frequency:editPaymentFrequency,
    nextDueDate:editPaymentDueDate||null,
    thingId:editPaymentThingId||null,
   });
   paymentMutationVersion.current+=1;
   setPayments(items=>items.map(item=>item.id===updated.id?updated:item));
   setPaymentEdit(null);
  }catch(caught){
   setAppError(caught instanceof Error?caught.message:"Could not update this payment.");
  }finally{
   setSaving(false);
  }
 };

 const savePayment=async()=>{
  if(!paymentName.trim()){setAppError("Give this payment a name.");return;}
  const amount=Number(paymentAmount);
  if(!Number.isFinite(amount)||amount<=0){setAppError("Enter a valid amount.");return;}
  setSaving(true);setAppError("");
  try{
   const created=await createPayment({
    name:paymentName.trim(),
    type:paymentType,
    amount,
    currency:"EUR",
    frequency:paymentFrequency,
    nextDueDate:paymentDueDate||null,
    thingId:paymentThingId||null
   });
   paymentMutationVersion.current+=1;
   setPayments(items=>[created,...items]);
   setPaymentModal(false);
  }catch(caught){setAppError(caught instanceof Error?caught.message:"Could not save this payment.");}
  finally{setSaving(false);}
 };

 const saveThing=async()=>{
  if(!thingName.trim()){setAppError("Give this thing a name.");return;}
  setSaving(true);setAppError("");
  try{
   const created=await createThing({name:thingName.trim(),type:thingType,detail:thingDetail.trim()||null});
   thingMutationVersion.current+=1;
   setThings(items=>[created,...items]);setThingModal(false);
  }catch(caught){setAppError(caught instanceof Error?caught.message:"Could not save this thing.");}
  finally{setSaving(false);}
 };

 const authenticate=(nextAccount:Account)=>{
  initialSessionProbeActive.current=false;
  setAccount(nextAccount);
  setShowAuth(false);
  setAttention([]);
  setShowWalkthrough(!nextAccount.onboardingComplete);
  setShowProductTour(false);
  setSection("home");
 };

 const finishWalkthrough=()=>{
  setShowWalkthrough(false);
  setShowProductTour(false);
 };

 const signOut=async()=>{
  try{await logoutAccount();}catch{}
  initialSessionProbeActive.current=false;
  setAccount(null);
  setShowAuth(false);
  setShowProductTour(false);
  setAccountSheet(false);
  setSection("home");
  setAttention([]);
 };

 if(!ready)return <main className="auth-shell"><div className="auth-loading">{t("Loading your workspace…")}</div></main>;
 if(!account)return <>
  <LandingPage onOpenAuth={mode=>{setAuthMode(mode);setShowAuth(true)}} theme={theme} onToggleTheme={toggleTheme}/>
  {showAuth&&<div className="auth-overlay" role="dialog" aria-modal="true" aria-label={authMode==="login"?"Sign in":"Create account"}>
   <button className="auth-overlay-close" aria-label={t("Close")} onClick={()=>setShowAuth(false)}>×</button>
   <AccountGate key={authMode} initialMode={authMode} onAuthenticated={authenticate}/>
  </div>}
 </>;
 if(showWalkthrough)return <Walkthrough account={account} onComplete={finishWalkthrough}/>;

 const todayStart=(()=>{const d=new Date();return new Date(d.getFullYear(),d.getMonth(),d.getDate());})();
 const upcomingReminders=[...attention]
  .filter(item=>item.dueDate&&new Date(item.dueDate+"T00:00:00")>=todayStart)
  .sort((a,b)=>new Date(a.dueDate+"T00:00:00").getTime()-new Date(b.dueDate+"T00:00:00").getTime())
  .slice(0,3);
 const upcomingPayments=[...payments]
  .filter(item=>item.nextDueDate)
  .sort((a,b)=>new Date(a.nextDueDate+"T00:00:00").getTime()-new Date(b.nextDueDate+"T00:00:00").getTime())
  .slice(0,3);

 return <main className="shell">
  <aside className="sidebar">
   <div className="brand">LIFE ADMIN<span>.</span></div>
   <nav>{([["home","Home","⌂"],["things","Things","◫"],["payments","Payments","€"],["search","Search","⌕"]] as const).map(([k,l,i])=><button data-tour={k} className={section===k?"nav active":"nav"} key={k} onClick={()=>{setSection(k);if(k==="things")setQ("");}}><b>{i}</b>{t(l==="Home"?"Home":l)}</button>)}</nav>
   <button data-tour="add" className="dark add" onClick={()=>openQuickAdd()}>+ {t("Add")}</button>
   <div className="bottom">
    <button data-tour="theme" className="nav" onClick={toggleTheme} aria-label={theme==="dark"?t("Switch to light mode"):t("Switch to dark mode")} aria-pressed={theme==="dark"}><b>{theme==="dark"?"☀":"☾"}</b>{theme==="dark"?t("Light mode"):t("Dark mode")}</button>
    <button data-tour="account" className="nav" onClick={()=>setAccountSheet(true)}><b>●</b>{t("Account")}</button>
    <button className="account" onClick={()=>setAccountSheet(true)}><span>{account.name.slice(0,1).toUpperCase()}</span><div><strong>{account.name}</strong><small>{account.email}</small></div></button>
   </div>
  </aside>

  <section className="content">
   <header>
    <div className="mobilebrand">LIFE ADMIN<span>.</span></div>
    <button data-tour="search" className="searchbar" onClick={()=>setSection("search")}>⌕ <span>{t("Search your life...")}</span><kbd>⌘ K</kbd></button><LanguageSwitcher compact/>
    <button data-tour="theme" className="mobiletheme" onClick={toggleTheme} aria-label={theme==="dark"?"Switch to light mode":"Switch to dark mode"} aria-pressed={theme==="dark"}>{theme==="dark"?"☀":"☾"}</button>
    <button data-tour="account" className="mobileaccount" onClick={()=>setAccountSheet(true)} aria-label={t("Open account")}>{account.name.slice(0,1).toUpperCase()}</button>
    <button data-tour="add" className="mobileplus" onClick={()=>openQuickAdd()}>+</button>
   </header>

   <div className="page">{appError&&<div className="auth-error app-error" role="alert">{t(appError)}<button className="text" onClick={()=>setAppError("")}>{t("Dismiss")}</button></div>}
    {section==="home"&&<><div className="intro"><div><p className="eyebrow">{new Intl.DateTimeFormat(locale,{weekday:"long",day:"numeric",month:"long"}).format(new Date())}</p><h1>{t("Good afternoon")}, {account.name}</h1><p className="subtitle">{attention.length===1?"1 "+t("thing needs your attention."):attention.length>1?attention.length+" "+t("things need your attention."):t("You’re all caught up.")}</p></div><button className="dark action" onClick={()=>openQuickAdd()}>+ {t("Quick add")}</button></div>
     <section><div className="heading"><div><p className="eyebrow">{t("Needs attention")}</p><h2>{attention.length?t("Take care of these first"):t("Nothing urgent")}</h2></div>{attention.length>0&&<span className="count">{attention.length}</span>}</div><div className="list">{attention.map(x=><button className="row" key={x.id} onClick={()=>setSelected(x)}><i className={x.urgent?"dot urgent":"dot"}/><span><strong>{x.title}</strong><small>{x.dueDate?reminderMeta(x.dueDate,x.context,locale):x.meta}</small></span>{x.amount&&<b>{x.amount}</b>}<em>›</em></button>)}{!attention.length&&<div className="empty"><span>✓</span><div><strong>{t("You’re all caught up.")}</strong><small>{t("Nothing important needs attention right now.")}</small></div></div>}</div></section>
     <div className="grid2"><section className="panel"><div className="heading"><div><p className="eyebrow">{t("Coming up")}</p><h2>{t("Next on your radar")}</h2></div></div>{upcomingReminders.length?upcomingReminders.map(item=><div className="simple" key={item.id}><span className="square">!</span><div><strong>{item.title}</strong><small>{item.context}</small></div><b>{item.dueDate?reminderMeta(item.dueDate,item.context,locale).split(" · ")[0]:t("No date")}</b></div>):<div className="empty"><span>✓</span><div><strong>{t("Nothing upcoming.")}</strong><small>{t("Add a reminder with a future date to see it here.")}</small></div></div>}</section><section className="panel"><div className="heading"><div><p className="eyebrow">{t("Payments")}</p><h2>{t("What’s due next")}</h2></div></div>{upcomingPayments.length?upcomingPayments.map(item=><div className="simple" key={item.id}><span className="square">€</span><div><strong>{item.name}</strong><small>{paymentFrequencyLabel(item.frequency,locale)}</small></div><b>{item.nextDueDate?paymentDueLabel(item.nextDueDate,locale):t("No date")}</b></div>):<div className="empty"><span>€</span><div><strong>{t("No upcoming payments.")}</strong><small>{t("Add a recurring payment to keep future costs visible here.")}</small></div></div>}</section></div>
    </>}

    {section==="things"&&<><div className="intro"><div><p className="eyebrow">{t("Things")}</p><h1>{t("Your real life, organized")}</h1><p className="subtitle">{t("Keep reminders, documents and payments connected to what they belong to.")}</p></div><button className="dark action" onClick={openThingModal}>+ {t("Add thing")}</button></div><div className="toolbar"><div className="input">⌕<input value={q} onChange={event=>setQ(event.target.value)} placeholder={t("Search things...")}/></div><small>{things.filter(x=>(x.name+" "+x.type+" "+(x.detail||"")).toLowerCase().includes(q.toLowerCase())).length} things</small></div>{things.length?<div className="thinggrid">{things.filter(x=>(x.name+" "+x.type+" "+(x.detail||"")).toLowerCase().includes(q.toLowerCase())).map(x=><button className="thing" key={x.id} onClick={()=>setSelectedThing(x)}><span className="thingicon">{x.type==="Vehicle"?"🚗":x.type==="Home"?"⌂":x.type==="Device"?"◉":"▣"}</span><strong>{x.name}</strong><small>{x.detail||x.type}</small><em>{x.openReminderCount?x.openReminderCount+" "+t("attention"):t("No attention")}</em></button>)}</div>:<div className="empty"><span>+</span><div><strong>{t("Nothing here yet.")}</strong><small>{t("Add the things you own or manage. Their reminders will stay connected to them.")}</small></div></div>}</>}

    {section==="payments"&&<><div className="intro"><div><p className="eyebrow">{t("Payments")}</p><h1>{t("Know what leaves your account")}</h1><p className="subtitle">{t("Recurring bills and subscriptions — without becoming a banking app.")}</p></div><button className="dark action" onClick={()=>openPaymentModal()}>+ {t("Add payment")}</button></div>
     {(()=>{const today=new Date();const start=new Date(today.getFullYear(),today.getMonth(),today.getDate());const end=new Date(start);end.setDate(end.getDate()+30);const upcoming=payments.filter(x=>x.nextDueDate).filter(x=>{const d=new Date(x.nextDueDate+"T00:00:00");return d>=start&&d<=end}).reduce((sum,x)=>sum+x.amount,0);const recurring=payments.reduce((sum,x)=>sum+paymentMonthlyEquivalent(x),0);const subscriptions=payments.filter(x=>x.type==="SUBSCRIPTION").reduce((sum,x)=>sum+paymentMonthlyEquivalent(x),0);return <div className="stats"><div className="stat"><small>{t("Upcoming")}</small><strong>{formatPaymentMoney(upcoming,"EUR",locale)}</strong><span>{t("next 30 days")}</span></div><div className="stat"><small>{t("Recurring")}</small><strong>{formatPaymentMoney(recurring,"EUR",locale)}</strong><span>{t("per month equivalent")}</span></div><div className="stat"><small>{t("Subscriptions")}</small><strong>{formatPaymentMoney(subscriptions,"EUR",locale)}</strong><span>{t("per month equivalent")}</span></div></div>})()}
     <section className="panel">{payments.length?<>{payments.map(x=><div className="pay" key={x.id}><span className="square">€</span><div><strong>{x.name}</strong><small>{paymentFrequencyLabel(x.frequency,locale)}{x.thingId?" · "+t("Connected to this Thing"):""}</small></div><b>{formatPaymentMoney(x.amount,x.currency,locale)}</b><em className={paymentDueLabel(x.nextDueDate,locale)===t("Today")?"urgentpill":"pill"}>{paymentDueLabel(x.nextDueDate,locale)}</em><button className="light" disabled={saving} onClick={()=>openPaymentEdit(x)}>{t("Edit")}</button><button className="light" disabled={saving} onClick={async()=>{try{const updated=await skipPayment(x.id);paymentMutationVersion.current+=1;setPayments(items=>items.map(item=>item.id===x.id?updated:item));}catch(caught){setAppError(caught instanceof Error?caught.message:"Could not skip this payment.")}}}>{t("Skip")}</button><button className="light" disabled={saving} onClick={async()=>{if(!window.confirm(t("Stop tracking this payment?")))return;try{await cancelPayment(x.id);paymentMutationVersion.current+=1;setPayments(items=>items.filter(item=>item.id!==x.id));}catch(caught){setAppError(caught instanceof Error?caught.message:"Could not cancel this payment.")}}}>{t("Cancel tracking")}</button><button className="light" disabled={saving} onClick={async()=>{try{const updated=await markPaymentPaid(x.id);paymentMutationVersion.current+=1;setPayments(items=>items.map(item=>item.id===x.id?updated:item));}catch(caught){setAppError(caught instanceof Error?caught.message:"Could not mark payment as paid.")}}}>{t("Mark paid")}</button></div>)}</>:<div className="empty"><span>€</span><div><strong>{t("No recurring payments yet.")}</strong><small>{t("Add bills, subscriptions or renewals so you know what is coming up.")}</small></div></div>}</section></>}
     
{section==="documents"&&<DocumentsPanel things={things} initialThingId={documentsThingFilter} onBackToThing={()=>{const thing=things.find(item=>item.id===documentsThingFilter);setSection("things");setSelectedThing(thing||null);}}/>}
     {section==="search"&&<><div className="intro"><div><p className="eyebrow">{t("Search")}</p><h1>{t("Find anything you saved")}</h1><p className="subtitle">{t("Things, reminders, payments and documents in one search.")}</p></div></div><div className="input big">⌕<input autoFocus value={q} onChange={event=>setQ(event.target.value)} placeholder={t("Try “car”, “insurance”, or “internet”...")}/></div><div className="chips">{["Mazda","Insurance","Internet","Warranty"].map(x=><button key={x} onClick={()=>setQ(x)}>{x}</button>)}</div>{q&&<section className="panel">{searchLoading?<div className="search-status">{t("Searching your saved information…")}</div>:searchResults.length?searchResults.map(result=><div className="result" key={result.kind+":"+result.id}><span>{result.kind==="THING"?"◫":result.kind==="DOCUMENT"?"▤":result.kind==="NOTE"?"✎":result.kind==="PAYMENT"?"€":"!"}</span><div><strong>{result.title}</strong><small>{result.subtitle}{result.dueDate?" · "+result.dueDate:""}</small></div><em>{t(result.kind==="THING"?"Thing":result.kind==="DOCUMENT"?"Document":result.kind==="NOTE"?"Note":result.kind==="PAYMENT"?"Payment":"Reminder")}</em></div>):<div className="empty"><span>⌕</span><div><strong>{t("No matches found.")}</strong><small>{t("Try another word or one of the suggested searches above.")}</small></div></div>}</section>}</>}
   </div>
  </section>

  <div className="mobileNav">{([["home","Home","⌂"],["things","Things","◫"],["add","Add","+"],["payments","Payments","€"]] as const).map(([k,l,i])=><button data-tour={k==="add"?"add":k} key={k} className={k==="add"?"mobadd":section===k?"sel":""} onClick={()=>{if(k==="add"){openQuickAdd();return;}setSection(k);if(k==="things")setQ("");}}><span>{i}</span><small>{l}</small></button>)}</div>

  {thingModal&&<div className="backdrop" onClick={()=>setThingModal(false)}><div className="sheet" onClick={event=>event.stopPropagation()}><div className="sheettop"><div><p className="eyebrow">{t("Things")}</p><h2>{t("Add a thing")}</h2></div><button className="close" onClick={()=>setThingModal(false)}>×</button></div><label className="auth-field"><span>{t("Name")}</span><input autoFocus value={thingName} onChange={event=>setThingName(event.target.value)} placeholder="e.g. Mazda 6"/></label><label className="auth-field"><span>{t("Type")}</span><select value={thingType} onChange={event=>setThingType(event.target.value)}><option value="Vehicle">{t("Vehicle")}</option><option value="Home">{t("Home (thing type)")}</option><option value="Device">{t("Device")}</option><option value="Pet">{t("Pet")}</option><option value="Other">{t("Other")}</option></select></label><label className="auth-field"><span>{t("Detail")}</span><input value={thingDetail} onChange={event=>setThingDetail(event.target.value)} placeholder="e.g. 235,420 km"/></label><button className="dark full" disabled={saving} onClick={()=>void saveThing()}>{t(saving?"Saving…":"Save thing")}</button><button className="text full" onClick={()=>setThingModal(false)}>{t("Cancel")}</button></div></div>}

  {paymentModal&&<div className="backdrop" onClick={()=>setPaymentModal(false)}><div className="sheet" onClick={event=>event.stopPropagation()}><div className="sheettop"><div><p className="eyebrow">{t("Payments")}</p><h2>{t("Add a recurring payment")}</h2></div><button className="close" onClick={()=>setPaymentModal(false)}>×</button></div><label className="auth-field"><span>{t("Name")}</span><input autoFocus value={paymentName} onChange={event=>setPaymentName(event.target.value)} placeholder="e.g. Internet"/></label><label className="auth-field"><span>{t("Type")}</span><select value={paymentType} onChange={event=>setPaymentType(event.target.value)}><option value="BILL">{t("Bill")}</option><option value="SUBSCRIPTION">{t("Subscription")}</option><option value="RENEWAL">{t("Renewal")}</option></select></label><label className="auth-field"><span>{t("Amount")}</span><input inputMode="decimal" type="number" min="0.01" step="0.01" value={paymentAmount} onChange={event=>setPaymentAmount(event.target.value)} placeholder="25.00"/></label><label className="auth-field"><span>{t("Frequency")}</span><select value={paymentFrequency} onChange={event=>setPaymentFrequency(event.target.value)}><option value="MONTHLY">{t("Every month")}</option><option value="YEARLY">{t("Every year")}</option><option value="WEEKLY">{t("Every week")}</option></select></label><label className="auth-field"><span>{t("Next due date")}</span><input type="date" value={paymentDueDate} onChange={event=>setPaymentDueDate(event.target.value)}/></label><label className="auth-field"><span>{t("Connected Thing")}</span><select value={paymentThingId} onChange={event=>setPaymentThingId(event.target.value)}><option value="">{t("None")}</option>{things.map(thing=><option key={thing.id} value={thing.id}>{thing.name}</option>)}</select></label><button className="dark full" disabled={saving} onClick={()=>void savePayment()}>{t(saving?"Saving…":"Save payment")}</button><button className="text full" onClick={()=>setPaymentModal(false)}>{t("Cancel")}</button></div></div>}
 
  {accountSheet&&<div className="backdrop" onClick={()=>setAccountSheet(false)}><div className="sheet account-sheet" onClick={event=>event.stopPropagation()}><div className="account-profile"><span>{account.name.slice(0,1).toUpperCase()}</span><div><p className="eyebrow">{t("Your account")}</p><h2>{account.name}</h2><p className="modalcopy">{account.email}</p></div></div><div className="account-language"><LanguageSwitcher/></div><div className="account-details"><div><small>{t("Workspace")}</small><strong>{t("Personal")}</strong><span>{t("Your own Life Admin data")}</span></div><div><small>{t("Storage")}</small><strong>{t("Account-backed")}</strong><span>{t("Your account owns your reminders")}</span></div></div><button className="light full" onClick={()=>{setAccountSheet(false);setShowProductTour(true)}}>{t("Replay walkthrough")}</button><button className="text full" onClick={()=>{void signOut();}}>{t("Sign out")}</button></div></div>}

  {selectedThing&&<div className="backdrop" onClick={()=>setSelectedThing(null)}><div className="sheet" onClick={event=>event.stopPropagation()}><div className="sheettop"><div><p className="eyebrow">{t("Thing")}</p><h2>{selectedThing.name}</h2><p className="modalcopy">{selectedThing.detail||selectedThing.type}</p></div><button className="close" onClick={()=>setSelectedThing(null)}>×</button></div><div className="contextgrid"><div><small>{t("Needs attention")}</small><strong>{selectedThing.openReminderCount?selectedThing.openReminderCount+" "+(selectedThing.openReminderCount===1?t("reminder"):t("reminders")):t("Nothing right now")}</strong><span>{t("Connected to this Thing")}</span></div><button className="document-context-link" onClick={()=>{setDocumentsThingFilter(selectedThing.id);setSelectedThing(null);setSection("documents");}}><small>{t("Documents")}</small><strong>{t("Open related documents")}</strong><span>{t("Receipts and warranties")}</span></button><div><small>{t("History")}</small><strong>{t("Coming next")}</strong><span>{t("Service and changes")}</span></div><div><small>{t("Payment")}</small><strong>{selectedThing.activePaymentCount?selectedThing.activePaymentCount+" "+(selectedThing.activePaymentCount===1?t("active payment"):t("active payments")):t("Nothing right now")}</strong><span>{t("Recurring costs connected to this Thing")}</span></div></div><section className="thing-notes" aria-labelledby="thing-notes-heading">
    <div className="thing-notes-heading">
     <div><h3 id="thing-notes-heading">{t("Notes")}</h3><p>{t("Keep useful details with")} {selectedThing.name}.</p></div>
     <button className="light" disabled={thingNotesLoading} onClick={openNoteCreate}>+ {t("Add note")}</button>
    </div>
    {thingNotesLoading?<p className="thing-notes-empty">{t("Loading notes…")}</p>
     :thingNotes.length?<div className="thing-notes-list">{thingNotes.map(note=><article className="thing-note" key={note.id}>
      <div className="thing-note-copy"><strong>{note.title}</strong><p>{note.body}</p><small>{t("Updated")} {new Intl.DateTimeFormat(locale,{year:"numeric",month:"short",day:"numeric"}).format(new Date(note.updatedAt))}</small></div>
      <div className="thing-note-actions"><button className="light" onClick={()=>openNoteUpdate(note)}>{t("Edit")}</button><button className="text" onClick={()=>void removeThingNote(note)}>{t("Delete")}</button></div>
     </article>)}</div>
     :<p className="thing-notes-empty">{t("No notes yet. Add a useful detail, reference or contact for this Thing.")}</p>}
    </section><button className="light full" onClick={()=>openThingEdit(selectedThing)}>{t("Edit Thing")}</button><button className="light full" onClick={async()=>{if(!window.confirm(t("Archive this Thing? It will leave the active list, but its data will be kept.")))return;try{await archiveThing(selectedThing.id);thingMutationVersion.current+=1;setThings(items=>items.filter(item=>item.id!==selectedThing.id));setSelectedThing(null);}catch(caught){setAppError(caught instanceof Error?caught.message:"Could not archive this Thing.")}}}>{t("Archive Thing")}</button><button className="light full" onClick={()=>{const id=selectedThing.id;setSelectedThing(null);openQuickAdd("Car insurance expires December 14",id);}}>+ {t("Add something to")} {selectedThing.name}</button><button className="text full" onClick={()=>setSelectedThing(null)}>{t("Close")}</button></div></div>}
  
  {noteModal&&<div className="backdrop" onClick={()=>setNoteModal(false)}><div className="sheet" onClick={event=>event.stopPropagation()}>
   <div className="sheettop"><div><p className="eyebrow">{t("Notes")} · {selectedThing?.name||t("Thing")}</p><h2>{t(noteEdit?"Edit note":"Add a note")}</h2></div><button className="close" onClick={()=>setNoteModal(false)}>×</button></div>
   <label className="auth-field"><span>{t("Title")}</span><input aria-label={t("Note title")} autoFocus maxLength={160} value={noteTitle} onChange={event=>setNoteTitle(event.target.value)} placeholder={t("e.g. Insurance contact")}/></label>
   <label className="auth-field"><span>{t("Details")}</span><textarea aria-label={t("Note details")} maxLength={5000} rows={5} value={noteBody} onChange={event=>setNoteBody(event.target.value)} placeholder={t("Add a reference number, contact details or anything worth keeping.")}/></label>
   <button className="dark full" disabled={saving||!noteTitle.trim()||!noteBody.trim()} onClick={()=>void saveThingNote()}>{t(saving?"Saving…":noteEdit?"Save changes":"Save note")}</button>
   <button className="text full" disabled={saving} onClick={()=>setNoteModal(false)}>{t("Cancel")}</button>
  </div></div>}

  {selected&&<div className="backdrop" onClick={()=>setSelected(null)}><div className="sheet" onClick={event=>event.stopPropagation()}><div className="sheeticon">!</div><p className="eyebrow">{t("Needs attention")}</p><h2>{selected.title}</h2><p className="modalcopy">{selected.meta}{selected.amount?" · "+selected.amount:""}</p><div className="reminder-actions"><button className="dark full" onClick={async()=>{try{await completeReminder(selected.id);attentionMutationVersion.current+=1;
     setAttention(items=>items.filter(item=>item.id!==selected.id));setSelected(null);}catch(caught){setAppError(caught instanceof Error?caught.message:"Could not complete reminder.")}}}>{t("Done")}</button><button className="light full" onClick={()=>openReminderEdit(selected)}>{t("Edit reminder")}</button><button className="light full" onClick={async()=>{const tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);const dueDate=tomorrow.toISOString().slice(0,10);try{const updated=await rescheduleReminder(selected.id,dueDate);attentionMutationVersion.current+=1;
     setAttention(items=>items.map(item=>item.id===selected.id?reminderAttention(updated):item));setSelected(null);}catch(caught){setAppError(caught instanceof Error?caught.message:"Could not reschedule reminder.")}}}>{t("Snooze until tomorrow")}</button><button className="text full" onClick={()=>setSelected(null)}>{t("Close")}</button></div></div></div>}

  {paymentEdit&&<div className="backdrop" onClick={()=>setPaymentEdit(null)}><div className="sheet" onClick={event=>event.stopPropagation()}><div className="sheettop"><div><p className="eyebrow">{t("Payments")}</p><h2>{t("Edit payment")}</h2></div><button className="close" onClick={()=>setPaymentEdit(null)}>×</button></div><label className="auth-field"><span>{t("Name")}</span><input autoFocus value={editPaymentName} onChange={event=>setEditPaymentName(event.target.value)} placeholder="e.g. Internet"/></label><label className="auth-field"><span>{t("Type")}</span><select value={editPaymentType} onChange={event=>setEditPaymentType(event.target.value)}><option value="BILL">{t("Bill")}</option><option value="SUBSCRIPTION">{t("Subscription")}</option><option value="RENEWAL">{t("Renewal")}</option></select></label><label className="auth-field"><span>{t("Amount")}</span><input inputMode="decimal" type="number" min="0.01" step="0.01" value={editPaymentAmount} onChange={event=>setEditPaymentAmount(event.target.value)} placeholder="25.00"/></label><label className="auth-field"><span>{t("Frequency")}</span><select value={editPaymentFrequency} onChange={event=>setEditPaymentFrequency(event.target.value)}><option value="MONTHLY">{t("Every month")}</option><option value="YEARLY">{t("Every year")}</option><option value="WEEKLY">{t("Every week")}</option></select></label><label className="auth-field"><span>{t("Next due date")}</span><input type="date" value={editPaymentDueDate} onChange={event=>setEditPaymentDueDate(event.target.value)}/></label><label className="auth-field"><span>{t("Connected Thing")}</span><select value={editPaymentThingId} onChange={event=>setEditPaymentThingId(event.target.value)}><option value="">{t("None")}</option>{things.map(thing=><option key={thing.id} value={thing.id}>{thing.name}</option>)}</select></label><button className="dark full" disabled={saving} onClick={()=>void savePaymentEdit()}>{t(saving?"Saving…":"Save changes")}</button><button className="text full" disabled={saving} onClick={()=>setPaymentEdit(null)}>{t("Cancel")}</button></div></div>}

  {thingEdit&&<div className="backdrop" onClick={()=>setThingEdit(null)}><div className="sheet" onClick={event=>event.stopPropagation()}><div className="sheettop"><div><p className="eyebrow">{t("Thing")}</p><h2>{t("Edit Thing")}</h2></div><button className="close" onClick={()=>setThingEdit(null)}>×</button></div><label className="auth-field"><span>{t("Name")}</span><input autoFocus value={editThingName} onChange={event=>setEditThingName(event.target.value)} placeholder="e.g. Mazda 6"/></label><label className="auth-field"><span>{t("Type")}</span><select value={editThingType} onChange={event=>setEditThingType(event.target.value)}><option value="Vehicle">{t("Vehicle")}</option><option value="Home">{t("Home (thing type)")}</option><option value="Device">{t("Device")}</option><option value="Pet">{t("Pet")}</option><option value="Other">{t("Other")}</option></select></label><label className="auth-field"><span>{t("Detail")}</span><input value={editThingDetail} onChange={event=>setEditThingDetail(event.target.value)} placeholder="e.g. 235,420 km"/></label><button className="dark full" disabled={saving} onClick={()=>void saveThingEdit()}>{t(saving?"Saving…":"Save changes")}</button><button className="text full" disabled={saving} onClick={()=>setThingEdit(null)}>{t("Cancel")}</button></div></div>}

  {reminderEdit&&<div className="backdrop" onClick={()=>setReminderEdit(null)}><div className="sheet" onClick={event=>event.stopPropagation()}><div className="sheettop"><div><p className="eyebrow">{t("Reminder")}</p><h2>{t("Edit reminder")}</h2></div><button className="close" onClick={()=>setReminderEdit(null)}>×</button></div><label className="auth-field"><span>{t("Title")}</span><input autoFocus value={reminderTitle} onChange={event=>setReminderTitle(event.target.value)} placeholder="e.g. Car insurance"/></label><label className="auth-field"><span>{t("Context")}</span><input value={reminderContext} onChange={event=>setReminderContext(event.target.value)} placeholder="e.g. Mazda 6"/></label><label className="auth-field"><span>{t("Due date")}</span><input type="date" value={reminderDueDate} onChange={event=>setReminderDueDate(event.target.value)}/></label><button className="dark full" disabled={saving} onClick={()=>void saveReminderEdit()}>{t(saving?"Saving…":"Save changes")}</button><button className="text full" disabled={saving} onClick={()=>setReminderEdit(null)}>{t("Cancel")}</button></div></div>}

  {modal&&<div className="backdrop" onClick={()=>setModal(false)}><div className="sheet" onClick={event=>event.stopPropagation()}><div className="sheettop"><div><p className="eyebrow">{t("Quick add")}</p><h2>{t("What do you want to remember?")}</h2></div><button className="close" onClick={()=>setModal(false)}>×</button></div><textarea autoFocus value={quickText} onChange={event=>{setQuickText(event.target.value);setQuickProposal(null)}} placeholder={t("e.g. Car insurance expires June 14")}/><div className="aihint"><b>✦</b><div><strong>{t(quickProposal?"Review before saving":"We’ll organize it for you.")}</strong><small>{t(quickProposal?"Nothing is saved until you confirm.":"We’ll identify the type, context and date, then ask you to confirm.")}</small></div></div>{quickProposal?(quickProposal.expiresOn&&quickProposal.reminderOn&&quickProposal.recordTitle?<div className="proposal expiry-proposal">
 <div><small>{t("Thing")}</small><strong>{quickProposal.thingName||quickProposal.context}</strong></div>
 <div><small>{t("Record")}</small><strong>{quickProposal.recordTitle}</strong></div>
 <div><small>{t("Expiry")}</small><strong>{formatQuickAddDate(quickProposal.expiresOn,locale)}</strong></div>
 <div className="proposaltitle"><small>{t("Reminder")}</small><strong>{formatQuickAddDate(quickProposal.reminderOn,locale)} · 30 days before</strong></div>
 </div>:<div className="proposal"><div><small>{t("Type")}</small><strong>{t(quickProposal.type)}</strong></div><div><small>{t("Context")}</small><strong>{quickProposal.context}</strong></div><div><small>{t("When")}</small><strong>{quickProposal.due}</strong></div><div className="proposaltitle"><small>{t("Save as")}</small><strong>{quickProposal.title}</strong></div></div>):<div className="quickgrid">{["Reminder","Thing","Payment","Document"].map(x=><button key={x} onClick={()=>setQuickText(x==="Reminder"?"":"Add a "+x.toLowerCase())}><strong>{t(x)}</strong><small>{t("Capture it quickly")}</small></button>)}</div>}<button className="dark full" disabled={saving||(!quickText.trim()&&!quickProposal)} onClick={async()=>{
 if(!quickProposal){
  setQuickProposal(buildQuickProposal(quickText,things,quickThingId));
  return;
 }
 setSaving(true);
 setAppError("");
 try{
  if(quickProposal.expiresOn&&quickProposal.reminderOn&&quickProposal.recordTitle){
   await createExpiryQuickAdd({
    thingId:quickProposal.thingId??quickThingId,
    thingName:(quickProposal.thingId??quickThingId)?null:quickProposal.thingName,
    thingType:quickProposal.thingType||"Other",
    recordTitle:quickProposal.recordTitle,
    expiresOn:quickProposal.expiresOn,
    reminderOn:quickProposal.reminderOn,
   });
   const [updatedThings,updatedReminders]=await Promise.all([getThings(),getReminders()]);
   thingMutationVersion.current+=1;
   attentionMutationVersion.current+=1;
   setThings(updatedThings.items);
   setAttention(updatedReminders.items.map(reminderAttention));
  }else if(quickProposal.type==="Reminder"){
   const linkedThing=quickThingId?things.find(item=>item.id===quickThingId):things.find(item=>item.name.toLowerCase()===quickProposal.context.toLowerCase());
   const created=await createReminder({
    title:quickProposal.title,
    context:quickProposal.context,
    dueDate:proposalDueDate(quickProposal.due),
    thingId:linkedThing?.id??null
   });
   attentionMutationVersion.current+=1;
   setAttention(items=>[reminderAttention(created),...items]);
   if(linkedThing){
    thingMutationVersion.current+=1;
    setThings(items=>items.map(item=>item.id===linkedThing.id
     ?{...item,openReminderCount:item.openReminderCount+1}
     :item));
   }
  }else if(quickProposal.type==="Thing"){
   const created=await createThing({
    name:quickProposal.title==="New thing"?"New thing":quickProposal.title,
    type:"Other",
    detail:null
   });
   thingMutationVersion.current+=1;
   setThings(items=>[created,...items]);
  }else if(quickProposal.type==="Payment"){
   const amountMatch=quickText.match(/€?\s*(\d+(?:[.,]\d{1,2})?)/);
   setPaymentName(quickProposal.title==="New payment"?"":quickProposal.title);
   setPaymentAmount(amountMatch?amountMatch[1].replace(",","."):"");
   setPaymentFrequency("MONTHLY");
   setPaymentDueDate(proposalDueDate(quickProposal.due)||"");
   const linkedThing=things.find(item=>item.name.toLowerCase()===quickProposal.context.toLowerCase());
   setPaymentThingId(linkedThing?.id??"");
   setModal(false);
   setQuickText("");
   setQuickProposal(null);
   setQuickThingId(null);
   setPaymentModal(true);
   return;
  }else{
   const linkedThingId=quickThingId
    ||things.find(item=>item.name.toLowerCase()===quickProposal.context.toLowerCase())?.id
    ||"";
   setDocumentsThingFilter(linkedThingId);
   setSection("documents");
   setModal(false);
   setQuickText("");
   setQuickProposal(null);
   setQuickThingId(null);
   return;
  }
  setModal(false);
  setQuickText("");
  setQuickProposal(null);
  setQuickThingId(null);
 }catch(caught){
  setAppError(caught instanceof Error?caught.message:"Could not save this item.");
 }finally{
  setSaving(false);
 }
}}}>{t(quickProposal?(saving?"Saving…":"Save to Life Admin"):"Review details")}</button></div></div>}
  {showProductTour&&<ProductTour account={account} onComplete={()=>setShowProductTour(false)}/>}
 </main>;
}


export default function App(){
 return <I18nProvider><AppContent/></I18nProvider>;
}
