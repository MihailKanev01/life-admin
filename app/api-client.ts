type ApiErrorShape={message?:string;detail?:string;error?:{message?:string}};

async function csrfToken():Promise<string>{
 const response=await fetch("/api/v1/auth/csrf",{credentials:"include",cache:"no-store"});
 if(!response.ok)throw new Error("Authentication service is unavailable.");
 const data=await response.json() as {token?:string};
 if(!data.token)throw new Error("Could not initialize secure authentication.");
 return data.token;
}

async function apiRequest<T>(path:string,init:RequestInit={}):Promise<T>{
 const method=(init.method||"GET").toUpperCase();
 const headers=new Headers(init.headers);
 headers.set("Content-Type","application/json");
 if(!["GET","HEAD","OPTIONS"].includes(method)){
  headers.set("X-XSRF-TOKEN",await csrfToken());
 }
 const response=await fetch("/api/v1"+path,{
  ...init,
  method,
  headers,
  credentials:"include",
  cache:"no-store",
 });
 if(!response.ok){
  let message="Something went wrong.";
  try{
   const error=await response.json() as ApiErrorShape;
   message=error.message||error.detail||error.error?.message||message;
  }catch{}
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

export async function completeOnboarding(){
 return apiRequest<ApiAuthResponse>("/auth/me/onboarding",{method:"PATCH"});
}

export async function logoutAccount(){
 return apiRequest<void>("/auth/logout",{method:"POST"});
}

export type ApiReminder={
 id:string;
 title:string;
 context:string;
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


export type ApiPayment={
 id:string;
 thingId:string|null;
 name:string;
 type:"BILL"|"SUBSCRIPTION"|"RENEWAL"|string;
 amount:string;
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
