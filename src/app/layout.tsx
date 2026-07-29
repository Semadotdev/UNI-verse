import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ToastContainer } from "@/components/ui/Toast";
import { Providers } from "@/components/Providers";
import { ThemeApplier } from "@/components/ThemeApplier";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#581c87",
};

export const metadata: Metadata = {
  title: "UNI-verse",
  description: "Grace Lights the Way to Every Story.",
  manifest: "/manifest.json",
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
        <script
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
        <ServiceWorkerRegister />
        <Providers>
          <ThemeApplier />
          <Navbar />
          <main className="pb-20 pt-4 md:pb-4 md:pt-20 flex-1 flex flex-col">
            {children}
          </main>
          <Footer />
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}
