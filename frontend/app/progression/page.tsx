"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import {
  Card,
  EmptyState,
  PageTitle,
  PrBadge,
  SectionTitle,
  Select,
  Spinner,
} from "@/components/ui";
import { api, fmtDate } from "@/lib/api";
import {
  ExerciseDto,
  ExercisePointDto,
  PrDto,
  VolumePointDto,
} from "@/lib/types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function ProgressionPage() {
  return (
    <AppShell>
      <Progression />
    </AppShell>
  );
}

const AXIS = "#6b6b6b";
const GRID = "#e8e8e8";
const TOOLTIP = {
  backgroundColor: "#ffffff",
  border: "1px solid #d5d5d5",
  borderRadius: 8,
  color: "#2d2d2d",
  fontSize: 12,
};
const TICK = { fontSize: 11, fill: "#6b6b6b" } as const;

function Progression() {
  const [records, setRecords] = useState<PrDto[] | null>(null);
  const [prEvents, setPrEvents] = useState<PrDto[]>([]);
  const [volume, setVolume] = useState<VolumePointDto[]>([]);
  const [exercises, setExercises] = useState<ExerciseDto[]>([]);
  const [selectedEx, setSelectedEx] = useState<string>("");
  const [exData, setExData] = useState<ExercisePointDto[]>([]);

  useEffect(() => {
    api<PrDto[]>("/api/progress/records").then((r) => {
      setRecords(r);
      if (r.length > 0) setSelectedEx(String(r[0].exerciseId));
    });
    api<PrDto[]>("/api/progress/prs").then(setPrEvents).catch(() => {});
    api<VolumePointDto[]>("/api/progress/volume?weeks=12").then(setVolume);
    api<ExerciseDto[]>("/api/catalog/exercises").then(setExercises);
  }, []);

  useEffect(() => {
    if (!selectedEx) return;
    api<ExercisePointDto[]>(`/api/progress/exercise/${selectedEx}`).then(setExData);
  }, [selectedEx]);

  const exercisesWithData = useMemo(() => {
    const ids = new Set(records?.map((r) => r.exerciseId) ?? []);
    return exercises.filter((e) => ids.has(e.id));
  }, [exercises, records]);

  if (records === null) return <Spinner />;

  const chartData = exData.map((p) => ({
    ...p,
    dateLabel: fmtDate(p.date, { year: undefined }),
  }));
  const volumeData = volume.map((v) => ({
    ...v,
    weekLabel: fmtDate(v.weekStart, { year: undefined }),
  }));

  return (
    <div className="flex flex-col gap-8">
      <PageTitle sub="Force estimée (e1RM Epley), volume hebdomadaire et records.">
        Progression
      </PageTitle>

      {records.length === 0 ? (
        <EmptyState title="Pas encore de données">
          Valide ta première séance avec des charges pour voir tes courbes ici.
        </EmptyState>
      ) : (
        <>
          {/* Courbe par exercice */}
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <SectionTitle className="mb-0">Force estimée — e1RM</SectionTitle>
              <div className="w-64">
                <Select
                  value={selectedEx}
                  onChange={(e) => setSelectedEx(e.target.value)}
                >
                  {exercisesWithData.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <Card>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
                    <XAxis dataKey="dateLabel" stroke={AXIS} tick={TICK} />
                    <YAxis
                      stroke={AXIS}
                      tick={TICK}
                      domain={["auto", "auto"]}
                      unit=" kg"
                    />
                    <Tooltip contentStyle={TOOLTIP} />
                    <Line
                      type="monotone"
                      dataKey="bestE1rm"
                      name="e1RM (kg)"
                      stroke="#eb6800"
                      strokeWidth={3}
                      dot={{ fill: "#eb6800", r: 3, strokeWidth: 0 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="topWeight"
                      name="Charge max (kg)"
                      stroke="#592bb2"
                      strokeWidth={1.5}
                      dot={false}
                      strokeDasharray="4 4"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Volume hebdo */}
          <div>
            <SectionTitle>Volume hebdomadaire — kg soulevés</SectionTitle>
            <Card>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeData}>
                    <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
                    <XAxis dataKey="weekLabel" stroke={AXIS} tick={TICK} />
                    <YAxis stroke={AXIS} tick={TICK} />
                    <Tooltip contentStyle={TOOLTIP} cursor={{ fill: "#fbf7f0" }} />
                    <Bar
                      dataKey="volume"
                      name="Volume (kg)"
                      fill="#eb6800"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Records actuels */}
            <div>
              <SectionTitle>Records actuels</SectionTitle>
              <Card className="p-0">
                <div className="divide-y divide-line">
                  {records.map((r) => (
                    <div
                      key={r.exerciseId}
                      className="flex items-baseline justify-between px-4 py-3"
                    >
                      <span className="text-sm font-bold text-foreground">
                        {r.exerciseName}
                      </span>
                      <span className="text-right">
                        <span className="font-display text-2xl leading-none text-volt">
                          {r.e1rm}
                        </span>
                        <span className="ml-1.5 text-[10px] font-semibold uppercase text-mute">
                          kg · {r.weightKg}×{r.reps} ·{" "}
                          {fmtDate(r.date, { year: undefined })}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Historique des PRs */}
            <div>
              <SectionTitle>Historique des records</SectionTitle>
              <Card className="p-0">
                {prEvents.length === 0 ? (
                  <p className="p-5 text-sm text-mute">
                    Un record = battre ton meilleur e1RM sur un exercice.
                  </p>
                ) : (
                  <div className="max-h-96 divide-y divide-line overflow-y-auto">
                    {[...prEvents].reverse().map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-4 py-2.5 text-sm"
                      >
                        <span className="text-foreground/80">
                          <PrBadge className="mr-2" />
                          <span className="font-semibold">
                            {p.exerciseName}
                          </span>{" "}
                          — {p.weightKg} kg × {p.reps}
                        </span>
                        <span className="text-xs text-mute">
                          {fmtDate(p.date)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
