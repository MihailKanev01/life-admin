"use client";
import {useEffect, useState} from "react";

type Section="home"|"things"|"payments"|"search";
type Theme="light"|"dark";
type AuthMode="create"|"login";

type Account={id:string;name:string;email:string;createdAt:string};
type AttentionItem={id:string;title:string;meta:string;amount:string;urgent:boolean};
type QuickProposal={type:"Reminder"|"Thing"|"Payment"|"Document";title:string;context:string;due:string};
type Workspace={attention:AttentionItem[];onboardingComplete:boolean};

const ACTIVE_ACCOUNT_KEY="life-admin-active-account";
const ACCOUNTS_KEY="life-admin-accounts";
const WORKSPACE_PREFIX="life-admin-workspace:";

const initialAttention:AttentionItem[]=[
 {id:"internet-payment",title:"Internet payment",meta:"Due today",amount:"€25",urgent:true},
 {id:"car-insurance",title:"Car insurance",meta:"Due in 5 days",amount:"",urgent:false},
];

const things=[
 ["🚗","Mazda 6","235,420 km","1 attention"],
 ["⌂","Home","Apartment","2 upcoming"],
 ["◉","iPhone 16 Pro","Personal","Warranty 2027"],
 ["▣","PC","Desktop","No attention"],
] as const;

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

function workspaceKey(accountId:string){return WORKSPACE_PREFIX+accountId;}

function getAccounts():Account[]{
 try{
  const raw=window.localStorage.getItem(ACCOUNTS_KEY);
  if(!raw)return [];
  const parsed=JSON.parse(raw);
  return Array.isArray(parsed)?parsed:[];
 }catch{return [];}
}

function readWorkspace(accountId:string):Workspace{
 try{
  const raw=window.localStorage.getItem(workspaceKey(accountId));
  if(!raw)return {attention:[...initialAttention],onboardingComplete:false};
  const parsed=JSON.parse(raw);
  return {
   attention:Array.isArray(parsed.attention)?parsed.attention:[...initialAttention],
   onboardingComplete:Boolean(parsed.onboardingComplete),
  };
 }catch{return {attention:[...initialAttention],onboardingComplete:false};}
}

function saveWorkspace(account:Account,workspace:Workspace){
 window.localStorage.setItem(workspaceKey(account.id),JSON.stringify(workspace));
}

function buildQuickProposal(text:string):QuickProposal{
 const normalized=text.trim();
 const lower=normalized.toLowerCase();
 const dateMatch=normalized.match(/(?:january|february|march|april|may|june|july|august|september|october|november|december)s+d{1,2}/i);
 const due=dateMatch?dateMatch[0]:"Choose a date";
 if(lower.includes("insurance")||lower.includes("car insurance"))return {type:"Reminder",title:"Car insurance",context:"Mazda 6",due};
 if(lower.includes("add a thing"))return {type:"Thing",title:"New thing",context:"Personal",due};
 if(lower.includes("add a payment"))return {type:"Payment",title:"New payment",context:"Recurring payment",due};
 if(lower.includes("add a document"))return {type:"Document",title:"New document",context:"Personal",due};
 if(lower.includes("spotify")||lower.includes("netflix")||lower.includes("subscription"))return {type:"Payment",title:normalized||"Subscription",context:"Recurring payment",due};
 if(lower.includes("warranty"))return {type:"Document",title:"TV warranty",context:"TV",due};
 if(lower.includes("car")||lower.includes("service")||lower.includes("maintenance"))return {type:"Reminder",title:"Car service",context:"Mazda 6",due};
 return {type:"Reminder",title:normalized||"New reminder",context:"Personal",due};
}

