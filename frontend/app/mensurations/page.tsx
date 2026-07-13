"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import {
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  Input,
  Label,
  PageTitle,
  SectionTitle,
  Spinner,
} from "@/components/ui";
import { api, fmtDate, todayIso } from "@/lib/api";
import { MeasurementDto } from "@/lib/types";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function MensurationsPage() {
  return (
    <AppShell>
      <Mensurations />
    </AppShell>
  );
}

const FIELDS = [
  { key: "weightKg", label: "Poids (kg)" },
  { key: "bodyFatPct", label: "Masse grasse (%)" },
  { key: "chestCm", label: "Poitrine (cm)" },
  { key: "waistCm", label: "Taille (cm)" },
  { key: "hipsCm", label: "Hanches (cm)" },
  { key: "bicepCm", label: "Biceps (cm)" },
  { key: "thighCm", label: "Cuisse (cm)" },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];

function Mensurations() {
  const [list, setList] = useState<MeasurementDto[] | null>(null);
  const [date, setDate] = useState(todayIso());
  const [values, setValues] = useState<Record<FieldKey, string>>({
    weightKg: "", bodyFatPct: "", chestCm: "", waistCm: "",
    hipsCm: "", bicepCm: "", thighCm: "",
  });
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api<MeasurementDto[]>("/api/progress/measurements").then(setList);
  }, []);

  useEffect(load, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { date, notes: notes || null };
      for (const f of FIELDS) {
        const v = values[f.key].replace(",", ".");
        body[f.key] = v === "" ? null : Number(v);
      }
      await api("/api/progress/measurements", { method: "POST", body });
      setValues({
        weightKg: "", bodyFatPct: "", chestCm: "", waistCm: "",
        hipsCm: "", bicepCm: "", thighCm: "",
      });
      setNotes("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Supprimer cette mensuration ?")) return;
    await api(`/api/progress/measurements/${id}`, { method: "DELETE" });
    load();
  }

  if (!list) return <Spinner />;

  const weightData = list
    .filter((m) => m.weightKg != null)
    .map((m) => ({ date: fmtDate(m.date, { year: undefined }), poids: m.weightKg }));

  return (
    <div className="flex flex-col gap-8">
      <PageTitle sub="Poids, masse grasse et tours — pour l'évolution que la balance ne raconte pas.">
        Mensurations
      </PageTitle>

      <div>
        <SectionTitle>Nouvelle mesure</SectionTitle>
        <Card>
          <form onSubmit={submit} className="flex flex-col gap-5">
            <ErrorBanner message={error} />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <Label>{f.label}</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={values[f.key]}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [f.key]: e.target.value }))
                    }
                    placeholder="—"
                  />
                </div>
              ))}
              <div className="col-span-2">
                <Label>Notes</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="optionnel"
                />
              </div>
            </div>
            <div>
              <Button type="submit" disabled={busy}>
                {busy ? "…" : "Enregistrer"}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {weightData.length >= 2 && (
        <div>
          <SectionTitle>Évolution du poids</SectionTitle>
          <Card>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData}>
                  <CartesianGrid stroke="#e8e8e8" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b6b6b"
                    tick={{ fontSize: 11, fill: "#6b6b6b" }}
                  />
                  <YAxis
                    stroke="#6b6b6b"
                    tick={{ fontSize: 11, fill: "#6b6b6b" }}
                    domain={["auto", "auto"]}
                    unit=" kg"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #d5d5d5",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="poids"
                    stroke="#eb6800"
                    strokeWidth={3}
                    dot={{ fill: "#eb6800", r: 3, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      <div>
        <SectionTitle>Historique</SectionTitle>
        {list.length === 0 ? (
          <EmptyState title="Aucune mesure">
            Enregistre ta première mesure pour suivre ton évolution.
          </EmptyState>
        ) : (
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line text-[10px] font-extrabold uppercase tracking-wide text-mute">
                  <th className="px-4 py-3">Date</th>
                  {FIELDS.map((f) => (
                    <th key={f.key} className="px-3 py-3">
                      {f.label.split(" ")[0]}
                    </th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {[...list].reverse().map((m) => (
                  <tr key={m.id} className="text-sm">
                    <td className="px-4 py-2.5 font-semibold text-foreground">
                      {fmtDate(m.date)}
                    </td>
                    {FIELDS.map((f) => (
                      <td key={f.key} className="px-3 py-2.5 text-foreground/70">
                        {m[f.key] ?? "—"}
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-right">
                      <button
                        onClick={() => remove(m.id)}
                        className="cursor-pointer text-[#d5d5d5] hover:text-alarm"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
