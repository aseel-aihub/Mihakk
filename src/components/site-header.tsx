"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/lab", label: "Lab" },
  { href: "/results", label: "Results" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const path = usePathname();
  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-3 font-semibold" aria-label="Mihakk home">
          {/* The approved logo is served from /public/logo.svg. Replace that one file to change it. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Mihakk logo" width={36} height={40} className="h-10 w-9" />
          <span className="text-xl tracking-tight">Mihakk</span>
        </Link>
        <nav aria-label="Main">
          <ul className="flex flex-wrap items-center gap-1">
            {LINKS.map((l) => {
              const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={cn("inline-flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium hover:bg-wash", active && "bg-ink text-paper hover:bg-ink")}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
