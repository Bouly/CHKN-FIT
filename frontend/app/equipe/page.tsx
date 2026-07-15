"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { Card, CountUp, PageTitle, SectionTitle, Spinner } from "@/components/ui";
import { api, fmtDate } from "@/lib/api";
import {
  BadgeDto,
  FeedItemDto,
  LeaderboardEntryDto,
  MemberDto,
  TeamWeekStatsDto,
} from "@/lib/types";

export default function EquipePage() {
  return (
    <AppShell>
      <Equipe />
    </AppShell>
  );
}

const PERIODS = [
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
  { value: "all", label: "Toujours" },
];

function Equipe() {
  const [period, setPeriod] = useState("week");
  const [board, setBoard] = useState<LeaderboardEntryDto[] | null>(null);
  const [badges, setBadges] = useState<BadgeDto[]>([]);
  const [members, setMembers] = useState<MemberDto[]>([]);
  const [feed, setFeed] = useState<FeedItemDto[]>([]);
  const [weekStats, setWeekStats] = useState<TeamWeekStatsDto | null>(null);

  useEffect(() => {
    api<BadgeDto[]>("/api/team/badges").then(setBadges).catch(() => {});
    api<MemberDto[]>("/api/team/members").then(setMembers).catch(() => {});
    api<FeedItemDto[]>("/api/team/feed").then(setFeed).catch(() => {});
    api<TeamWeekStatsDto>("/api/team/week-stats").then(setWeekStats).catch(() => {});
  }, []);

  useEffect(() => {
    setBoard(null);
    api<LeaderboardEntryDto[]>(`/api/team/leaderboard?period=${period}`).then(
      setBoard
    );
  }, [period]);

  return (
    <div className="flex flex-col gap-8">
      <PageTitle sub="Classement, badges et activité de l'équipe.">
        Équipe
      </PageTitle>

      {/* Effort collectif de la semaine */}
      {weekStats && (
        <div className="fade-up overflow-hidden rounded-2xl bg-sand px-6 py-5">
          <div className="text-xs font-extrabold uppercase tracking-widest text-foreground/60">
            Effort collectif cette semaine
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-8 gap-y-2">
            <div>
              <span className="font-display text-6xl leading-none text-foreground">
                <CountUp value={weekStats.totalVolumeKg} duration={900} locale />
              </span>
              <span className="ml-2 font-display text-2xl text-volt">KG</span>
              <span className="ml-2 text-xs text-foreground/60">soulevés ensemble</span>
            </div>
            <div className="text-sm font-bold text-foreground/70">
              {weekStats.totalSessions} séances · {weekStats.totalSets} séries
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <SectionTitle className="mb-0">Classement</SectionTitle>
          <div className="flex gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide transition-colors ${
                  period === p.value
                    ? "bg-volt text-white"
                    : "border border-line bg-white text-mute hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <Card className="p-0">
          {!board ? (
            <Spinner />
          ) : board.length === 0 ? (
            <p className="p-5 text-sm text-mute">Aucun membre pour l&apos;instant.</p>
          ) : (
            <div className="divide-y divide-line">
              {board.map((e) => (
                <div
                  key={e.userId}
                  className={`flex items-center gap-4 px-4 py-3.5 ${
                    e.rank === 1 ? "bg-[#fff6f0]" : ""
                  }`}
                >
                  <div
                    className={`w-10 font-display text-3xl leading-none ${
                      e.rank === 1 ? "text-volt" : "text-[#d5d5d5]"
                    }`}
                  >
                    {e.rank}
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-raise text-lg">
                    {e.avatarEmoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold text-foreground">
                        {e.displayName}
                      </span>
                      {e.rank === 1 && (
                        <span className="rounded bg-badge px-1.5 py-px text-[9px] font-extrabold uppercase tracking-wide text-foreground">
                          Top
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-mute">
                      {e.sessions} séances · {e.prs} PR · {e.photos} photos
                      {e.streak > 0 && ` · streak ${e.streak}j`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-display text-3xl leading-none ${
                        e.rank === 1 ? "text-volt" : "text-foreground"
                      }`}
                    >
                      {e.points}
                    </div>
                    <div className="text-[9px] font-extrabold uppercase tracking-widest text-mute">
                      pts
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <p className="mt-2 text-xs text-mute">
          Séance 20 pts · PR 15 · Photo 5 · Mensuration 3 · Streak 2/jour
        </p>
      </div>

      {/* Mes badges */}
      <div>
        <SectionTitle>Mes badges</SectionTitle>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {badges.map((b) => (
            <div
              key={b.code}
              title={b.description}
              className={`flex flex-col items-start gap-1.5 rounded-xl border p-4 ${
                b.earned
                  ? "border-volt/30 bg-[#fff6f0]"
                  : "border-line bg-white opacity-50 grayscale"
              }`}
            >
              <div className="text-2xl">{b.emoji}</div>
              <div className="font-display text-sm leading-tight text-foreground">
                {b.name}
              </div>
              <div className="text-[11px] leading-snug text-mute">
                {b.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Membres */}
        <div>
          <SectionTitle>Membres</SectionTitle>
          <Card className="p-0">
            <div className="divide-y divide-line">
              {members.map((m) => (
                <div key={m.userId} className="flex items-center gap-3 px-4 py-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-raise text-lg">
                    {m.avatarEmoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-foreground">
                      {m.displayName}
                    </div>
                    <div className="text-xs text-mute">
                      {m.totalSessions} séances
                      {m.streak > 0 && ` · streak ${m.streak}j`}
                      {m.goal && ` · ${m.goal}`}
                    </div>
                  </div>
                  <div className="flex gap-1 text-sm">
                    {m.badges.slice(0, 5).map((b) => (
                      <span key={b.code} title={b.name}>
                        {b.emoji}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Feed */}
        <div>
          <SectionTitle>Activité</SectionTitle>
          <Card className="p-0">
            {feed.length === 0 ? (
              <p className="p-5 text-sm text-mute">Rien pour l&apos;instant.</p>
            ) : (
              <div className="max-h-96 divide-y divide-line overflow-y-auto">
                {feed.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <span className="w-14 shrink-0 text-xs font-semibold text-mute">
                      {fmtDate(item.date, { year: undefined })}
                    </span>
                    <span className="min-w-0 flex-1 text-foreground/80">
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
    </div>
  );
}
