"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import {
  Button,
  confirmDialog,
  PageTitle,
  Spinner,
  STATUS_META,
  toast,
} from "@/components/ui";
import { api, fmtDateLong, todayIso } from "@/lib/api";
import { PlanDayDto, SessionDetailDto } from "@/lib/types";

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function PlanningPage() {
  return (
    <AppShell>
      <Planning />
    </AppShell>
  );
}

function Planning() {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [days, setDays] = useState<Map<string, PlanDayDto> | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const list = await api<PlanDayDto[]>(
      `/api/plan?from=${iso(first)}&to=${iso(last)}`
    );
    setDays(new Map(list.map((d) => [d.date, d])));
  }, [year, month]);

  useEffect(() => {
    setDays(null);
    load().catch(() => {});
  }, [load]);

  function shift(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  async function generate() {
    setBusy(true);
    try {
      const res = await api<{ created: number }>("/api/plan/generate", {
        method: "POST",
        body: { weeks: 4 },
      });
      toast(`${res.created} séance(s) ajoutée(s) au planning`);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function onDayClick(day: PlanDayDto) {
    if (day.session) {
      router.push(`/seance/${day.session.id}`);
      return;
    }
    if (day.date < todayIso()) return;
    if (
      !(await confirmDialog(`Créer une séance ${fmtDateLong(day.date)} ?`, {
        confirmLabel: "Créer",
      }))
    )
      return;
    const s = await api<SessionDetailDto>("/api/sessions/adhoc", {
      method: "POST",
      body: { date: day.date },
    });
    router.push(`/seance/${s.id}`);
  }

  // grille : lundi = première colonne
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (first.getDay() + 6) % 7; // 0 = lundi
  const cells: (string | null)[] = [
    ...Array<null>(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => iso(new Date(year, month, i + 1))),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const today = todayIso();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle sub="Toute l'équipe suit le même programme : un férié décale tout le monde pareil, un skip perso ne décale rien — au retour tu es déjà calé sur le groupe.">
          Planning
        </PageTitle>
        <Button onClick={generate} disabled={busy}>
          {busy ? "Génération…" : "Générer 4 semaines"}
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-panel">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <button
            onClick={() => shift(-1)}
            className="cursor-pointer rounded px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-cta hover:bg-[#f8f3ff]"
          >
            ← Préc
          </button>
          <div className="font-display text-3xl leading-none text-foreground">
            {MONTHS[month]} <span className="text-volt">{year}</span>
          </div>
          <button
            onClick={() => shift(1)}
            className="cursor-pointer rounded px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-cta hover:bg-[#f8f3ff]"
          >
            Suiv →
          </button>
        </div>

        {!days ? (
          <Spinner />
        ) : (
          <div className="grid grid-cols-7 gap-px bg-line">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="bg-[#f9f9f9] px-2 py-2 text-center text-[10px] font-extrabold uppercase tracking-widest text-mute"
              >
                {w}
              </div>
            ))}
            {cells.map((dateIso, i) => {
              if (!dateIso)
                return <div key={`empty-${i}`} className="min-h-24 bg-[#fdfcfa]" />;
              const day = days.get(dateIso);
              const dayNum = Number(dateIso.slice(8));
              const isToday = dateIso === today;
              const session = day?.session ?? null;
              const clickable =
                !!session ||
                (!!day?.trainingDay && !day?.holiday && dateIso >= today);

              return (
                <div
                  key={dateIso}
                  onClick={() => day && clickable && onDayClick(day)}
                  className={`min-h-24 p-2 transition-colors ${
                    isToday ? "bg-[#fff6f0]" : "bg-panel"
                  } ${clickable ? "cursor-pointer hover:bg-raise" : ""} ${
                    !day?.trainingDay && !session ? "bg-[#fdfcfa]" : ""
                  }`}
                >
                  <div
                    className={`text-xs font-bold ${
                      isToday
                        ? "font-display text-base leading-none text-volt"
                        : "text-mute"
                    }`}
                  >
                    {dayNum}
                  </div>
                  {day?.holiday && (
                    <div className="mt-1.5 inline-block truncate rounded bg-badge px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-foreground">
                      {day.holidayName}
                    </div>
                  )}
                  {session && (
                    <div
                      className={`mt-1.5 inline-block rounded border px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${
                        STATUS_META[session.status]?.className ?? ""
                      }`}
                    >
                      {session.focusLabel}
                    </div>
                  )}
                  {!session && day?.trainingDay && !day?.holiday && dateIso >= today && (
                    <div className="mt-1.5 text-xs font-bold text-[#d5d5d5]">+</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-extrabold uppercase tracking-wide">
        <span className="text-mute">Légende</span>
        {Object.entries(STATUS_META)
          .filter(([k]) => !["REST", "NONE"].includes(k))
          .map(([k, v]) => (
            <span key={k} className={`rounded border px-1.5 py-0.5 ${v.className}`}>
              {v.label}
            </span>
          ))}
        <span className="rounded bg-badge px-1.5 py-0.5 text-foreground">Férié</span>
      </div>
    </div>
  );
}
