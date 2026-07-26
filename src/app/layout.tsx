import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { ToastContainer } from "@/components/ui/Toast";
import { Providers } from "@/components/Providers";
import { ThemeApplier } from "@/components/ThemeApplier";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "UNI-verse",
  description: "Grace Lights the Way to Every Story.",
  manifest: "/manifest.json",
  themeColor: "#581c87",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "UNI-verse",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var s = JSON.parse(localStorage.getItem('uni-verse-settings'));
                  var theme = s && s.theme ? s.theme : 'dark';
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var isDark = theme === 'dark' || (theme === 'system' && prefersDark);
                  document.documentElement.classList.add(isDark ? 'dark' : 'light');
                } catch(e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-bg text-zinc-100 antialiased flex flex-col min-h-screen`}>
        <Providers>
          <ThemeApplier />
          <Navbar />
          <main className="pb-20 pt-4 md:pb-4 md:pt-20 flex-1 flex flex-col">
            {children}
          </main>
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}
