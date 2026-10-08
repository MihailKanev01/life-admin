"use client";
import {useEffect,useRef,useState} from "react";
import {
  ApiReminder,
  ApiThing,
  ApiUser,
  completeOnboarding,
  completeReminder,
  createReminder,
  createThing,
  getCurrentUser,
  getReminders,
  getThings,
  loginAccount,
  logoutAccount,
  registerAccount,
  snoozeReminder,
} from "./api-client";

type Section="home"|"things"|"payments"|"search";
type Theme="light"|"dark";
type AuthMode="create"|"login";

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
};

type QuickProposal={type:"Reminder"|"Thing"|"Payment"|"Document";title:string;context:string;due:string};

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


const payments=[
 ["Internet","€25","Every month · 15th","Today"],
 ["Spotify","€8","Every month · 3rd","27 days"],
 ["Car insurance","€120","Yearly","5 days"],
] as const;

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

function buildQuickProposal(text:string):QuickProposal{
 const normalized=text.trim();
 const lower=normalized.toLowerCase();
 const dateMatch=normalized.match(/\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\b/i);
 const due=dateMatch?dateMatch[0]:"Choose a date";
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

function AccountGate({onAuthenticated}:{onAuthenticated:(account:Account)=>void}){
 const [mode,setMode]=useState<AuthMode>("create");
 const [name,setName]=useState("");
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [confirmPassword,setConfirmPassword]=useState("");
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);

 const submit=async()=>{
  setError("");
  const normalizedEmail=email.trim().toLowerCase();
  if(mode==="create"){
   if(name.trim().length<2){setError("Enter your name.");return;}
   if(!/^\S+@\S+\.\S+$/.test(normalizedEmail)){setError("Enter a valid email address.");return;}
   if(password.length<12){setError("Use a password with at least 12 characters.");return;}
   if(password!==confirmPassword){setError("Passwords do not match.");return;}
  }else if(password.length===0){
   setError("Enter your password.");return;
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

 return <main className="auth-shell">
  <div className="auth-card">
   <div className="auth-brand">LIFE ADMIN<span>.</span></div>
   <div className="auth-copy">
    <p className="eyebrow">{mode==="create"?"Your personal workspace":"Welcome back"}</p>
    <h1>{mode==="create"?"Create your account":"Sign in to Life Admin"}</h1>
    <p>{mode==="create"?"Your information will belong to your own account and be available wherever you sign in.":"Continue to your personal Life Admin workspace."}</p>
   </div>
   {mode==="create"&&<label className="auth-field"><span>Your name</span><input value={name} onChange={event=>setName(event.target.value)} placeholder="e.g. Mihail Kanev" autoComplete="name"/></label>}
   <label className="auth-field"><span>Email address</span><input value={email} onChange={event=>setEmail(event.target.value)} placeholder="you@example.com" type="email" autoComplete="email"/></label>
   <label className="auth-field"><span>Password</span><input value={password} onChange={event=>setPassword(event.target.value)} placeholder={mode==="create"?"At least 12 characters":"Your password"} type="password" autoComplete={mode==="create"?"new-password":"current-password"}/></label>
   {mode==="create"&&<label className="auth-field"><span>Confirm password</span><input value={confirmPassword} onChange={event=>setConfirmPassword(event.target.value)} placeholder="Repeat your password" type="password" autoComplete="new-password"/></label>}
   {error&&<div className="auth-error" role="alert">{error}</div>}
   <button className="dark full auth-submit" disabled={busy} onClick={submit}>{busy?"Please wait…":mode==="create"?"Create account":"Sign in"}</button>
   <button className="text full" disabled={busy} onClick={()=>{setMode(mode==="create"?"login":"create");setError("");setPassword("");setConfirmPassword("");}}>{mode==="create"?"Already have an account? Sign in":"New here? Create an account"}</button>
   <div className="auth-note"><strong>Secure account</strong><span>In deployed environments your password is sent over HTTPS and stored only as a one-way Argon2 hash. Sessions use an HttpOnly cookie.</span></div>
  </div>
 </main>;
}

function Walkthrough({account,onComplete}:{account:Account;onComplete:()=>void}){
 const [step,setStep]=useState(0);
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
  <div className="walkthrough-top"><div className="auth-brand">LIFE ADMIN<span>.</span></div><button className="text" disabled={busy} onClick={finish}>Skip walkthrough</button></div>
  <div className="walkthrough-card">
   <div className="walkthrough-progress">{walkthroughSteps.map((_,index)=><span key={index} className={index<=step?"done":""}/>)}</div>
   <div className="walkthrough-visual-wrap">{current.visual}</div>
   <div className="walkthrough-copy"><p className="eyebrow">{current.eyebrow}</p><h1>{current.title}</h1><p>{current.text}</p></div>
   <div className="walkthrough-actions">
    {step>0?<button className="light action" disabled={busy} onClick={()=>setStep(step-1)}>Back</button>:<span/>}
    {step<walkthroughSteps.length-1?<button className="dark action" disabled={busy} onClick={()=>setStep(step+1)}>Next</button>:<button className="dark action" disabled={busy} onClick={finish}>{busy?"Saving…":"Start using Life Admin"}</button>}
   </div>
  </div>
 </main>;
}

function reminderMeta(dueDate:string|null,context:string){
 if(!dueDate)return context;
 const due=new Date(dueDate+"T00:00:00");
 const today=new Date();
 const start=new Date(today.getFullYear(),today.getMonth(),today.getDate());
 const tomorrow=new Date(start);
 tomorrow.setDate(tomorrow.getDate()+1);
 if(due.getTime()===start.getTime())return "Due today";
 if(due.getTime()===tomorrow.getTime())return "Tomorrow";
 return "Due "+due.toLocaleDateString("en-US",{month:"short",day:"numeric"});
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

export default function App(){
 const [ready,setReady]=useState(false);
 const [account,setAccount]=useState<Account|null>(null);
 const [section,setSection]=useState<Section>("home");
 const [attention,setAttention]=useState<AttentionItem[]>(initialAttention);
 const [modal,setModal]=useState(false);
 const [selected,setSelected]=useState<AttentionItem|null>(null);
 const [things,setThings]=useState<ApiThing[]>([]);
 const [selectedThing,setSelectedThing]=useState<ApiThing|null>(null);
 const [thingModal,setThingModal]=useState(false);
 const [thingName,setThingName]=useState("");
 const [thingType,setThingType]=useState("Vehicle");
 const [thingDetail,setThingDetail]=useState("");
 const [accountSheet,setAccountSheet]=useState(false);
 const [q,setQ]=useState("");
 const [theme,setTheme]=useState<Theme>("light");
 const [quickText,setQuickText]=useState("");
 const [quickProposal,setQuickProposal]=useState<QuickProposal|null>(null);
 const attentionMutationVersion=useRef(0);
 const thingMutationVersion=useRef(0);
 const [showWalkthrough,setShowWalkthrough]=useState(false),[saving,setSaving]=useState(false),[appError,setAppError]=useState("");

 useEffect(()=>{
  const saved=window.localStorage.getItem("life-admin-theme") as Theme|null;
  const next=saved==="dark"||saved==="light"?saved:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");
  setTheme(next);
  document.documentElement.dataset.theme=next;
  getCurrentUser().then(({user})=>{
   const current=mapUser(user);
   setAccount(current);
   setShowWalkthrough(!current.onboardingComplete);
  }).catch(()=>{}).finally(()=>setReady(true));
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

 const toggleTheme=()=>{
  setTheme(current=>{
   const next=current==="dark"?"light":"dark";
   document.documentElement.dataset.theme=next;
   window.localStorage.setItem("life-admin-theme",next);
   return next;
  });
 };

 const openQuickAdd=(prefill="")=>{
  setModal(true);
  setQuickText(prefill);
  setQuickProposal(null);
 };

 const openThingModal=()=>{
  setThingName("");setThingType("Vehicle");setThingDetail("");setThingModal(true);
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
  setAccount(nextAccount);
  setAttention([]);
  setShowWalkthrough(!nextAccount.onboardingComplete);
  setSection("home");
 };

 const finishWalkthrough=()=>{
  setShowWalkthrough(false);
 };

 const signOut=async()=>{
  try{await logoutAccount();}catch{}
  setAccount(null);
  setAccountSheet(false);
  setSection("home");
  setAttention([]);
 };

 if(!ready)return <main className="auth-shell"><div className="auth-loading">Loading your workspace…</div></main>;
 if(!account)return <AccountGate onAuthenticated={authenticate}/>;
 if(showWalkthrough)return <Walkthrough account={account} onComplete={finishWalkthrough}/>;

 return <main className="shell">
  <aside className="sidebar">
   <div className="brand">LIFE ADMIN<span>.</span></div>
   <nav>{([["home","Home","⌂"],["things","Things","◫"],["payments","Payments","€"],["search","Search","⌕"]] as const).map(([k,l,i])=><button className={section===k?"nav active":"nav"} key={k} onClick={()=>setSection(k)}><b>{i}</b>{l}</button>)}</nav>
   <button className="dark add" onClick={()=>openQuickAdd()}>+ Add</button>
   <div className="bottom">
    <button className="nav" onClick={toggleTheme} aria-label={theme==="dark"?"Switch to light mode":"Switch to dark mode"} aria-pressed={theme==="dark"}><b>{theme==="dark"?"☀":"☾"}</b>{theme==="dark"?"Light mode":"Dark mode"}</button>
    <button className="nav" onClick={()=>setAccountSheet(true)}><b>●</b>Account</button>
    <button className="account" onClick={()=>setAccountSheet(true)}><span>{account.name.slice(0,1).toUpperCase()}</span><div><strong>{account.name}</strong><small>{account.email}</small></div></button>
   </div>
  </aside>

  <section className="content">
   <header>
    <div className="mobilebrand">LIFE ADMIN<span>.</span></div>
    <button className="searchbar" onClick={()=>setSection("search")}>⌕ <span>Search your life...</span><kbd>⌘ K</kbd></button>
    <button className="mobiletheme" onClick={toggleTheme} aria-label={theme==="dark"?"Switch to light mode":"Switch to dark mode"} aria-pressed={theme==="dark"}>{theme==="dark"?"☀":"☾"}</button>
    <button className="mobileaccount" onClick={()=>setAccountSheet(true)} aria-label="Open account">{account.name.slice(0,1).toUpperCase()}</button>
    <button className="mobileplus" onClick={()=>openQuickAdd()}>+</button>
   </header>

   <div className="page">{appError&&<div className="auth-error app-error" role="alert">{appError}<button className="text" onClick={()=>setAppError("")}>Dismiss</button></div>}
    {section==="home"&&<><div className="intro"><div><p className="eyebrow">Wednesday, 7 October</p><h1>Good afternoon, {account.name}</h1><p className="subtitle">{attention.length?attention.length+" things need your attention.":"You’re all caught up."}</p></div><button className="dark action" onClick={()=>openQuickAdd()}>+ Quick add</button></div>
     <section><div className="heading"><div><p className="eyebrow">Needs attention</p><h2>{attention.length?"Take care of these first":"Nothing urgent"}</h2></div>{attention.length>0&&<span className="count">{attention.length}</span>}</div><div className="list">{attention.map(x=><button className="row" key={x.id} onClick={()=>setSelected(x)}><i className={x.urgent?"dot urgent":"dot"}/><span><strong>{x.title}</strong><small>{x.meta}</small></span>{x.amount&&<b>{x.amount}</b>}<em>›</em></button>)}{!attention.length&&<div className="empty"><span>✓</span><div><strong>You’re all caught up.</strong><small>Nothing important needs attention right now.</small></div></div>}</div></section>
     <div className="grid2"><section className="panel"><div className="heading"><div><p className="eyebrow">Coming up</p><h2>Next on your radar</h2></div></div>{[["▱","TV warranty","24 days"],["↻","Car service","1,200 km"]].map(x=><div className="simple" key={x[1]}><span className="square">{x[0]}</span><div><strong>{x[1]}</strong><small>Tracked in Things</small></div><b>{x[2]}</b></div>)}</section><section className="panel"><div className="heading"><div><p className="eyebrow">Waiting</p><h2>Not in your hands</h2></div></div><div className="simple"><span className="square">□</span><div><strong>Amazon return</strong><small>Waiting for an update</small></div><b>Tomorrow</b></div></section></div>
    </>}

    {section==="things"&&<><div className="intro"><div><p className="eyebrow">Things</p><h1>Your real life, organized</h1><p className="subtitle">Keep reminders, documents and payments connected to what they belong to.</p></div><button className="dark action" onClick={openThingModal}>+ Add thing</button></div><div className="toolbar"><div className="input">⌕<input value={q} onChange={event=>setQ(event.target.value)} placeholder="Search things..."/></div><small>{things.filter(x=>(x.name+" "+x.type+" "+(x.detail||"")).toLowerCase().includes(q.toLowerCase())).length} things</small></div>{things.length?<div className="thinggrid">{things.filter(x=>(x.name+" "+x.type+" "+(x.detail||"")).toLowerCase().includes(q.toLowerCase())).map(x=><button className="thing" key={x.id} onClick={()=>setSelectedThing(x)}><span className="thingicon">{x.type==="Vehicle"?"🚗":x.type==="Home"?"⌂":x.type==="Device"?"◉":"▣"}</span><strong>{x.name}</strong><small>{x.detail||x.type}</small><em>{x.openReminderCount?x.openReminderCount+" attention": "No attention"}</em></button>)}</div>:<div className="empty"><span>+</span><div><strong>Nothing here yet.</strong><small>Add the things you own or manage. Their reminders will stay connected to them.</small></div></div>}</>}

    {section==="payments"&&<><div className="intro"><div><p className="eyebrow">Payments</p><h1>Know what leaves your account</h1><p className="subtitle">Recurring bills and subscriptions — without becoming a banking app.</p></div><button className="dark action" onClick={()=>openQuickAdd("Add a payment")}>+ Add payment</button></div><div className="stats">{[["Upcoming","€145","next 30 days"],["Recurring","€386","per month"],["Subscriptions","€47","per month"]].map(x=><div className="stat" key={x[0]}><small>{x[0]}</small><strong>{x[1]}</strong><span>{x[2]}</span></div>)}</div><section className="panel">{payments.map(x=><div className="pay" key={x[0]}><span className="square">€</span><div><strong>{x[0]}</strong><small>{x[2]}</small></div><b>{x[1]}</b><em className={x[3]==="Today"?"urgentpill":"pill"}>{x[3]}</em></div>)}</section></>}

    {section==="search"&&<><div className="intro"><div><p className="eyebrow">Search</p><h1>Find anything you saved</h1><p className="subtitle">Things and payments in one search.</p></div></div><div className="input big">⌕<input autoFocus value={q} onChange={event=>setQ(event.target.value)} placeholder="Try “car”, “insurance”, or “internet”..."/></div><div className="chips">{["Mazda","Insurance","Internet","Warranty"].map(x=><button key={x} onClick={()=>setQ(x)}>{x}</button>)}</div>{q&&<section className="panel">{things.filter(x=>(x.name+" "+x.type+" "+(x.detail||"")).toLowerCase().includes(q.toLowerCase())).map(x=><div className="result" key={x.id}><span>{x.type==="Vehicle"?"🚗":x.type==="Home"?"⌂":x.type==="Device"?"◉":"▣"}</span><div><strong>{x.name}</strong><small>{x.detail||x.type}</small></div><em>Thing</em></div>)}{payments.filter(x=>x[0].toLowerCase().includes(q.toLowerCase())).map(x=><div className="result" key={x[0]}><span>€</span><div><strong>{x[0]}</strong><small>{x[1]} · {x[2]}</small></div><em>Payment</em></div>)}</section>}</>}
   </div>
  </section>

  <div className="mobileNav">{([["home","Home","⌂"],["things","Things","◫"],["add","Add","+"],["payments","Payments","€"]] as const).map(([k,l,i])=><button key={k} className={k==="add"?"mobadd":section===k?"sel":""} onClick={()=>k==="add"?openQuickAdd():setSection(k)}><span>{i}</span><small>{l}</small></button>)}</div>

  {thingModal&&<div className="backdrop" onClick={()=>setThingModal(false)}><div className="sheet" onClick={event=>event.stopPropagation()}><div className="sheettop"><div><p className="eyebrow">Things</p><h2>Add a thing</h2></div><button className="close" onClick={()=>setThingModal(false)}>×</button></div><label className="auth-field"><span>Name</span><input autoFocus value={thingName} onChange={event=>setThingName(event.target.value)} placeholder="e.g. Mazda 6"/></label><label className="auth-field"><span>Type</span><select value={thingType} onChange={event=>setThingType(event.target.value)}><option>Vehicle</option><option>Home</option><option>Device</option><option>Pet</option><option>Other</option></select></label><label className="auth-field"><span>Detail</span><input value={thingDetail} onChange={event=>setThingDetail(event.target.value)} placeholder="e.g. 235,420 km"/></label><button className="dark full" disabled={saving} onClick={()=>void saveThing()}>{saving?"Saving…":"Save thing"}</button><button className="text full" onClick={()=>setThingModal(false)}>Cancel</button></div></div>}

  {accountSheet&&<div className="backdrop" onClick={()=>setAccountSheet(false)}><div className="sheet account-sheet" onClick={event=>event.stopPropagation()}><div className="account-profile"><span>{account.name.slice(0,1).toUpperCase()}</span><div><p className="eyebrow">Your account</p><h2>{account.name}</h2><p className="modalcopy">{account.email}</p></div></div><div className="account-details"><div><small>Workspace</small><strong>Personal</strong><span>Your own Life Admin data</span></div><div><small>Storage</small><strong>Account-backed</strong><span>Your account owns your reminders</span></div></div><button className="light full" onClick={()=>{setAccountSheet(false);setShowWalkthrough(true)}}>Replay walkthrough</button><button className="text full" onClick={()=>{void signOut();}}>Sign out</button></div></div>}

  {selectedThing&&<div className="backdrop" onClick={()=>setSelectedThing(null)}><div className="sheet" onClick={event=>event.stopPropagation()}><div className="sheettop"><div><p className="eyebrow">Thing</p><h2>{selectedThing.name}</h2><p className="modalcopy">{selectedThing.detail||selectedThing.type}</p></div><button className="close" onClick={()=>setSelectedThing(null)}>×</button></div><div className="contextgrid"><div><small>Needs attention</small><strong>{selectedThing.openReminderCount?selectedThing.openReminderCount+" reminder"+(selectedThing.openReminderCount===1?"":"s"):"Nothing right now"}</strong><span>Connected to this Thing</span></div><div><small>Documents</small><strong>Coming next</strong><span>Receipts and warranties</span></div><div><small>History</small><strong>Coming next</strong><span>Service and changes</span></div><div><small>Payment</small><strong>Coming next</strong><span>Recurring costs</span></div></div><button className="light full" onClick={()=>{const id=selectedThing.id;setSelectedThing(null);openQuickAdd("Car insurance expires December 14");}}>+ Add something to {selectedThing.name}</button><button className="text full" onClick={()=>setSelectedThing(null)}>Close</button></div></div>}

  {selected&&<div className="backdrop" onClick={()=>setSelected(null)}><div className="sheet" onClick={event=>event.stopPropagation()}><div className="sheeticon">!</div><p className="eyebrow">Needs attention</p><h2>{selected.title}</h2><p className="modalcopy">{selected.meta}{selected.amount?" · "+selected.amount:""}</p><button className="dark full" onClick={async()=>{try{await completeReminder(selected.id);attentionMutationVersion.current+=1;
     setAttention(items=>items.filter(item=>item.id!==selected.id));setSelected(null);}catch(caught){setAppError(caught instanceof Error?caught.message:"Could not complete reminder.")}}}>Done</button><button className="light full" onClick={async()=>{const tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);const dueDate=tomorrow.toISOString().slice(0,10);try{const updated=await snoozeReminder(selected.id,dueDate);attentionMutationVersion.current+=1;
     setAttention(items=>items.map(item=>item.id===selected.id?reminderAttention(updated):item));setSelected(null);}catch(caught){setAppError(caught instanceof Error?caught.message:"Could not snooze reminder.")}}}>Snooze until tomorrow</button><button className="text full" onClick={()=>setSelected(null)}>Close</button></div></div>}

  {modal&&<div className="backdrop" onClick={()=>setModal(false)}><div className="sheet" onClick={event=>event.stopPropagation()}><div className="sheettop"><div><p className="eyebrow">Quick add</p><h2>What do you want to remember?</h2></div><button className="close" onClick={()=>setModal(false)}>×</button></div><textarea autoFocus value={quickText} onChange={event=>{setQuickText(event.target.value);setQuickProposal(null)}} placeholder="e.g. Car insurance expires June 14"/><div className="aihint"><b>✦</b><div><strong>{quickProposal?"Review before saving":"We’ll organize it for you."}</strong><small>{quickProposal?"Nothing is saved until you confirm.":"We’ll identify the type, context and date, then ask you to confirm."}</small></div></div>{quickProposal?<div className="proposal"><div><small>Type</small><strong>{quickProposal.type}</strong></div><div><small>Context</small><strong>{quickProposal.context}</strong></div><div><small>When</small><strong>{quickProposal.due}</strong></div><div className="proposaltitle"><small>Save as</small><strong>{quickProposal.title}</strong></div></div>:<div className="quickgrid">{["Reminder","Thing","Payment","Document"].map(x=><button key={x} onClick={()=>setQuickText(x==="Reminder"?"":"Add a "+x.toLowerCase())}><strong>{x}</strong><small>Capture it quickly</small></button>)}</div>}<button className="dark full" disabled={saving||(!quickText.trim()&&!quickProposal)} onClick={async()=>{
 if(!quickProposal){
  setQuickProposal(buildQuickProposal(quickText));
  return;
 }
 setSaving(true);
 setAppError("");
 try{
  if(quickProposal.type==="Reminder"){
   const linkedThing=things.find(item=>item.name.toLowerCase()===quickProposal.context.toLowerCase());
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
    type:"Thing",
    detail:null
   });
   thingMutationVersion.current+=1;
   setThings(items=>[created,...items]);
  }else{
   attentionMutationVersion.current+=1;
   setAttention(items=>[{
    id:crypto.randomUUID(),
    title:quickProposal.title,
    meta:quickProposal.type+" · "+quickProposal.due,
    amount:"",
    urgent:false,
    context:quickProposal.context,
    dueDate:null
   },...items]);
  }
  setModal(false);
  setQuickText("");
  setQuickProposal(null);
 }catch(caught){
  setAppError(caught instanceof Error?caught.message:"Could not save this item.");
 }finally{
  setSaving(false);
 }
}}>{quickProposal?(saving?"Saving…":"Save to Life Admin"):"Review details"}</button></div></div>}
 </main>;
}
