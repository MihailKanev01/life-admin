type ApiErrorShape={message?:string;detail?:string;error?:{message?:string}};

const API_REQUEST_TIMEOUT_MS=30_000;
const API_WARMUP_TIMEOUT_MS=180_000;

async function fetchWithTimeout(input:RequestInfo|URL,init:RequestInit={},timeoutMs=API_REQUEST_TIMEOUT_MS){
 const controller=new AbortController();
 const timeoutId=window.setTimeout(()=>controller.abort(),timeoutMs);
 try{
  return await fetch(input,{...init,signal:controller.signal});
 }finally{
  window.clearTimeout(timeoutId);
 }
}

let apiWarmupPromise:Promise<void>|null=null;
let apiWarmupSucceededAt=0;

async function warmUpApi(){
 const now=Date.now();
 if(apiWarmupPromise)return apiWarmupPromise;
 if(apiWarmupSucceededAt&&now-apiWarmupSucceededAt<5*60_000)return;
 apiWarmupPromise=(async()=>{
  try{
   const response=await fetchWithTimeout("/api/v1/system/health",{
    credentials:"include",
    cache:"no-store",
   },API_WARMUP_TIMEOUT_MS);
   if(response.ok)apiWarmupSucceededAt=Date.now();
  }catch{}
  finally{
   apiWarmupPromise=null;
  }
 })();
 await apiWarmupPromise;
}

async function csrfToken():Promise<string>{
 let response:Response;
 try{
  response=await fetchWithTimeout("/api/v1/auth/csrf",{credentials:"include",cache:"no-store"});
 }catch(caught){
  if(caught instanceof DOMException&&caught.name==="AbortError")throw new Error("Authentication service is unavailable.");
  throw caught;
 }
 if(!response.ok)throw new Error("Authentication service is unavailable.");
 const data=await response.json() as {token?:string};
 if(!data.token)throw new Error("Could not initialize secure authentication.");
 return data.token;
}

async function apiRequest<T>(path:string,init:RequestInit={}):Promise<T>{
 await warmUpApi();
 const method=(init.method||"GET").toUpperCase();
 const headers=new Headers(init.headers);
 headers.set("Content-Type","application/json");
 if(!["GET","HEAD","OPTIONS"].includes(method)){
  headers.set("X-XSRF-TOKEN",await csrfToken());
 }
 let response:Response;
 try{
  response=await fetchWithTimeout("/api/v1"+path,{
   ...init,
   method,
   headers,
   credentials:"include",
   cache:"no-store",
  });
 }catch(caught){
  if(caught instanceof DOMException&&caught.name==="AbortError"){
   throw new Error("Authentication service is unavailable.");
  }
  throw caught;
 }
 if(!response.ok){
  let message="Something went wrong.";
  try{
   const error=await response.json() as ApiErrorShape;
   message=error.message||error.detail||error.error?.message||message;
  }catch{}

  if(response.status===409){
   message="An account with this email already exists. Sign in or use Forgot your password.";
  }else if(message==="Something went wrong."){
   if(response.status===401){
    message="Invalid email or password.";
   }else if(response.status===403){
    message="The security check failed. Please refresh the page and try again.";
   }else if(response.status>=500){
    message="The service is temporarily unavailable. Please try again in a moment.";
   }
  }

  throw new Error(message);
 }
 if(response.status===204)return undefined as T;
 return await response.json() as T;
}

export type ApiUser={
 id:string;
 email:string;
 displayName:string;
 timezone:string;
 onboardingComplete:boolean;
 createdAt:string;
};

export type ApiAuthResponse={user:ApiUser};

export async function getCurrentUser(){
 return apiRequest<ApiAuthResponse>("/auth/me");
}

export async function registerAccount(payload:{email:string;password:string;displayName:string;timezone:string}){
 return apiRequest<ApiAuthResponse>("/auth/register",{method:"POST",body:JSON.stringify(payload)});
}

export async function loginAccount(payload:{email:string;password:string}){
 return apiRequest<ApiAuthResponse>("/auth/login",{method:"POST",body:JSON.stringify(payload)});
}

export async function requestPasswordReset(email:string){
 return apiRequest<{message:string}>("/auth/password-reset/request",{
  method:"POST",
  body:JSON.stringify({email}),
 });
}

export async function resetPassword(payload:{token:string;password:string}){
 return apiRequest<{message:string}>("/auth/password-reset/confirm",{
  method:"POST",
  body:JSON.stringify(payload),
 });
}