function AccountGate({onAuthenticated}:{onAuthenticated:(account:Account,workspace:Workspace)=>void}){
 const [mode,setMode]=useState<AuthMode>("create");
 const [name,setName]=useState("");
 const [email,setEmail]=useState("");
 const [error,setError]=useState("");

 const submit=()=>{
  setError("");
  const normalizedEmail=email.trim().toLowerCase();
  if(mode==="create"){
   if(name.trim().length<2){setError("Enter your name.");return;}
   if(!/^\S+@\S+\.\S+$/.test(normalizedEmail)){setError("Enter a valid email address.");return;}
   const accounts=getAccounts();
   if(accounts.some(account=>account.email===normalizedEmail)){setError("An account with this email already exists on this browser. Sign in instead.");return;}
   const account:Account={id:crypto.randomUUID(),name:name.trim(),email:normalizedEmail,createdAt:new Date().toISOString()};
   accounts.push(account);
   window.localStorage.setItem(ACCOUNTS_KEY,JSON.stringify(accounts));
   window.localStorage.setItem(ACTIVE_ACCOUNT_KEY,JSON.stringify(account));
   const workspace:Workspace={attention:[...initialAttention],onboardingComplete:false};
   saveWorkspace(account,workspace);
   onAuthenticated(account,workspace);
   return;
  }

  const account=getAccounts().find(item=>item.email===normalizedEmail);
  if(!account){setError("No account with that email was found on this browser. Create an account first.");return;}
  window.localStorage.setItem(ACTIVE_ACCOUNT_KEY,JSON.stringify(account));
  onAuthenticated(account,readWorkspace(account.id));
 };

 return <main className="auth-shell">
  <div className="auth-card">
   <div className="auth-brand">LIFE ADMIN<span>.</span></div>
   <div className="auth-copy">
    <p className="eyebrow">{mode==="create"?"Your personal workspace":"Welcome back"}</p>
    <h1>{mode==="create"?"Create your account":"Sign in to Life Admin"}</h1>
    <p>{mode==="create"?"Your information will belong to your own Life Admin workspace.":"Continue to the Life Admin workspace you created on this browser."}</p>
   </div>
   {mode==="create"&&<label className="auth-field"><span>Your name</span><input value={name} onChange={event=>setName(event.target.value)} placeholder="e.g. Mihail Kanev" autoComplete="name"/></label>}
   <label className="auth-field"><span>Email address</span><input value={email} onChange={event=>setEmail(event.target.value)} placeholder="you@example.com" type="email" autoComplete="email"/></label>
   {error&&<div className="auth-error" role="alert">{error}</div>}
   <button className="dark full auth-submit" onClick={submit}>{mode==="create"?"Create account":"Sign in"}</button>
   <button className="text full" onClick={()=>{setMode(mode==="create"?"login":"create");setError("");}}>{mode==="create"?"Already have an account? Sign in":"New here? Create an account"}</button>
   <div className="auth-note"><strong>Prototype account</strong><span>Demo identity and workspace data are stored in this browser. Production authentication will use secure server sessions and sync across devices.</span></div>
  </div>
 </main>;
}

function Walkthrough({account,onComplete}:{account:Account;onComplete:()=>void}){
 const [step,setStep]=useState(0);
 const current=walkthroughSteps[step];

 const finish=()=>{
  const workspace=readWorkspace(account.id);
  saveWorkspace(account,{...workspace,onboardingComplete:true});
  onComplete();
 };

 return <main className="walkthrough-shell">
  <div className="walkthrough-top"><div className="auth-brand">LIFE ADMIN<span>.</span></div><button className="text" onClick={finish}>Skip walkthrough</button></div>
  <div className="walkthrough-card">
   <div className="walkthrough-progress">{walkthroughSteps.map((_,index)=><span key={index} className={index<=step?"done":""}/>)}</div>
   <div className="walkthrough-visual-wrap">{current.visual}</div>
   <div className="walkthrough-copy"><p className="eyebrow">{current.eyebrow}</p><h1>{current.title}</h1><p>{current.text}</p></div>
   <div className="walkthrough-actions">
    {step>0?<button className="light action" onClick={()=>setStep(step-1)}>Back</button>:<span/>}
    {step<walkthroughSteps.length-1?<button className="dark action" onClick={()=>setStep(step+1)}>Next</button>:<button className="dark action" onClick={finish}>Start using Life Admin</button>}
   </div>
  </div>
 </main>;
}

