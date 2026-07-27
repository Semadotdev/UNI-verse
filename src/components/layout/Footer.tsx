"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const legalLinks = [
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/terms", label: "Terms of Service" },
  { href: "/legal/copyright", label: "Copyright Policy" },
  { href: "/legal/dmca", label: "DMCA" },
  { href: "/legal/disclaimer", label: "Disclaimer" },
  { href: "/legal/cookies", label: "Cookie Policy" },
];

export function Footer() {
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/register") return null;

  return (
    <footer className="border-t border-border bg-bg-raised/50">
      <div className="container mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight">
              <span className="text-white">UNI</span>
              <span className="text-primary-light">-</span>
              <span className="text-white">verse</span>
            </span>
          </div>
          <p className="text-xs text-muted">Grace Lights the Way to Every Story.</p>
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-muted hover:text-primary-light transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="text-xs text-muted/60">&copy; 2026 UNI-verse</p>
        </div>
      </div>
    </footer>
  );
}
