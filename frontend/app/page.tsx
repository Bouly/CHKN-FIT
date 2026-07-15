"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import {
  Button,
  Card,
  CountUp,
  PageTitle,
  SectionTitle,
  Spinner,
  StatusPill,
} from "@/components/ui";
import { api, fmtDate, fmtDateLong, todayIso } from "@/lib/api";
import {
  DashboardDto,
  FeedItemDto,
  SessionDetailDto,
  TeamTodayDto,
} from "@/lib/types";

export default function DashboardPage() {
  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}

function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardDto | null>(null);
  const [team, setTeam] = useState<TeamTodayDto[]>([]);
  const [feed, setFeed] = useState<FeedItemDto[]>([]);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    api<DashboardDto>("/api/progress/dashboard").then(setData).catch(() => {});
    api<TeamTodayDto[]>("/api/plan/team-today").then(setTeam).catch(() => {});
    api<FeedItemDto[]>("/api/team/feed").then(setFeed).catch(() => {});
  }, []);

  useEffect(load, [load]);

  async function startAdhoc() {
    setCreating(true);
    try {
      const session = await api<SessionDetailDto>("/api/sessions/adhoc", {
        method: "POST",
        body: { date: todayIso() },
      });
      router.push(`/seance/${session.id}`);
    } finally {
      setCreating(false);
    }
  }

  if (!data) return <Spinner />;

  const t = data.todaySession;

  return (
    <div className="flex flex-col gap-8">
      <PageTitle sub={fmtDateLong(data.todayDate)}>Dashboard</PageTitle>

      {data.todayIsHoliday && (
        <div className="rounded-xl bg-badge px-5 py-4">
          <span className="font-display text-lg text-foreground">
            Jour férié — {data.todayHolidayName}
          </span>
          <p className="mt-0.5 text-sm text-foreground/80">
            Repos. Les séances restantes de la semaine se décalent automatiquement.
          </p>
        </div>
      )}

      {/* Séance du jour — bloc héro sable, façon Basic-Fit */}
      <div className="fade-up overflow-hidden rounded-2xl bg-sand">
        <div className="flex items-center justify-between px-6 pt-5">
          <span className="text-xs font-extrabold uppercase tracking-widest text-foreground/60">
            Séance du jour
          </span>
          {t && <StatusPill status={t.status} />}
        </div>
        <div className="flex flex-wrap items-end justify-between gap-6 px-6 pb-6 pt-2 md:pb-8">
          {t ? (
            <div>
              <div className="font-display text-7xl leading-none text-foreground md:text-8xl">
                {t.focusLabel}
                <span className="text-volt">.</span>
              </div>
              {data.nextTrainingDate &&
                data.nextTrainingDate !== data.todayDate && (
                  <p className="mt-3 text-sm text-foreground/70">
                    Prochaine séance : {fmtDateLong(data.nextTrainingDate)}
                  </p>
                )}
            </div>
          ) : (
            <div>
              <div className="font-display text-6xl leading-none text-foreground/50">
                {data.todayIsHoliday ? "Férié." : "Repos."}
              </div>
              <p className="mt-3 text-sm text-foreground/70">
                {data.nextTrainingDate
                  ? `Prochaine séance : ${fmtDateLong(data.nextTrainingDate)}`
                  : "Rien de prévu"}
              </p>
            </div>
          )}
          <div className="flex gap-3">
            {t && t.status !== "COMPLETED" && t.status !== "SKIPPED" && (
              <Button size="lg" onClick={() => router.push(`/seance/${t.id}`)}>
                {t.status === "IN_PROGRESS" ? "Reprendre" : "Go for it"}
              </Button>
            )}
            {t && (t.status === "COMPLETED" || t.status === "SKIPPED") && (
              <Button
                variant="secondary"
                onClick={() => router.push(`/seance/${t.id}`)}
              >
                Voir le résumé
              </Button>
            )}
            {!t && !data.todayIsHoliday && (
              <Button size="lg" onClick={startAdhoc} disabled={creating}>
                {creating ? "…" : "Créer une séance"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-line bg-panel p-5">
          <div className="text-xs font-bold uppercase tracking-wide text-mute">
            Streak
          </div>
          <div className="mt-2 font-display text-5xl leading-none text-volt">
            <CountUp value={data.streak} />
            <span className="text-2xl text-foreground/40"> j</span>
          </div>
          <div className="mt-2 text-xs text-mute">
            {data.streak > 1 ? "jours d'affilée" : "jour d'affilée"}
          </div>
        </div>
        <div className="rounded-xl border border-line bg-panel p-5">
          <div className="text-xs font-bold uppercase tracking-wide text-mute">
            Assiduité 30j
          </div>
          <div className="mt-2 font-display text-5xl leading-none text-foreground">
            <CountUp value={data.attendanceRate30d} />
            <span className="text-2xl text-foreground/40"> %</span>
          </div>
          <div className="mt-2 text-xs text-mute">
            {data.weekCompletedCount}/{data.weekPlannedCount} cette semaine
          </div>
        </div>
        <div className="rounded-xl border border-line bg-panel p-5">
          <div className="text-xs font-bold uppercase tracking-wide text-mute">
            Séances
          </div>
          <div className="mt-2 font-display text-5xl leading-none text-foreground">
            <CountUp value={data.totalCompleted} />
          </div>
          <div className="mt-2 text-xs text-mute">au total</div>
        </div>
        <div className="rounded-xl border border-line bg-panel p-5">
          <div className="text-xs font-bold uppercase tracking-wide text-mute">
            Poids
          </div>
          <div className="mt-2 font-display text-5xl leading-none text-foreground">
            {data.currentWeightKg ?? "—"}
            {data.currentWeightKg && (
              <span className="text-2xl text-foreground/40"> kg</span>
            )}
          </div>
          <div className="mt-2 text-xs text-mute">
            {data.weightDelta30d != null
              ? `${data.weightDelta30d > 0 ? "+" : ""}${data.weightDelta30d} kg sur 30 jours`
              : "ajoute une mensuration"}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Équipe aujourd'hui */}
        <div>
          <SectionTitle>L&apos;équipe aujourd&apos;hui</SectionTitle>
          <Card className="p-0">
            {team.length === 0 ? (
              <p className="p-5 text-sm text-mute">Personne pour l&apos;instant.</p>
            ) : (
              <div className="divide-y divide-line">
                {team.map((m) => (
                  <div
                    key={m.userId}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-raise text-base">
                        {m.avatarEmoji}
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {m.displayName}
                      </span>
                      {m.focus && (
                        <span className="text-xs font-extrabold uppercase tracking-wide text-volt">
                          {m.focus}
                        </span>
                      )}
                    </div>
                    <StatusPill status={m.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* PRs récents */}
        <div>
          <SectionTitle>Records récents</SectionTitle>
          <Card className="p-0">
            {data.recentPrs.length === 0 ? (
              <p className="p-5 text-sm text-mute">
                Pas encore de record. Ça va venir.
              </p>
            ) : (
              <div className="divide-y divide-line">
                {data.recentPrs.map((pr, i) => (
                  <div
                    key={i}
                    className="flex items-baseline justify-between px-4 py-3"
                  >
                    <div className="text-sm">
                      <span className="font-bold text-foreground">
                        {pr.exerciseName}
                      </span>
                      <span className="ml-2 text-xs text-mute">
                        {pr.weightKg}×{pr.reps}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-display text-2xl leading-none text-volt">
                        {pr.e1rm}
                      </span>
                      <span className="ml-1 text-[10px] font-semibold uppercase text-mute">
                        kg e1RM · {fmtDate(pr.date, { year: undefined })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Fil d'activité */}
      <div>
        <SectionTitle>Activité de l&apos;équipe</SectionTitle>
        <Card className="p-0">
          {feed.length === 0 ? (
            <p className="p-5 text-sm text-mute">
              Aucune séance validée pour l&apos;instant. Soyez les premiers.
            </p>
          ) : (
            <div className="divide-y divide-line">
              {feed.slice(0, 10).map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <span className="w-14 shrink-0 text-xs font-semibold text-mute">
                    {fmtDate(item.date, { year: undefined })}
                  </span>
                  <span className="text-foreground/80">
                    <span className="font-bold text-foreground">
                      {item.userName}
                    </span>{" "}
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