export default function App(){
 const [ready,setReady]=useState(false);
 const [account,setAccount]=useState<Account|null>(null);
 const [section,setSection]=useState<Section>("home");
 const [attention,setAttention]=useState<AttentionItem[]>(initialAttention);
 const [modal,setModal]=useState(false);
 const [selected,setSelected]=useState<AttentionItem|null>(null);
 const [selectedThing,setSelectedThing]=useState(false);
 const [accountSheet,setAccountSheet]=useState(false);
 const [q,setQ]=useState("");
 const [theme,setTheme]=useState<Theme>("light");
 const [quickText,setQuickText]=useState("");
 const [quickProposal,setQuickProposal]=useState<QuickProposal|null>(null);
 const [showWalkthrough,setShowWalkthrough]=useState(false);

 useEffect(()=>{
  const saved=window.localStorage.getItem("life-admin-theme") as Theme|null;
  const next=saved==="dark"||saved==="light"?saved:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");
  setTheme(next);
  document.documentElement.dataset.theme=next;
  try{
   const active=window.localStorage.getItem(ACTIVE_ACCOUNT_KEY);
   if(active){
    const parsed=JSON.parse(active) as Account;
    const workspace=readWorkspace(parsed.id);
    setAccount(parsed);
    setAttention(workspace.attention);
    setShowWalkthrough(!workspace.onboardingComplete);
   }
  }catch{}
  setReady(true);
 },[]);

 useEffect(()=>{
  if(!ready||!account||showWalkthrough)return;
  saveWorkspace(account,{attention,onboardingComplete:true});
 },[attention,account,ready,showWalkthrough]);

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

 const authenticate=(nextAccount:Account,workspace:Workspace)=>{
  setAccount(nextAccount);
  setAttention(workspace.attention);
  setShowWalkthrough(!workspace.onboardingComplete);
  setSection("home");
 };

 const finishWalkthrough=()=>{
  if(!account)return;
  const workspace=readWorkspace(account.id);
  saveWorkspace(account,{...workspace,onboardingComplete:true});
  setShowWalkthrough(false);
 };

 const signOut=()=>{
  window.localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
  setAccount(null);
  setAccountSheet(false);
  setSection("home");
  setAttention([...initialAttention]);
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

   <div className="page">
    {section==="home"&&<><div className="intro"><div><p className="eyebrow">Wednesday, 7 October</p><h1>Good afternoon, {account.name}</h1><p className="subtitle">{attention.length?attention.length+" things need your attention.":"You’re all caught up."}</p></div><button className="dark action" onClick={()=>openQuickAdd()}>+ Quick add</button></div>
     <section><div className="heading"><div><p className="eyebrow">Needs attention</p><h2>{attention.length?"Take care of these first":"Nothing urgent"}</h2></div>{attention.length>0&&<span className="count">{attention.length}</span>}</div><div className="list">{attention.map(x=><button className="row" key={x.id} onClick={()=>setSelected(x)}><i className={x.urgent?"dot urgent":"dot"}/><span><strong>{x.title}</strong><small>{x.meta}</small></span>{x.amount&&<b>{x.amount}</b>}<em>›</em></button>)}{!attention.length&&<div className="empty"><span>✓</span><div><strong>You’re all caught up.</strong><small>Nothing important needs attention right now.</small></div></div>}</div></section>
     <div className="grid2"><section className="panel"><div className="heading"><div><p className="eyebrow">Coming up</p><h2>Next on your radar</h2></div></div>{[["▱","TV warranty","24 days"],["↻","Car service","1,200 km"]].map(x=><div className="simple" key={x[1]}><span className="square">{x[0]}</span><div><strong>{x[1]}</strong><small>Tracked in Things</small></div><b>{x[2]}</b></div>)}</section><section className="panel"><div className="heading"><div><p className="eyebrow">Waiting</p><h2>Not in your hands</h2></div></div><div className="simple"><span className="square">□</span><div><strong>Amazon return</strong><small>Waiting for an update</small></div><b>Tomorrow</b></div></section></div>
    </>}

    {section==="things"&&<><div className="intro"><div><p className="eyebrow">Things</p><h1>Your real life, organized</h1><p className="subtitle">Keep reminders, documents and payments connected to what they belong to.</p></div><button className="dark action" onClick={()=>openQuickAdd("Add a thing")}>+ Add thing</button></div><div className="toolbar"><div className="input">⌕<input value={q} onChange={event=>setQ(event.target.value)} placeholder="Search things..."/></div><small>{things.filter(x=>(x[1]+" "+x[2]).toLowerCase().includes(q.toLowerCase())).length} things</small></div><div className="thinggrid">{things.filter(x=>(x[1]+" "+x[2]).toLowerCase().includes(q.toLowerCase())).map(x=><button className="thing" key={x[1]} onClick={()=>x[1]==="Mazda 6"&&setSelectedThing(true)}><span className="thingicon">{x[0]}</span><strong>{x[1]}</strong><small>{x[2]}</small><em>{x[3]}</em></button>)}</div></>}

    {section==="payments"&&<><div className="intro"><div><p className="eyebrow">Payments</p><h1>Know what leaves your account</h1><p className="subtitle">Recurring bills and subscriptions — without becoming a banking app.</p></div><button className="dark action" onClick={()=>openQuickAdd("Add a payment")}>+ Add payment</button></div><div className="stats">{[["Upcoming","€145","next 30 days"],["Recurring","€386","per month"],["Subscriptions","€47","per month"]].map(x=><div className="stat" key={x[0]}><small>{x[0]}</small><strong>{x[1]}</strong><span>{x[2]}</span></div>)}</div><section className="panel">{payments.map(x=><div className="pay" key={x[0]}><span className="square">€</span><div><strong>{x[0]}</strong><small>{x[2]}</small></div><b>{x[1]}</b><em className={x[3]==="Today"?"urgentpill":"pill"}>{x[3]}</em></div>)}</section></>}

    {section==="search"&&<><div className="intro"><div><p className="eyebrow">Search</p><h1>Find anything you saved</h1><p className="subtitle">Things and payments in one search.</p></div></div><div className="input big">⌕<input autoFocus value={q} onChange={event=>setQ(event.target.value)} placeholder="Try “car”, “insurance”, or “internet”..."/></div><div className="chips">{["Mazda","Insurance","Internet","Warranty"].map(x=><button key={x} onClick={()=>setQ(x)}>{x}</button>)}</div>{q&&<section className="panel">{things.filter(x=>(x[1]+" "+x[2]).toLowerCase().includes(q.toLowerCase())).map(x=><div className="result" key={x[1]}><span>{x[0]}</span><div><strong>{x[1]}</strong><small>{x[2]}</small></div><em>Thing</em></div>)}{payments.filter(x=>x[0].toLowerCase().includes(q.toLowerCase())).map(x=><div className="result" key={x[0]}><span>€</span><div><strong>{x[0]}</strong><small>{x[1]} · {x[2]}</small></div><em>Payment</em></div>)}</section>}</>}
   </div>
  </section>

  <div className="mobileNav">{([["home","Home","⌂"],["things","Things","◫"],["add","Add","+"],["payments","Payments","€"]] as const).map(([k,l,i])=><button key={k} className={k==="add"?"mobadd":section===k?"sel":""} onClick={()=>k==="add"?openQuickAdd():setSection(k)}><span>{i}</span><small>{l}</small></button>)}</div>

  {accountSheet&&<div className="backdrop" onClick={()=>setAccountSheet(false)}><div className="sheet account-sheet" onClick={event=>event.stopPropagation()}><div className="account-profile"><span>{account.name.slice(0,1).toUpperCase()}</span><div><p className="eyebrow">Your account</p><h2>{account.name}</h2><p className="modalcopy">{account.email}</p></div></div><div className="account-details"><div><small>Workspace</small><strong>Personal</strong><span>Your own Life Admin data</span></div><div><small>Storage</small><strong>Prototype</strong><span>Saved in this browser</span></div></div><button className="light full" onClick={()=>{setAccountSheet(false);setShowWalkthrough(true)}}>Replay walkthrough</button><button className="text full" onClick={signOut}>Sign out</button></div></div>}

  {selectedThing&&<div className="backdrop" onClick={()=>setSelectedThing(false)}><div className="sheet" onClick={event=>event.stopPropagation()}><div className="sheettop"><div><p className="eyebrow">Thing</p><h2>Mazda 6</h2><p className="modalcopy">235,420 km · Vehicle</p></div><button className="close" onClick={()=>setSelectedThing(false)}>×</button></div><div className="contextgrid"><div><small>Needs attention</small><strong>Car insurance</strong><span>Due in 5 days</span></div><div><small>Documents</small><strong>Insurance policy</strong><span>1 document</span></div><div><small>History</small><strong>Car service</strong><span>1,200 km</span></div><div><small>Payment</small><strong>Car insurance</strong><span>€120 · yearly</span></div></div><button className="light full" onClick={()=>{setSelectedThing(false);openQuickAdd("Car insurance expires December 14")}}>+ Add something to Mazda 6</button><button className="text full" onClick={()=>setSelectedThing(false)}>Close</button></div></div>}

  {selected&&<div className="backdrop" onClick={()=>setSelected(null)}><div className="sheet" onClick={event=>event.stopPropagation()}><div className="sheeticon">!</div><p className="eyebrow">Needs attention</p><h2>{selected.title}</h2><p className="modalcopy">{selected.meta}{selected.amount?" · "+selected.amount:""}</p><button className="dark full" onClick={()=>{setAttention(items=>items.filter(item=>item.id!==selected.id));setSelected(null)}}>Done</button><button className="light full" onClick={()=>{setAttention(items=>items.map(item=>item.id===selected.id?{...item,meta:"Tomorrow"}:item));setSelected(null)}}>Snooze until tomorrow</button><button className="text full" onClick={()=>setSelected(null)}>Close</button></div></div>}

  {modal&&<div className="backdrop" onClick={()=>setModal(false)}><div className="sheet" onClick={event=>event.stopPropagation()}><div className="sheettop"><div><p className="eyebrow">Quick add</p><h2>What do you want to remember?</h2></div><button className="close" onClick={()=>setModal(false)}>×</button></div><textarea autoFocus value={quickText} onChange={event=>{setQuickText(event.target.value);setQuickProposal(null)}} placeholder="e.g. Car insurance expires June 14"/><div className="aihint"><b>✦</b><div><strong>{quickProposal?"Review before saving":"We’ll organize it for you."}</strong><small>{quickProposal?"Nothing is saved until you confirm.":"We’ll identify the type, context and date, then ask you to confirm."}</small></div></div>{quickProposal?<div className="proposal"><div><small>Type</small><strong>{quickProposal.type}</strong></div><div><small>Context</small><strong>{quickProposal.context}</strong></div><div><small>When</small><strong>{quickProposal.due}</strong></div><div className="proposaltitle"><small>Save as</small><strong>{quickProposal.title}</strong></div></div>:<div className="quickgrid">{["Reminder","Thing","Payment","Document"].map(x=><button key={x} onClick={()=>setQuickText(x==="Reminder"?"":"Add a "+x.toLowerCase())}><strong>{x}</strong><small>Capture it quickly</small></button>)}</div>}<button className="dark full" disabled={!quickText.trim()&&!quickProposal} onClick={()=>{if(!quickProposal){setQuickProposal(buildQuickProposal(quickText));return;}setAttention(items=>[{id:crypto.randomUUID(),title:quickProposal.title,meta:quickProposal.type+" · "+quickProposal.due,amount:"",urgent:false},...items]);setModal(false);setQuickText("");setQuickProposal(null)}}>{quickProposal?"Save to Life Admin":"Review details"}</button></div></div>}
 </main>;
}
