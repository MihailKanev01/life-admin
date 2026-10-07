import type {Metadata} from "next";
import "./globals.css";
export const metadata:Metadata={title:"Life Admin — Prototype",description:"Web-first Life Admin clickable prototype"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}