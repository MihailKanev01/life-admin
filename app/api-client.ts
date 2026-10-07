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
