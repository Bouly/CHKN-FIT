"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api, clearToken, getToken } from "@/lib/api";
import { UserDto } from "@/lib/types";
import { Confirmer, Toaster } from "@/components/ui";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/planning", label: "Planning" },
  { href: "/progression", label: "Progression" },
  { href: "/physique", label: "Physique" },
  { href: "/mensurations", label: "Mensurations" },
  { href: "/programmes", label: "Programmes" },
  { href: "/equipe", label: "Équipe" },
  { href: "/parametres", label: "Paramètres" },
];

// mobile : 4 onglets directs + le reste dans "Plus"
const NAV_MOBILE = NAV.filter((n) =>
  ["/", "/planning", "/progression", "/equipe"].includes(n.href)
);
const NAV_MORE = NAV.filter(
  (n) => !["/", "/planning", "/progression", "/equipe"].includes(n.href)
);

/** Wordmark façon logo Basic-Fit : heavy uppercase orange avec tiret. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-display text-2xl leading-none text-volt ${className}`}
    >
      CHKN-FIT
    </span>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserDto | null>(null);
  const [ready, setReady] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    api<UserDto>("/api/auth/me")
      .then((u) => {
        setUser(u);
        setReady(true);
      })
      .catch(() => {
        // 401 déjà géré par le client API (redirection)
      });
  }, [router]);

  function logout() {
    clearToken();
    router.replace("/login");
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="font-display text-2xl text-volt">CHKN-FIT</span>
        <span className="blink ml-1.5 inline-block h-4 w-2 bg-volt" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-line bg-ink md:flex">
        <Link href="/" className="block border-b border-line px-5 py-5">
          <Wordmark />
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-mute">
            Suivi sportif de l&apos;équipe
          </div>
        </Link>
        <nav className="flex flex-1 flex-col py-3">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-5 py-3 text-sm font-extrabold uppercase tracking-wide transition-colors ${
                  active
                    ? "bg-[#fff6f0] text-volt"
                    : "text-foreground/70 hover:bg-[#f9f9f9] hover:text-foreground"
                }`}
              >
                {active && (
                  <span className="absolute inset-y-0 left-0 w-1 bg-volt" />
                )}
                {item.label}
              </Link>
            );
          })}
        </nav>
        {user && (
          <div className="border-t border-line px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-raise text-lg">
                {user.avatarEmoji}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-foreground">
                  {user.displayName}
                </div>
                <button
                  onClick={logout}
                  className="cursor-pointer text-[10px] font-semibold uppercase tracking-wide text-mute transition-colors hover:text-alarm"
                >
                  Déconnexion
                </button>
              </div>
            </div>
            <div className="mt-3 text-[9px] font-semibold uppercase tracking-widest text-[#d5d5d5]">
              CHKN-FIT v1.0 — fait maison
            </div>
          </div>
        )}
      </aside>

      {/* Barre mobile : 4 onglets + "Plus" */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-20 bg-foreground/20 md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}
      {moreOpen && (
        <div className="toast-in fixed inset-x-3 bottom-20 z-30 overflow-hidden rounded-2xl border border-line bg-white shadow-xl md:hidden">
          {NAV_MORE.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className={`flex items-center gap-3 border-b border-line px-5 py-3.5 text-sm font-extrabold uppercase tracking-wide last:border-b-0 ${
                  active ? "bg-[#fff6f0] text-volt" : "text-foreground/80"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${active ? "bg-volt" : "bg-[#d5d5d5]"}`}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
      <div className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-ink md:hidden">
        {NAV_MOBILE.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMoreOpen(false)}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-[9px] font-extrabold uppercase tracking-wide ${
                active ? "text-volt" : "text-mute"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${active ? "bg-volt" : "bg-[#d5d5d5]"}`}
              />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen((v) => !v)}
          className={`flex flex-1 cursor-pointer flex-col items-center gap-1 py-3 text-[9px] font-extrabold uppercase tracking-wide ${
            moreOpen || NAV_MORE.some((n) => pathname.startsWith(n.href))
              ? "text-volt"
              : "text-mute"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              moreOpen || NAV_MORE.some((n) => pathname.startsWith(n.href))
                ? "bg-volt"
                : "bg-[#d5d5d5]"
            }`}
          />
          Plus
        </button>
      </div>

      <main className="flex-1 pb-24 md:ml-60 md:pb-0">
        <div className="mx-auto max-w-6xl p-4 md:p-10">{children}</div>
      </main>

      <Toaster />
      <Confirmer />
    </div>
  );
}
