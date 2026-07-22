import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { ToastContainer } from "@/components/ui/Toast";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "UNI-verse",
  description: "Your universe of manga",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-bg text-zinc-100 antialiased`}>
        <Providers>
          <Navbar />
          <main className="pb-20 pt-4 md:pb-4 md:pt-20 min-h-screen">
            {children}
          </main>
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}
