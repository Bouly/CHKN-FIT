"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import {
  Button,
  Card,
  confirmDialog,
  ErrorBanner,
  Input,
  Label,
  PageTitle,
  SectionTitle,
  Select,
  Spinner,
  toast,
} from "@/components/ui";
import { api } from "@/lib/api";
import { ExerciseDto, FOCUS_OPTIONS, TemplateDto } from "@/lib/types";

export default function ProgrammesPage() {
  return (
    <AppShell>
      <Programmes />
    </AppShell>
  );
}

interface RowInput {
  exerciseId: string;
  sets: string;
  targetReps: string;
  restSeconds: string;
}

const MUSCLE_GROUPS = [
  { value: "CHEST", label: "Pectoraux" },
  { value: "BACK", label: "Dos" },
  { value: "SHOULDERS", label: "Épaules" },
  { value: "BICEPS", label: "Biceps" },
  { value: "TRICEPS", label: "Triceps" },
  { value: "LEGS", label: "Jambes" },
  { value: "GLUTES", label: "Fessiers" },
  { value: "CORE", label: "Abdos / Core" },
  { value: "FULL_BODY", label: "Corps complet" },
  { value: "CARDIO", label: "Cardio" },
];

const EXERCISE_TYPES = [
  { value: "STRENGTH", label: "Charge + reps" },
  { value: "BODYWEIGHT", label: "Poids du corps" },
  { value: "CARDIO", label: "Cardio (durée/distance)" },
  { value: "TIMED", label: "Durée (gainage…)" },
];

