"use client";

import {useEffect,useRef,useState,type FormEvent} from "react";
import {useI18n} from "./i18n";
import {
  ApiDocument,
  ApiThing,
  deleteDocument,
  getDocumentDownloadUrl,
  getDocuments,
  uploadDocument,
} from "./api-client";

const MAX_BYTES=10*1024*1024;

function documentTypeLabel(contentType:string){
  if(contentType==="application/pdf")return "PDF";
  if(contentType==="image/jpeg")return "JPEG";
  if(contentType==="image/png")return "PNG";
  return contentType;
}

function formatFileSize(bytes:number){
  if(bytes<1024)return bytes+" B";
  if(bytes<1024*1024)return (bytes/1024).toFixed(0)+" KB";
  return (bytes/(1024*1024)).toFixed(1)+" MB";
}

function formatDocumentDate(value:string,locale="en"){
  const date=new Date(value);
  return Number.isNaN(date.getTime())?"Date unavailable":new Intl.DateTimeFormat(locale,{
    year:"numeric",month:"short",day:"numeric",
  }).format(date);
}

export default function DocumentsPanel({
  things,
  initialThingId="",
  onBackToThing,
}:{
  things:ApiThing[];
  initialThingId?:string;
  onBackToThing?:()=>void;
}){
  const {t,locale}=useI18n();
  const [items,setItems]=useState<ApiDocument[]>([]);
  const [filterThingId,setFilterThingId]=useState(initialThingId);
  const [uploadThingId,setUploadThingId]=useState(initialThingId);
  const [file,setFile]=useState<File|null>(null);
  const fileInputRef=useRef<HTMLInputElement>(null);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");

  useEffect(()=>{
    setFilterThingId(initialThingId);
    setUploadThingId(initialThingId);
  },[initialThingId]);

  useEffect(()=>{
    let active=true;
    setLoading(true);
    getDocuments(filterThingId||undefined).then(result=>{
      if(active)setItems(result.items);
    }).catch(caught=>{
      if(active)setError(caught instanceof Error?t(caught.message):t("Could not load documents."));
    }).finally(()=>{
      if(active)setLoading(false);
    });
    return ()=>{active=false;};
  },[filterThingId]);

  async function refresh(){
    setLoading(true);
    setError("");
    try{
      const result=await getDocuments(filterThingId||undefined);
      setItems(result.items);
    }catch(caught){
      setError(caught instanceof Error?caught.message:"Could not load documents.");
    }finally{
      setLoading(false);
    }
  }

  async function handleUpload(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!file||busy)return;
    if(file.size<=0){
      setError("Choose a non-empty file.");
      return;
    }
    if(file.size>MAX_BYTES){
      setError("Choose a file no larger than 10 MiB.");
      return;
    }
    const allowedMime=["application/pdf","image/jpeg","image/png"];
    const validExtension=/\.(pdf|jpe?g|png)$/i.test(file.name);
    if(!validExtension||!allowedMime.includes(file.type)){
      setError("Only PDF, JPEG and PNG files are supported.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");
    try{
      await uploadDocument(file,uploadThingId||null);
      setFile(null);
      if(fileInputRef.current)fileInputRef.current.value="";
      if(filterThingId&&filterThingId!==uploadThingId)setFilterThingId(uploadThingId);
      else{
        const result=await getDocuments(filterThingId||undefined);
        setItems(result.items);
      }
      setMessage(t("Document uploaded and verified."));
    }catch(caught){
      setError(caught instanceof Error?t(caught.message):t("Could not upload the document."));
    }finally{
      setBusy(false);
    }
  }

  async function handleDownload(document:ApiDocument){
    setError("");
    try{
      const result=await getDocumentDownloadUrl(document.id);
      const link=window.document.createElement("a");
      link.href=new URL(result.url,window.location.origin).href;
      link.target="_blank";
      link.rel="noopener noreferrer";
      link.download=document.fileName;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
    }catch(caught){
      setError(caught instanceof Error?t(caught.message):t("Could not prepare the download."));
    }
  }

  async function handleDelete(document:ApiDocument){
    if(!window.confirm(t("Delete {name}? This also removes the stored file.").replace("{name}",document.fileName)))return;
    setError("");
    setMessage("");
    try{
      await deleteDocument(document.id);
      setItems(current=>current.filter(item=>item.id!==document.id));
      setMessage(t("Document deleted."));
    }catch(caught){
      setError(caught instanceof Error?t(caught.message):t("Could not delete the document."));
    }
  }

  return <div className="documents-page">
    <div className="documents-heading">
      <div>
        <p className="eyebrow">{t("Your files")}</p>
        <h1>{t("Documents")}</h1>
        <p className="subtitle">{t("Keep receipts, warranties and important files alongside the things they belong to.")}</p>
      </div>
      <div className="documents-heading-actions">
        {initialThingId&&onBackToThing&&<button className="light documents-back" type="button" onClick={onBackToThing}>{t("Back to Thing")}</button>}
        <button className="light documents-refresh" type="button" onClick={()=>void refresh()} disabled={loading||busy}>
          {t(loading?"Refreshing…":"Refresh")}
        </button>
      </div>
    </div>

    <form className="panel documents-upload" onSubmit={handleUpload}>
      <div>
        <h2>{t("Upload a document")}</h2>
        <p>{t("PDF, JPEG or PNG · up to 10 MiB. Files are private by default.")}</p>
      </div>
      <label className="documents-file-field">
        <span>{t("Choose file")}</span>
        <input ref={fileInputRef} aria-label={t("Choose document")} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          onChange={event=>{setError("");setMessage("");setFile(event.target.files?.[0]||null);}} />
      </label>
      {file&&<p className="documents-selected-file">{file.name} · {formatFileSize(file.size)}</p>}
      <label className="documents-link-field">
        <span>{t("Link to a Thing")} <small>{t("(optional)")}</small></span>
        <select aria-label={t("Link to a Thing")} value={uploadThingId} onChange={event=>setUploadThingId(event.target.value)}>
          <option value="">{t("No linked Thing")}</option>
          {things.map(thing=><option key={thing.id} value={thing.id}>{thing.name}</option>)}
        </select>
      </label>
      <button className="dark" type="submit" disabled={!file||busy}>
        {t(busy?"Uploading and verifying…":"Upload document")}
      </button>
    </form>

    {error&&<div className="auth-error app-error documents-message" role="alert">{t(error)}</div>}
    {message&&!error&&<div className="documents-success" role="status">{t(message)}</div>}

    <section className="panel documents-library" aria-labelledby="documents-library-heading">
      <div className="documents-library-heading">
        <div><h2 id="documents-library-heading">{t("Your documents")}</h2><p>{items.length} {t(items.length===1?"file":"files")}{filterThingId?t(" linked to the selected Thing"):""}</p></div>
        <label className="documents-filter"><span>{t("Filter")}</span>
          <select aria-label={t("Filter documents by Thing")} value={filterThingId} onChange={event=>setFilterThingId(event.target.value)}>
            <option value="">{t("All Things")}</option>
            {things.map(thing=><option key={thing.id} value={thing.id}>{thing.name}</option>)}
          </select>
        </label>
      </div>
      {loading?<div className="empty"><span>▤</span><div><strong>{t("Loading documents…")}</strong><small>{t("Your saved files will appear here.")}</small></div></div>
      :items.length===0?<div className="empty"><span>▤</span><div><strong>{t("No documents yet.")}</strong><small>{t("Upload a receipt or warranty to keep it with the rest of your life admin.")}</small></div></div>
      :<div className="documents-list">
        {items.map(document=><article className="document-row" key={document.id}>
          <div className="document-type-icon" aria-hidden="true">{documentTypeLabel(document.contentType)==="PDF"?"PDF":"IMG"}</div>
          <div className="document-main">
            <strong title={document.fileName}>{document.fileName}</strong>
            <p>{documentTypeLabel(document.contentType)} · {formatFileSize(document.sizeBytes)}</p>
            <small>{document.thingName||t("No linked Thing")} · {t("Added")} {formatDocumentDate(document.createdAt,locale)}</small>
            <span className="document-status">{t(document.status==="READY"?"Ready":"Processing")}</span>
          </div>
          <div className="document-actions">
            <button className="light" type="button" onClick={()=>void handleDownload(document)}>{t("Download")}</button>
            <button className="text" type="button" onClick={()=>void handleDelete(document)}>{t("Delete")}</button>
          </div>
        </article>)}
      </div>}
    </section>
  </div>;
}