export async function completeOnboarding(){
 return apiRequest<ApiAuthResponse>("/auth/me/onboarding",{method:"PATCH"});
}

export async function logoutAccount(){
 const result=await apiRequest<void>("/auth/logout",{method:"POST"});
 const secure=window.location.protocol==="https:"?"; Secure":"";
 document.cookie="XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; Path=/; SameSite=Strict"+secure;
 return result;
}

export type ApiReminder={
 id:string;
 title:string;
 context:string;
 thingId:string|null;
 dueDate:string|null;
 status:string;
 createdAt:string;
};

export type ApiReminderList={items:ApiReminder[]};

export async function getReminders(){
 return apiRequest<ApiReminderList>("/reminders");
}

export async function createReminder(payload:{title:string;context:string;dueDate:string|null;thingId?:string|null}){
 return apiRequest<ApiReminder>("/reminders",{method:"POST",body:JSON.stringify(payload)});
}

export async function completeReminder(id:string){
 return apiRequest<ApiReminder>("/reminders/"+id+"/complete",{method:"POST"});
}

export async function snoozeReminder(id:string,dueDate:string){
 return apiRequest<ApiReminder>("/reminders/"+id+"/snooze",{method:"POST",body:JSON.stringify({dueDate})});
}

export type ApiThing={
 id:string;
 name:string;
 type:string;
 detail:string|null;
 openReminderCount:number;
 activePaymentCount:number;
 createdAt:string;
};

export type ApiThingList={items:ApiThing[]};

export async function getThings(){
 return apiRequest<ApiThingList>("/things");
}

export async function getThing(id:string){
 return apiRequest<ApiThing>("/things/"+id);
}

export async function createThing(payload:{name:string;type:string;detail?:string|null}){
 return apiRequest<ApiThing>("/things",{method:"POST",body:JSON.stringify(payload)});
}

export async function archiveThing(id:string){
 return apiRequest<void>("/things/"+id+"/archive",{method:"POST"});
}


export type ApiPayment={
 id:string;
 thingId:string|null;
 name:string;
 type:"BILL"|"SUBSCRIPTION"|"RENEWAL"|string;
 amount:number;
 currency:string;
 frequency:"WEEKLY"|"MONTHLY"|"YEARLY"|string;
 nextDueDate:string|null;
 status:string;
 lastPaidAt:string|null;
 createdAt:string;
};

export type ApiPaymentList={items:ApiPayment[]};

export async function getPayments(){
 return apiRequest<ApiPaymentList>("/payments");
}

export async function getPayment(id:string){
 return apiRequest<ApiPayment>("/payments/"+id);
}

export async function createPayment(payload:{
 name:string;
 type:string;
 amount:number;
 currency?:string;
 frequency:string;
 nextDueDate?:string|null;
 thingId?:string|null;
}){
 return apiRequest<ApiPayment>("/payments",{method:"POST",body:JSON.stringify(payload)});
}

export async function markPaymentPaid(id:string){
 return apiRequest<ApiPayment>("/payments/"+id+"/mark-paid",{method:"POST"});
}

export async function skipPayment(id:string){
 return apiRequest<ApiPayment>("/payments/"+id+"/skip",{method:"POST"});
}

export async function cancelPayment(id:string){
 return apiRequest<ApiPayment>("/payments/"+id+"/cancel",{method:"POST"});
}


export type ApiSearchResult={
 id:string;
 kind:"THING"|"REMINDER"|"PAYMENT"|"DOCUMENT"|"NOTE"|string;
 title:string;
 subtitle:string;
 thingId:string|null;
 dueDate:string|null;
 createdAt:string;
};

export type ApiSearchResponse={items:ApiSearchResult[]};

export async function searchLife(query:string){
 return apiRequest<ApiSearchResponse>("/search?q="+encodeURIComponent(query.trim()));
}


export async function updateReminder(id:string,payload:{
 title:string;
 context:string;
 dueDate:string|null;
 thingId?:string|null;
}){
 return apiRequest<ApiReminder>("/reminders/"+id,{method:"PATCH",body:JSON.stringify(payload)});
}

export async function rescheduleReminder(id:string,dueDate:string){
 return apiRequest<ApiReminder>("/reminders/"+id+"/reschedule",{
  method:"POST",
  body:JSON.stringify({dueDate}),
 });
}

export async function updateThing(id:string,payload:{
 name:string;
 type:string;
 detail?:string|null;
}){
 return apiRequest<ApiThing>("/things/"+id,{method:"PATCH",body:JSON.stringify(payload)});
}


