"use client";
import {useEffect, useState} from "react";

type Section="home"|"things"|"payments"|"search";
type Theme="light"|"dark";

type QuickProposal={type:"Reminder"|"Thing"|"Payment"|"Document";title:string;context:string;due:string};

function buildQuickProposal(text:string):QuickProposal{
 const normalized=text.trim();
 const lower=normalized.toLowerCase();
 const dateMatch=normalized.match(/\\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\\s+\\d{1,2}\\b/i);
 const due=dateMatch?dateMatch[0]:"Choose a date";
 if(lower.includes("insurance")||lower.includes("car insurance")) return {type:"Reminder",title:"Car insurance",context:"Mazda 6",due};
 if(lower.includes("spotify")||lower.includes("netflix")||lower.includes("subscription")) return {type:"Payment",title:normalized||"Subscription",context:"Recurring payment",due};
 if(lower.includes("warranty")) return {type:"Document",title:"TV warranty",context:"TV",due};
 if(lower.includes("car")||lower.includes("service")||lower.includes("maintenance")) return {type:"Reminder",title:"Car service",context:"Mazda 6",due};
 return {type:"Reminder",title:normalized||"New reminder",context:"Personal",due};
}
const initial=[{id:1,title:"Internet payment",meta:"Due today",amount:"€25",urgent:true},{id:2,title:"Car insurance",meta:"Due in 5 days",amount:"",urgent:false}];
const things=[["🚗","Mazda 6","235,420 km","1 attention"],["⌂","Home","Apartment","2 upcoming"],["◉","iPhone 16 Pro","Personal","Warranty 2027"],["▣","PC","Desktop","No attention"]];
const payments=[["Internet","€25","Every month · 15th","Today"],["Spotify","€8","Every month · 3rd","27 days"],["Car insurance","€120","Yearly","5 days"]];

