import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import "@/components/music/music-app.css";
import AuthSessionProvider from "@/components/providers/session-provider";
import BootstrapClient from "@/components/bootstrap-client";
import RequestToastProvider from "@/components/providers/request-toast-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PulsePlayer",
  description: "Music library — albums and tracks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthSessionProvider>
          <BootstrapClient />
          <RequestToastProvider />
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