function Programmes() {
  const [templates, setTemplates] = useState<TemplateDto[] | null>(null);
  const [exercises, setExercises] = useState<ExerciseDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  // nouveau programme
  const [name, setName] = useState("");
  const [focus, setFocus] = useState("CHEST");
  const [description, setDescription] = useState("");
  const [rows, setRows] = useState<RowInput[]>([
    { exerciseId: "", sets: "3", targetReps: "8-12", restSeconds: "90" },
  ]);

  // nouvel exercice
  const [exName, setExName] = useState("");
  const [exGroup, setExGroup] = useState("CHEST");
  const [exType, setExType] = useState("STRENGTH");

  const load = useCallback(() => {
    api<TemplateDto[]>("/api/catalog/templates").then(setTemplates);
    api<ExerciseDto[]>("/api/catalog/exercises").then(setExercises);
  }, []);

  useEffect(load, [load]);

  async function createTemplate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const exos = rows.filter((r) => r.exerciseId);
    if (!name.trim() || exos.length === 0) {
      setError("Nom + au moins un exercice");
      return;
    }
    try {
      await api("/api/catalog/templates", {
        method: "POST",
        body: {
          name: name.trim(),
          focus,
          description: description || null,
          exercises: exos.map((r) => ({
            exerciseId: Number(r.exerciseId),
            sets: Number(r.sets) || 3,
            targetReps: r.targetReps || "8-12",
            restSeconds: Number(r.restSeconds) || 90,
          })),
        },
      });
      setName("");
      setDescription("");
      setRows([{ exerciseId: "", sets: "3", targetReps: "8-12", restSeconds: "90" }]);
      toast("Programme créé — il sera proposé pour ce type de séance");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  async function deleteTemplate(t: TemplateDto) {
    if (
      !(await confirmDialog(`Supprimer le programme « ${t.name} » ?`, {
        confirmLabel: "Supprimer",
        danger: true,
      }))
    )
      return;
    try {
      await api(`/api/catalog/templates/${t.id}`, { method: "DELETE" });
      toast("Programme supprimé");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  async function createExercise(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!exName.trim()) return;
    try {
      await api("/api/catalog/exercises", {
        method: "POST",
        body: { name: exName.trim(), muscleGroup: exGroup, type: exType },
      });
      setExName("");
      toast("Exercice ajouté au catalogue");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  if (!templates) return <Spinner />;

  return (
    <div className="flex flex-col gap-8">
      <PageTitle sub="Les programmes proposés pendant les séances, par type de journée.">
        Programmes
      </PageTitle>

      <ErrorBanner message={error} />

      {/* Liste des programmes */}
      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((t) => (
          <div key={t.id} className="overflow-hidden rounded-xl border border-line bg-panel">
            <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
              <div>
                <span className="font-display text-lg leading-none text-foreground">
                  {t.name}
                </span>
                <span className="ml-2 text-[10px] font-extrabold uppercase tracking-wide text-volt">
                  {t.focusLabel}
                </span>
              </div>
              {!t.builtin && (
                <button
                  onClick={() => deleteTemplate(t)}
                  className="cursor-pointer text-xs font-bold text-[#d5d5d5] hover:text-alarm"
                >
                  Supprimer
                </button>
              )}
            </div>
            {t.description && (
              <p className="border-b border-line px-4 py-2 text-xs text-mute">
                {t.description}
              </p>
            )}
            <div className="divide-y divide-line">
              {t.exercises.map((te) => (
                <div key={te.id} className="flex justify-between px-4 py-2 text-sm">
                  <span className="font-semibold text-foreground">
                    {te.exercise.name}
                  </span>
                  <span className="text-xs text-mute">
                    {te.sets} × {te.targetReps} · {te.restSeconds}s
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Créer un programme */}
      <div>
        <SectionTitle>Créer un programme</SectionTitle>
        <Card>
          <form onSubmit={createTemplate} className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Nom</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Pecs volume, Dos lourd…"
                />
              </div>
              <div>
                <Label>Type de journée</Label>
                <Select value={focus} onChange={(e) => setFocus(e.target.value)}>
                  {FOCUS_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="optionnel"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {rows.map((row, i) => (
                <div key={i} className="flex flex-wrap items-end gap-2">
                  <div className="min-w-52 flex-1">
                    {i === 0 && <Label>Exercice</Label>}
                    <Select
                      value={row.exerciseId}
                      onChange={(e) =>
                        setRows(rows.map((r, j) => (j === i ? { ...r, exerciseId: e.target.value } : r)))
                      }
                    >
                      <option value="">Choisir…</option>
                      {exercises.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.name} — {ex.muscleGroupLabel}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="w-16">
                    {i === 0 && <Label>Séries</Label>}
                    <Input
                      type="number"
                      value={row.sets}
                      onChange={(e) =>
                        setRows(rows.map((r, j) => (j === i ? { ...r, sets: e.target.value } : r)))
                      }
                    />
                  </div>
                  <div className="w-24">
                    {i === 0 && <Label>Objectif</Label>}
                    <Input
                      value={row.targetReps}
                      onChange={(e) =>
                        setRows(rows.map((r, j) => (j === i ? { ...r, targetReps: e.target.value } : r)))
                      }
                      placeholder="8-12"
                    />
                  </div>
                  <div className="w-20">
                    {i === 0 && <Label>Repos s</Label>}
                    <Input
                      type="number"
                      value={row.restSeconds}
                      onChange={(e) =>
                        setRows(rows.map((r, j) => (j === i ? { ...r, restSeconds: e.target.value } : r)))
                      }
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setRows(rows.filter((_, j) => j !== i))}
                    className="cursor-pointer px-2 pb-2.5 text-[#d5d5d5] hover:text-alarm"
                    disabled={rows.length === 1}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setRows([...rows, { exerciseId: "", sets: "3", targetReps: "8-12", restSeconds: "90" }])
                  }
                >
                  + Ajouter une ligne
                </Button>
              </div>
            </div>

            <div>
              <Button type="submit">Créer le programme</Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Créer un exercice */}
      <div>
        <SectionTitle>Ajouter un exercice au catalogue</SectionTitle>
        <Card>
          <form onSubmit={createExercise} className="flex flex-wrap items-end gap-3">
            <div className="w-full max-w-64">
              <Label>Nom</Label>
              <Input
                value={exName}
                onChange={(e) => setExName(e.target.value)}
                placeholder="Développé décliné…"
              />
            </div>
            <div className="w-48">
              <Label>Groupe musculaire</Label>
              <Select value={exGroup} onChange={(e) => setExGroup(e.target.value)}>
                {MUSCLE_GROUPS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-52">
              <Label>Type</Label>
              <Select value={exType} onChange={(e) => setExType(e.target.value)}>
                {EXERCISE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" variant="secondary">
              Ajouter
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
