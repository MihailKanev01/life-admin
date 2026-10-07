import type {Metadata} from "next";
import "./globals.css";

export const metadata:Metadata={title:"Life Admin — Prototype",description:"Web-first Life Admin clickable prototype"};

const themeScript=`try {
  const saved=localStorage.getItem("life-admin-theme");
  const theme=saved==="dark"||saved==="light" ? saved : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.dataset.theme=theme;
} catch {}
`;

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en" suppressHydrationWarning><body><script dangerouslySetInnerHTML={{__html:themeScript}}/>{children}</body></html>;
}
