"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import {
  Button,
  confirmDialog,
  ErrorBanner,
  Input,
  Label,
  Modal,
  PrBadge,
  SectionTitle,
  Select,
  Spinner,
  StatusPill,
  toast,
} from "@/components/ui";
import { api, fmtDateLong } from "@/lib/api";
import {
  ExerciseBestDto,
  ExerciseDto,
  FOCUS_OPTIONS,
  SessionDetailDto,
  SetDto,
  TemplateExerciseDto,
} from "@/lib/types";

export default function SessionPage() {
  return (
    <AppShell>
      <SessionView />
    </AppShell>
  );
}

interface SetInput {
  weightKg: string;
  reps: string;
  durationMin: string;
  distanceKm: string;
}

const EMPTY_INPUT: SetInput = { weightKg: "", reps: "", durationMin: "", distanceKm: "" };

function SessionView() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id;

  const [session, setSession] = useState<SessionDetailDto | null>(null);
  const [catalog, setCatalog] = useState<ExerciseDto[]>([]);
  const [addSelect, setAddSelect] = useState("");
  const [inputs, setInputs] = useState<Record<number, SetInput>>({});
  const [error, setError] = useState<string | null>(null);
  const [rest, setRest] = useState<{ total: number; remaining: number; label: string } | null>(null);
  const [prFlash, setPrFlash] = useState<string | null>(null);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [durationMin, setDurationMin] = useState("45");
  const [rpe, setRpe] = useState(7);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const audioCtx = useRef<AudioContext | null>(null);

  const load = useCallback(() => {
    api<SessionDetailDto>(`/api/sessions/${sessionId}`)
      .then(setSession)
      .catch((e) => setError(e.message));
    api<ExerciseDto[]>("/api/catalog/exercises").then(setCatalog).catch(() => {});
  }, [sessionId]);

  useEffect(load, [load]);

  // Pré-remplissage : suggestion de charge (ou dernière perf) + dernières reps
  useEffect(() => {
    if (!session) return;
    setInputs((prev) => {
      const next = { ...prev };
      for (const [exIdStr, b] of Object.entries(session.bests)) {
        const exId = Number(exIdStr);
        if (next[exId]) continue; // ne pas écraser une saisie en cours
        const weight = b.suggestedWeightKg ?? b.lastWeightKg;
        if (weight != null || b.lastReps != null) {
          next[exId] = {
            weightKg: weight != null ? String(weight) : "",
            reps: b.lastReps != null ? String(b.lastReps) : "",
            durationMin: "",
            distanceKm: "",
          };
        }
      }
      return next;
    });
  }, [session]);

  // Wake lock : l'écran reste allumé pendant la séance
  useEffect(() => {
    if (!session || session.status === "COMPLETED" || session.status === "SKIPPED") return;
    let lock: WakeLockSentinel | null = null;
    navigator.wakeLock
      ?.request("screen")
      .then((l) => (lock = l))
      .catch(() => {});
    return () => {
      lock?.release().catch(() => {});
    };
  }, [session]);

  // Décompte du rest timer
  useEffect(() => {
    if (!rest || rest.remaining <= 0) return;
    const t = setTimeout(() => {
      setRest((r) => {
        if (!r) return null;
        const remaining = r.remaining - 1;
        if (remaining <= 0) {
          beep();
          return null;
        }
        return { ...r, remaining };
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [rest]);

  function beep() {
    navigator.vibrate?.(200);
    try {
      audioCtx.current ??= new AudioContext();
      const ctx = audioCtx.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {
      // audio non disponible, tant pis
    }
  }

  function getInput(exId: number): SetInput {
    return inputs[exId] ?? EMPTY_INPUT;
  }

  function setInput(exId: number, patch: Partial<SetInput>) {
    setInputs((prev) => ({ ...prev, [exId]: { ...getInput(exId), ...patch } }));
  }

  async function logSet(ex: ExerciseDto, restSeconds: number) {
    const input = getInput(ex.id);
    const body: Record<string, unknown> = { exerciseId: ex.id };
    if (ex.type === "STRENGTH" || ex.type === "BODYWEIGHT") {
      if (!input.reps) {
        setError("Indique le nombre de reps");
        return;
      }
      body.reps = Number(input.reps);
      if (input.weightKg) body.weightKg = Number(input.weightKg.replace(",", "."));
    } else if (ex.type === "CARDIO") {
      if (!input.durationMin) {
        setError("Indique la durée");
        return;
      }
      body.durationSec = Math.round(Number(input.durationMin.replace(",", ".")) * 60);
      if (input.distanceKm) body.distanceM = Number(input.distanceKm.replace(",", ".")) * 1000;
    } else {
      // TIMED
      if (!input.durationMin) {
        setError("Indique la durée en secondes");
        return;
      }
      body.durationSec = Number(input.durationMin);
    }
    setError(null);
    try {
      const set = await api<SetDto>(`/api/sessions/${sessionId}/sets`, {
        method: "POST",
        body,
      });
      if (set.pr) {
        setPrFlash(
          `Nouveau record — ${ex.name}${set.e1rm ? ` · ${set.e1rm.toFixed(1)} kg e1RM` : ""}`
        );
        setTimeout(() => setPrFlash(null), 4000);
      }
      if (restSeconds > 0) {
        setRest({ total: restSeconds, remaining: restSeconds, label: ex.name });
      }
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }

  async function deleteSet(setId: number) {
    await api(`/api/sessions/${sessionId}/sets/${setId}`, { method: "DELETE" });
    load();
  }

  /** Personnalise la liste d'exos de CETTE séance (persisté côté serveur). */
  async function patchExos(body: {
    hiddenExerciseIds?: number[];
    addedExerciseIds?: number[];
  }) {
    const updated = await api<SessionDetailDto>(`/api/sessions/${sessionId}`, {
      method: "PATCH",
      body,
    });
    setSession(updated);
  }

  async function updateStatus(status: string, extra: Record<string, unknown> = {}) {
    setBusy(true);
    try {
      const updated = await api<SessionDetailDto>(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        body: { status, ...extra },
      });
      setSession(updated);
      setCompleteOpen(false);
      if (status === "COMPLETED") toast("Séance validée — bien joué 💪");
      if (status === "SKIPPED") toast("Séance skippée — le reste de la semaine ne bouge pas");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  if (!session) {
    return error ? <ErrorBanner message={error} /> : <Spinner />;
  }

  const done = session.status === "COMPLETED" || session.status === "SKIPPED";
  const setsByExercise = new Map<number, SetDto[]>();
  for (const s of session.sets) {
    const list = setsByExercise.get(s.exerciseId) ?? [];
    list.push(s);
    setsByExercise.set(s.exerciseId, list);
  }

  // exercices affichés : template (moins ceux retirés) + ajoutés + ceux avec des séries loggées
  const hidden = new Set(session.hiddenExerciseIds ?? []);
  const added = session.addedExerciseIds ?? [];
  const templateExercises: TemplateExerciseDto[] = (
    session.suggestedTemplate?.exercises ?? []
  ).filter(
    (te) =>
      !hidden.has(te.exercise.id) ||
      (setsByExercise.get(te.exercise.id)?.length ?? 0) > 0
  );
  const hiddenCount =
    (session.suggestedTemplate?.exercises.length ?? 0) - templateExercises.length;
  const shownIds = new Set(templateExercises.map((te) => te.exercise.id));
  const extras: ExerciseDto[] = [];
  for (const exId of added) {
    if (shownIds.has(exId)) continue;
    const found = catalog.find((c) => c.id === exId);
    if (found) {
      extras.push(found);
      shownIds.add(exId);
    }
  }
  for (const [exId, sets] of setsByExercise) {
    if (!shownIds.has(exId)) {
      const found = catalog.find((c) => c.id === exId);
      if (found) extras.push(found);
      else if (sets.length > 0) {
        extras.push({
          id: exId,
          name: sets[0].exerciseName,
          muscleGroup: "",
          muscleGroupLabel: "",
          type: sets[0].exerciseType,
          description: null,
          builtin: false,
        });
      }
      shownIds.add(exId);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* En-tête */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-sm text-mute">{fmtDateLong(session.date)}</div>
          <h1 className="mt-1 font-display text-6xl leading-none text-foreground">
            {session.focusLabel}
            <span className="text-volt">.</span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={session.status} />
          {!done && (
            <>
              <div className="w-36" title="Changer la séance (rattrapage d'un groupe manqué, etc.)">
                <Select
                  value={session.focus}
                  onChange={async (e) => {
                    const updated = await api<SessionDetailDto>(
                      `/api/sessions/${sessionId}`,
                      { method: "PATCH", body: { focus: e.target.value } }
                    );
                    setSession(updated);
                  }}
                >
                  {FOCUS_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </Select>
              </div>
              <Button onClick={() => setCompleteOpen(true)} disabled={busy}>
                Valider
              </Button>
              <Button
                variant="secondary"
                onClick={async () => {
                  if (
                    await confirmDialog(
                      "Skipper cette séance ? Le reste de ta semaine ne bouge pas — tu restes calé sur le groupe.",
                      { confirmLabel: "Skipper" }
                    )
                  ) {
                    updateStatus("SKIPPED");
                  }
                }}
                disabled={busy}
              >
                Skip
              </Button>
              {session.sets.length === 0 && (
                <Button
                  variant="danger"
                  disabled={busy}
                  onClick={async () => {
                    if (
                      !(await confirmDialog("Supprimer cette séance ?", {
                        confirmLabel: "Supprimer",
                        danger: true,
                      }))
                    )
                      return;
                    await api(`/api/sessions/${sessionId}`, { method: "DELETE" });
                    window.location.href = "/planning";
                  }}
                >
                  Suppr
                </Button>
              )}
            </>
          )}
          {done && (
            <Button
              variant="secondary"
              onClick={() => updateStatus("IN_PROGRESS")}
              disabled={busy}
            >
              Rouvrir
            </Button>
          )}
        </div>
      </div>

      <ErrorBanner message={error} />

      {prFlash && (
        <div className="pr-slide flex items-center gap-3 rounded-xl bg-badge px-5 py-4">
          <span className="font-display text-2xl leading-none text-foreground">
            PR !
          </span>
          <span className="text-sm font-bold text-foreground">{prFlash}</span>
        </div>
      )}

      {done ? (
        <CompletedSummary session={session} />
      ) : (
        <>
          {session.suggestedTemplate && (
            <p className="text-sm text-mute">
              Programme —{" "}
              <span className="font-bold text-foreground">
                {session.suggestedTemplate.name}
              </span>
            </p>
          )}

          {/* Exercices */}
          <div className="flex flex-col gap-4">
            {templateExercises.map((te) => (
              <ExerciseBlock
                key={te.exercise.id}
                exercise={te.exercise}
                target={`${te.sets} × ${te.targetReps}`}
                restSeconds={te.restSeconds}
                sets={setsByExercise.get(te.exercise.id) ?? []}
                best={session.bests[te.exercise.id]}
                input={getInput(te.exercise.id)}
                setInput={(p) => setInput(te.exercise.id, p)}
                onLog={() => logSet(te.exercise, te.restSeconds)}
                onDeleteSet={deleteSet}
                onRemove={() =>
                  patchExos({
                    hiddenExerciseIds: [
                      ...(session.hiddenExerciseIds ?? []),
                      te.exercise.id,
                    ],
                  })
                }
              />
            ))}
            {extras.map((ex) => (
              <ExerciseBlock
                key={ex.id}
                exercise={ex}
                target={null}
                restSeconds={90}
                sets={setsByExercise.get(ex.id) ?? []}
                best={session.bests[ex.id]}
                input={getInput(ex.id)}
                setInput={(p) => setInput(ex.id, p)}
                onLog={() => logSet(ex, 90)}
                onDeleteSet={deleteSet}
                onRemove={() =>
                  patchExos({
                    addedExerciseIds: (session.addedExerciseIds ?? []).filter(
                      (i) => i !== ex.id
                    ),
                  })
                }
              />
            ))}
          </div>

          {hiddenCount > 0 && (
            <button
              onClick={() => patchExos({ hiddenExerciseIds: [] })}
              className="cursor-pointer self-start text-xs font-bold uppercase tracking-wide text-cta hover:underline"
            >
              ↺ Rétablir {hiddenCount > 1 ? `les ${hiddenCount} exercices retirés` : "l'exercice retiré"}
            </button>
          )}

          {/* Ajouter un exercice hors programme */}
          <div>
            <SectionTitle>Ajouter un exercice</SectionTitle>
            <div className="flex gap-2">
              <Select
                value={addSelect}
                onChange={(e) => setAddSelect(e.target.value)}
              >
                <option value="">Choisir un exercice…</option>
                {catalog
                  .filter((c) => !shownIds.has(c.id))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.muscleGroupLabel}
                    </option>
                  ))}
              </Select>
              <Button
                variant="secondary"
                onClick={async () => {
                  const id = Number(addSelect);
                  if (!id) return;
                  await patchExos({
                    addedExerciseIds: [...(session.addedExerciseIds ?? []), id],
                  });
                  setAddSelect("");
                }}
                disabled={!addSelect}
              >
                Ajouter
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Rest timer — bandeau orange fixé en bas */}
      {rest && (
        <div className="rise-in fixed inset-x-0 bottom-16 z-30 bg-volt md:bottom-0 md:left-60">
          <div
            className="h-1 bg-white/40 transition-all"
            style={{ width: `${100 - (rest.remaining / rest.total) * 100}%` }}
          />
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
            <div className="flex items-baseline gap-4">
              <span className="font-display text-5xl leading-none tabular-nums text-white">
                {Math.floor(rest.remaining / 60)}:
                {String(rest.remaining % 60).padStart(2, "0")}
              </span>
              <span className="hidden text-xs font-extrabold uppercase tracking-wide text-white/80 sm:block">
                Repos — {rest.label}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setRest((r) => (r ? { ...r, remaining: r.remaining + 30 } : r))
                }
                className="cursor-pointer rounded border-2 border-white/60 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-white hover:bg-white/15"
              >
                +30s
              </button>
              <button
                onClick={() => setRest(null)}
                className="cursor-pointer rounded border-2 border-white/60 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-white hover:bg-white/15"
              >
                Passer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de validation */}
      <Modal open={completeOpen} onClose={() => setCompleteOpen(false)}>
        <SectionTitle>Valider la séance</SectionTitle>
            <div className="flex flex-col gap-5">
              <div>
                <Label>Durée (minutes)</Label>
                <Input
                  type="number"
                  value={durationMin}
                  onChange={(e) => setDurationMin(e.target.value)}
                  min={1}
                />
              </div>
              <div>
                <Label>Ressenti — RPE {rpe}/10</Label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={rpe}
                  onChange={(e) => setRpe(Number(e.target.value))}
                  className="w-full accent-[#eb6800]"
                />
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide text-mute">
                  <span>Tranquille</span>
                  <span>À sec</span>
                </div>
              </div>
              <div>
                <Label>Notes — optionnel</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Bonne séance, épaule un peu raide…"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setCompleteOpen(false)}>
                  Annuler
                </Button>
                <Button
                  disabled={busy}
                  onClick={() =>
                    updateStatus("COMPLETED", {
                      durationMin: Number(durationMin) || null,
                      rpe,
                      notes: notes || null,
                    })
                  }
                >
                  {busy ? "…" : "Valider"}
                </Button>
              </div>
            </div>
      </Modal>
    </div>
  );
}

function formatSet(s: SetDto): string {
  const parts: string[] = [];
  if (s.weightKg != null) parts.push(`${s.weightKg} kg`);
  if (s.reps != null) parts.push(`× ${s.reps}`);
  if (s.durationSec != null) {
    parts.push(
      s.exerciseType === "CARDIO"
        ? `${Math.round(s.durationSec / 60)} min`
        : `${s.durationSec} s`
    );
  }
  if (s.distanceM != null) parts.push(`${(s.distanceM / 1000).toFixed(2)} km`);
  return parts.join(" ");
}

function ExerciseBlock({
  exercise,
  target,
  restSeconds,
  sets,
  best,
  input,
  setInput,
  onLog,
  onDeleteSet,
  onRemove,
}: {
  exercise: ExerciseDto;
  target: string | null;
  restSeconds: number;
  sets: SetDto[];
  best: ExerciseBestDto | undefined;
  input: SetInput;
  setInput: (patch: Partial<SetInput>) => void;
  onLog: () => void;
  onDeleteSet: (setId: number) => void;
  onRemove?: () => void;
}) {
  const isStrength = exercise.type === "STRENGTH" || exercise.type === "BODYWEIGHT";
  const isCardio = exercise.type === "CARDIO";

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-panel">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-4 py-3">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-lg leading-none text-foreground">
            {exercise.name}
          </span>
          {target && (
            <span className="text-xs font-semibold text-mute">
              {target} · repos {restSeconds}s
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {best && (best.bestE1rm || best.lastReps != null) && (
            <div className="text-xs font-semibold text-mute">
              {best.bestE1rm && (
                <span className="mr-4">
                  Record <span className="font-extrabold text-volt">{best.bestE1rm} kg</span>
                  {best.bestWeightKg && ` (${best.bestWeightKg}×${best.bestReps})`}
                </span>
              )}
              {best.lastReps != null && (
                <span className="mr-4">
                  Dernier {best.lastWeightKg ? `${best.lastWeightKg} kg × ` : ""}
                  {best.lastReps}
                </span>
              )}
              {best.suggestedWeightKg != null &&
                best.lastWeightKg != null &&
                best.suggestedWeightKg > best.lastWeightKg && (
                  <span className="font-extrabold text-volt">
                    Suggestion {best.suggestedWeightKg} kg ↗
                  </span>
                )}
            </div>
          )}
          {onRemove && sets.length === 0 && (
            <button
              onClick={onRemove}
              title="Retirer cet exercice de la séance"
              className="cursor-pointer rounded px-1.5 py-0.5 text-xs font-bold text-[#d5d5d5] transition-colors hover:bg-red-50 hover:text-alarm"
            >
              ✕ Retirer
            </button>
          )}
        </div>
      </div>

      {sets.length > 0 && (
        <div className="divide-y divide-line border-b border-line">
          {sets.map((s) => (
            <div
              key={s.id}
              className={`flex items-center justify-between px-4 py-2 text-sm ${
                s.pr ? "bg-[#fff6f0]" : ""
              }`}
            >
              <span className="text-foreground/80">
                <span className="mr-3 text-xs font-bold text-mute">
                  #{s.setNumber}
                </span>
                <span className="font-semibold">{formatSet(s)}</span>
                {s.e1rm != null && (
                  <span className="ml-3 text-xs text-mute">
                    e1RM {s.e1rm.toFixed(1)}
                  </span>
                )}
                {s.pr && <PrBadge className="ml-3" />}
              </span>
              <button
                onClick={() => onDeleteSet(s.id)}
                className="cursor-pointer text-[#d5d5d5] hover:text-alarm"
                title="Supprimer la série"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2 px-4 py-3">
        {isStrength && (
          <>
            <div className="w-24">
              <Label>Poids kg</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={input.weightKg}
                onChange={(e) => setInput({ weightKg: e.target.value })}
                placeholder={exercise.type === "BODYWEIGHT" ? "lest" : "60"}
              />
            </div>
            <div className="w-20">
              <Label>Reps</Label>
              <Input
                type="number"
                value={input.reps}
                onChange={(e) => setInput({ reps: e.target.value })}
                placeholder="8"
              />
            </div>
          </>
        )}
        {isCardio && (
          <>
            <div className="w-24">
              <Label>Durée min</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={input.durationMin}
                onChange={(e) => setInput({ durationMin: e.target.value })}
                placeholder="20"
              />
            </div>
            <div className="w-24">
              <Label>Dist. km</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={input.distanceKm}
                onChange={(e) => setInput({ distanceKm: e.target.value })}
                placeholder="4.5"
              />
            </div>
          </>
        )}
        {!isStrength && !isCardio && (
          <div className="w-28">
            <Label>Durée sec</Label>
            <Input
              type="number"
              value={input.durationMin}
              onChange={(e) => setInput({ durationMin: e.target.value })}
              placeholder="45"
            />
          </div>
        )}
        <Button variant="secondary" size="sm" className="py-2.5" onClick={onLog}>
          + Série
        </Button>
      </div>
    </div>
  );
}

function CompletedSummary({ session }: { session: SessionDetailDto }) {
  const byExercise = new Map<string, SetDto[]>();
  for (const s of session.sets) {
    const list = byExercise.get(s.exerciseName) ?? [];
    list.push(s);
    byExercise.set(s.exerciseName, list);
  }
  const prCount = session.sets.filter((s) => s.pr).length;
  const volume = session.sets.reduce(
    (acc, s) => acc + (s.weightKg ?? 0) * (s.reps ?? 0),
    0
  );

  const stats: { label: string; value: string; volt?: boolean }[] = [
    { label: "Séries", value: String(session.sets.length) },
    { label: "Volume", value: `${Math.round(volume)} kg` },
  ];
  if (session.durationMin) stats.push({ label: "Durée", value: `${session.durationMin} min` });
  if (session.rpe) stats.push({ label: "RPE", value: `${session.rpe}/10` });
  if (prCount > 0) stats.push({ label: "Records", value: String(prCount), volt: true });

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {stats.map((st) => (
          <div key={st.label} className="rounded-xl border border-line bg-panel p-4">
            <div className="text-[10px] font-bold uppercase tracking-wide text-mute">
              {st.label}
            </div>
            <div
              className={`mt-1.5 font-display text-3xl leading-none ${
                st.volt ? "text-volt" : "text-foreground"
              }`}
            >
              {st.value}
            </div>
          </div>
        ))}
      </div>

      {session.notes && (
        <p className="rounded-xl bg-raise px-5 py-4 text-sm italic text-foreground/80">
          « {session.notes} »
        </p>
      )}

      {session.status === "COMPLETED" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-sand px-5 py-4">
          <p className="text-sm font-bold text-foreground">
            Photo de progression du jour — même angle, même lumière.
          </p>
          <Link
            href="/physique"
            className="rounded bg-cta px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-white hover:bg-[#3b1480]"
          >
            Ajouter
          </Link>
        </div>
      )}

      {[...byExercise.entries()].map(([name, sets]) => (
        <div key={name} className="overflow-hidden rounded-xl border border-line bg-panel">
          <div className="border-b border-line px-4 py-2.5 font-display text-base leading-none text-foreground">
            {name}
          </div>
          <div className="divide-y divide-line">
            {sets.map((s) => (
              <div key={s.id} className="px-4 py-2 text-sm text-foreground/80">
                <span className="mr-3 text-xs font-bold text-mute">
                  #{s.setNumber}
                </span>
                <span className="font-semibold">{formatSet(s)}</span>
                {s.pr && <PrBadge className="ml-3" />}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
