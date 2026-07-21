"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Search, Clock, Settings, Library, Globe } from "lucide-react";

const navItems = [
  { href: "/", label: "Library", icon: Library },
  { href: "/search", label: "Search", icon: Search },
  { href: "/websites", label: "Websites", icon: Globe },
  { href: "/history", label: "History", icon: Clock },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950 md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-around px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 text-xs transition-colors",
                isActive ? "text-primary" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
