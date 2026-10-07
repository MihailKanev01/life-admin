import type {NextConfig} from "next";

const apiBaseUrl=process.env.NEXT_PUBLIC_API_BASE_URL||"http://127.0.0.1:8080/api/v1";

const nextConfig:NextConfig={
 async rewrites(){
  return [{source:"/api/v1/:path*",destination:apiBaseUrl+"/:path*"}];
 },
};

export default nextConfig;
