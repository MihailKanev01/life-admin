import type {NextConfig} from "next";

const isVercelBuild=process.env.VERCEL==="1";
const apiBaseUrl=process.env.NEXT_PUBLIC_API_BASE_URL;

if(isVercelBuild&&!apiBaseUrl){
 throw new Error("NEXT_PUBLIC_API_BASE_URL must be configured for Vercel deployments.");
}

const nextConfig:NextConfig={
 async rewrites(){
  return [{
   source:"/api/v1/:path*",
   destination:(apiBaseUrl||"http://127.0.0.1:8080/api/v1")+"/:path*",
  }];
 },
};

export default nextConfig;