export async function updatePayment(id:string,payload:{
 name:string;
 type:string;
 amount:number;
 currency?:string;
 frequency:string;
 nextDueDate?:string|null;
 thingId?:string|null;
}){
 return apiRequest<ApiPayment>("/payments/"+id,{method:"PATCH",body:JSON.stringify(payload)});
}




export type ApiNote={
 id:string;
 title:string;
 body:string;
 thingId:string;
 thingName:string|null;
 createdAt:string;
 updatedAt:string;
};
export type ApiNoteList={items:ApiNote[]};

export async function getNotes(thingId?:string){
 const suffix=thingId?"?thingId="+encodeURIComponent(thingId):"";
 return apiRequest<ApiNoteList>("/notes"+suffix);
}

export async function createNote(payload:{title:string;body:string;thingId:string}){
 return apiRequest<ApiNote>("/notes",{method:"POST",body:JSON.stringify(payload)});
}

export async function updateNote(id:string,payload:{title:string;body:string}){
 return apiRequest<ApiNote>("/notes/"+encodeURIComponent(id),{method:"PATCH",body:JSON.stringify(payload)});
}

export async function deleteNote(id:string){
 return apiRequest<void>("/notes/"+encodeURIComponent(id),{method:"DELETE"});
}




export type ApiExpiryQuickAddResponse={
 thingId:string;
 thingName:string;
 thingCreated:boolean;
 noteId:string;
 reminderId:string;
 expiresOn:string;
 reminderOn:string;
};

export async function createExpiryQuickAdd(payload:{
 thingId?:string|null;
 thingName?:string|null;
 thingType?:string|null;
 recordTitle:string;
 expiresOn:string;
 reminderOn:string;
}){
 return apiRequest<ApiExpiryQuickAddResponse>("/quick-add/expiry",{method:"POST",body:JSON.stringify(payload)});
}


export type ApiDocument={
 id:string;
 fileName:string;
 contentType:string;
 sizeBytes:number;
 checksumSha256:string;
 thingId:string|null;
 thingName:string|null;
 createdAt:string;
 status:string;
 extractionStatus:string;
};
export type ApiDocumentList={items:ApiDocument[]};
export type ApiDocumentUploadSession={
 documentId:string;
 uploadUrl:string;
 headers:Record<string,string>;
 expiresAt:string;
};
export type ApiDocumentDownloadUrl={url:string;expiresAt:string};

export async function getDocuments(thingId?:string){
 const suffix=thingId?"?thingId="+encodeURIComponent(thingId):"";
 return apiRequest<ApiDocumentList>("/documents"+suffix);
}

export async function getDocumentDownloadUrl(id:string){
 return apiRequest<ApiDocumentDownloadUrl>("/documents/"+encodeURIComponent(id)+"/download-url");
}

export async function deleteDocument(id:string){
 return apiRequest<void>("/documents/"+encodeURIComponent(id),{method:"DELETE"});
}

async function sha256Base64(file:File){
 const digest=await window.crypto.subtle.digest("SHA-256",await file.arrayBuffer());
 return window.btoa(String.fromCharCode(...new Uint8Array(digest)));
}

export async function uploadDocument(file:File,thingId?:string|null){
 if(file.size<=0)throw new Error("Choose a non-empty file.");
 if(file.size>10*1024*1024)throw new Error("Documents must be 10 MiB or smaller.");
 const checksumSha256=await sha256Base64(file);
 const session=await apiRequest<ApiDocumentUploadSession>("/documents/upload-sessions",{
  method:"POST",
  body:JSON.stringify({
   fileName:file.name,
   contentType:file.type,
   sizeBytes:file.size,
   checksumSha256,
   thingId:thingId||null,
  }),
 });
 try{
  const uploadTarget=new URL(session.uploadUrl,window.location.origin);
  const sameOrigin=uploadTarget.origin===window.location.origin;
  const headers=new Headers(session.headers);
  if(sameOrigin)headers.set("X-XSRF-TOKEN",await csrfToken());
  const uploaded=await fetchWithTimeout(uploadTarget.href,{
   method:"PUT",
   headers,
   body:file,
   credentials:sameOrigin?"include":"omit",
   cache:"no-store",
  },120_000);
  if(!uploaded.ok)throw new Error("The document could not be uploaded to storage. Please try again.");
  return await apiRequest<ApiDocument>("/documents/"+encodeURIComponent(session.documentId)+"/finalize",{method:"POST"});
 }catch(error){
  await deleteDocument(session.documentId).catch(()=>undefined);
  throw error;
 }
}