export default function App(){
 const [section,setSection]=useState<Section>("home"),[attention,setAttention]=useState(initial),[modal,setModal]=useState(false),[selected,setSelected]=useState<typeof initial[number]|null>(null),[q,setQ]=useState(""),[theme,setTheme]=useState<Theme>("light"),[quickText,setQuickText]=useState(""),[quickProposal,setQuickProposal]=useState<QuickProposal|null>(null);

 useEffect(()=>{
  const saved=window.localStorage.getItem("life-admin-theme") as Theme|null;
  const next=saved==="dark"||saved==="light"?saved:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");
  setTheme(next);
  document.documentElement.dataset.theme=next;
 },[]);

 const toggleTheme=()=>{
  setTheme(current=>{
   const next=current==="dark"?"light":"dark";
   document.documentElement.dataset.theme=next;
   window.localStorage.setItem("life-admin-theme",next);
   return next;
  });
 };
 return <main className="shell">
  <aside className="sidebar"><div className="brand">LIFE ADMIN<span>.</span></div><nav>{([["home","Home","⌂"],["things","Things","◫"],["payments","Payments","€"],["search","Search","⌕"]] as const).map(([k,l,i])=><button className={section===k?"nav active":"nav"} key={k} onClick={()=>setSection(k)}><b>{i}</b>{l}</button>)}</nav><button className="dark add" onClick={()=>{setModal(true);setQuickText("");setQuickProposal(null)}}>+ Add</button><div className="bottom"><button className="nav" onClick={toggleTheme} aria-label={theme==="dark"?"Switch to light mode":"Switch to dark mode"} aria-pressed={theme==="dark"}><b>{theme==="dark"?"☀":"☾"}</b>{theme==="dark"?"Light mode":"Dark mode"}</button><button className="nav">⚙ Settings</button><div className="account"><span>M</span><div><strong>Mihail</strong><small>Personal</small></div></div></div></aside>
  <section className="content"><header><div className="mobilebrand">LIFE ADMIN<span>.</span></div><button className="searchbar" onClick={()=>setSection("search")}>⌕ <span>Search your life...</span><kbd>⌘ K</kbd></button><button className="mobiletheme" onClick={toggleTheme} aria-label={theme==="dark"?"Switch to light mode":"Switch to dark mode"} aria-pressed={theme==="dark"}>{theme==="dark"?"☀":"☾"}</button><button className="mobileplus" onClick={()=>setModal(true)}>+</button></header>
   <div className="page">
    {section==="home"&&<><div className="intro"><div><p className="eyebrow">Wednesday, 7 October</p><h1>Good afternoon, Mihail</h1><p className="subtitle">{attention.length?attention.length+" things need your attention.":"You’re all caught up."}</p></div><button className="dark action" onClick={()=>setModal(true)}>+ Quick add</button></div>
     <section><div className="heading"><div><p className="eyebrow">Needs attention</p><h2>{attention.length?"Take care of these first":"Nothing urgent"}</h2></div>{attention.length>0&&<span className="count">{attention.length}</span>}</div><div className="list">{attention.map(x=><button className="row" key={x.id} onClick={()=>setSelected(x)}><i className={x.urgent?"dot urgent":"dot"}/><span><strong>{x.title}</strong><small>{x.meta}</small></span>{x.amount&&<b>{x.amount}</b>}<em>›</em></button>)}{!attention.length&&<div className="empty"><span>✓</span><div><strong>You’re all caught up.</strong><small>Nothing important needs attention right now.</small></div></div>}</div></section>
     <div className="grid2"><section className="panel"><div className="heading"><div><p className="eyebrow">Coming up</p><h2>Next on your radar</h2></div></div>{[["▱","TV warranty","24 days"],["↻","Car service","1,200 km"]].map(x=><div className="simple" key={x[1]}><span className="square">{x[0]}</span><div><strong>{x[1]}</strong><small>Tracked in Things</small></div><b>{x[2]}</b></div>)}</section><section className="panel"><div className="heading"><div><p className="eyebrow">Waiting</p><h2>Not in your hands</h2></div></div><div className="simple"><span className="square">□</span><div><strong>Amazon return</strong><small>Waiting for an update</small></div><b>Tomorrow</b></div></section></div>
    </>}
    {section==="things"&&<><div className="intro"><div><p className="eyebrow">Things</p><h1>Your real life, organized</h1><p className="subtitle">Keep reminders, documents and payments connected to what they belong to.</p></div><button className="dark action" onClick={()=>setModal(true)}>+ Add thing</button></div><div className="toolbar"><div className="input">⌕<input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search things..."/></div><small>{things.filter(x=>(x[1]+" "+x[2]).toLowerCase().includes(q.toLowerCase())).length} things</small></div><div className="thinggrid">{things.filter(x=>(x[1]+" "+x[2]).toLowerCase().includes(q.toLowerCase())).map(x=><button className="thing" key={x[1]}><span className="thingicon">{x[0]}</span><strong>{x[1]}</strong><small>{x[2]}</small><em>{x[3]}</em></button>)}</div></>}
    {section==="payments"&&<><div className="intro"><div><p className="eyebrow">Payments</p><h1>Know what leaves your account</h1><p className="subtitle">Recurring bills and subscriptions — without becoming a banking app.</p></div><button className="dark action" onClick={()=>setModal(true)}>+ Add payment</button></div><div className="stats">{[["Upcoming","€145","next 30 days"],["Recurring","€386","per month"],["Subscriptions","€47","per month"]].map(x=><div className="stat" key={x[0]}><small>{x[0]}</small><strong>{x[1]}</strong><span>{x[2]}</span></div>)}</div><section className="panel">{payments.map(x=><div className="pay" key={x[0]}><span className="square">€</span><div><strong>{x[0]}</strong><small>{x[2]}</small></div><b>{x[1]}</b><em className={x[3]==="Today"?"urgentpill":"pill"}>{x[3]}</em></div>)}</section></>}
    {section==="search"&&<><div className="intro"><div><p className="eyebrow">Search</p><h1>Find anything you saved</h1><p className="subtitle">Things and payments in one search.</p></div></div><div className="input big">⌕<input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Try “car”, “insurance”, or “internet”..."/></div><div className="chips">{["Mazda","Insurance","Internet","Warranty"].map(x=><button key={x} onClick={()=>setQ(x)}>{x}</button>)}</div>{q&&<section className="panel">{things.filter(x=>(x[1]+" "+x[2]).toLowerCase().includes(q.toLowerCase())).map(x=><div className="result" key={x[1]}><span>{x[0]}</span><div><strong>{x[1]}</strong><small>{x[2]}</small></div><em>Thing</em></div>)}{payments.filter(x=>x[0].toLowerCase().includes(q.toLowerCase())).map(x=><div className="result" key={x[0]}><span>€</span><div><strong>{x[0]}</strong><small>{x[1]} · {x[2]}</small></div><em>Payment</em></div>)}</section>}</>}
   </div></section>
  <div className="mobileNav">{([["home","Home","⌂"],["things","Things","◫"],["add","Add","+"],["payments","Payments","€"]] as const).map(([k,l,i])=><button key={k} className={k==="add"?"mobadd":section===k?"sel":""} onClick={()=>k==="add"?setModal(true):setSection(k)}><span>{i}</span><small>{l}</small></button>)}</div>
  {selected&&<div className="backdrop" onClick={()=>setSelected(null)}><div className="sheet" onClick={e=>e.stopPropagation()}><div className="sheeticon">!</div><p className="eyebrow">Needs attention</p><h2>{selected.title}</h2><p className="modalcopy">{selected.meta}{selected.amount?" · "+selected.amount:""}</p><button className="dark full" onClick={()=>{setAttention(x=>x.filter(a=>a.id!==selected.id));setSelected(null)}}>Done</button><button className="light full" onClick={()=>{setAttention(x=>x.map(a=>a.id===selected.id?{...a,meta:"Tomorrow"}:a));setSelected(null)}}>Snooze until tomorrow</button><button className="text full" onClick={()=>setSelected(null)}>Close</button></div></div>}
  {modal&&<div className="backdrop" onClick={()=>setModal(false)}><div className="sheet" onClick={e=>e.stopPropagation()}><div className="sheettop"><div><p className="eyebrow">Quick add</p><h2>What do you want to remember?</h2></div><button className="close" onClick={()=>setModal(false)}>×</button></div><textarea autoFocus value={quickText} onChange={e=>{setQuickText(e.target.value);setQuickProposal(null)}} placeholder="e.g. Car insurance expires June 14"/><div className="aihint"><b>✦</b><div><strong>{quickProposal?"Review before saving":"We’ll organize it for you."}</strong><small>{quickProposal?"Nothing is saved until you confirm.":"We’ll identify the type, context and date, then ask you to confirm."}</small></div></div>{quickProposal?<div className="proposal"><div><small>Type</small><strong>{quickProposal.type}</strong></div><div><small>Context</small><strong>{quickProposal.context}</strong></div><div><small>When</small><strong>{quickProposal.due}</strong></div><div className="proposaltitle"><small>Save as</small><strong>{quickProposal.title}</strong></div></div>:<div className="quickgrid">{["Reminder","Thing","Payment","Document"].map(x=><button key={x} onClick={()=>setQuickText(x==="Reminder"?"":"Add a "+x.toLowerCase())}><strong>{x}</strong><small>Capture it quickly</small></button>)}</div>}<button className="dark full" disabled={!quickText.trim()&&!quickProposal} onClick={()=>{if(!quickProposal){setQuickProposal(buildQuickProposal(quickText));return;}setAttention(x=>[{id:Date.now(),title:quickProposal.title,meta:`${quickProposal.type} · ${quickProposal.due}`,amount:"",urgent:false},...x]);setModal(false);setQuickText("");setQuickProposal(null)}}>{quickProposal?"Save to Life Admin":"Review details"}</button></div></div>}
 </main>
}