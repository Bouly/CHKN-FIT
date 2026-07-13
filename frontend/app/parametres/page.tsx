"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import {
  Button,
  Card,
  ErrorBanner,
  Input,
  Label,
  PageTitle,
  SectionTitle,
  Select,
  Spinner,
} from "@/components/ui";
import { api } from "@/lib/api";
import { DAY_OPTIONS, FOCUS_OPTIONS, UserDto } from "@/lib/types";

export default function ParametresPage() {
  return (
    <AppShell>
      <Parametres />
    </AppShell>
  );
}

const AVATARS = ["🐔", "🐓", "🐤", "🐥", "🦅", "🦁", "🐺", "🦍", "🐂", "🦖", "🥊", "🤖"];

function Parametres() {
  const [user, setUser] = useState<UserDto | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState("🐔");
  const [heightCm, setHeightCm] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [goal, setGoal] = useState("");
  const [days, setDays] = useState<string[]>([]);
  const [rotation, setRotation] = useState<string[]>([]);
  const [addFocus, setAddFocus] = useState("PUSH");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [genBusy, setGenBusy] = useState(false);
  const [genMsg, setGenMsg] = useState<string | null>(null);

  useEffect(() => {
    api<UserDto>("/api/auth/me").then((u) => {
      setUser(u);
      setDisplayName(u.displayName);
      setAvatar(u.avatarEmoji);
      setHeightCm(u.heightCm ? String(u.heightCm) : "");
      setBirthDate(u.birthDate ?? "");
      setGoal(u.goal ?? "");
      setDays(u.trainingDays);
      setRotation(u.rotation);
    });
  }, []);

  function toggleDay(day: string) {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function moveRotation(index: number, delta: number) {
    setRotation((prev) => {
      const next = [...prev];
      const j = index + delta;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }

  async function save() {
    if (days.length === 0) {
      setError("Choisis au moins un jour d'entraînement");
      return;
    }
    if (rotation.length === 0) {
      setError("La rotation doit contenir au moins une séance");
      return;
    }
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await api<UserDto>("/api/auth/me", {
        method: "PUT",
        body: {
          displayName,
          avatarEmoji: avatar,
          heightCm: heightCm ? Number(heightCm) : null,
          birthDate: birthDate || null,
          goal: goal || null,
          trainingDays: days,
          rotation,
        },
      });
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function generate(weeks: number) {
    setGenBusy(true);
    setGenMsg(null);
    try {
      const res = await api<{ created: number }>("/api/plan/generate", {
        method: "POST",
        body: { weeks },
      });
      setGenMsg(`${res.created} séance(s) créée(s)`);
    } catch (e) {
      setGenMsg(e instanceof Error ? e.message : "Erreur");
    } finally {
      setGenBusy(false);
    }
  }

  if (!user) return <Spinner />;

  return (
    <div className="flex flex-col gap-8">
      <PageTitle sub={`Connecté — ${user.email}`}>Paramètres</PageTitle>

      <ErrorBanner message={error} />
      {saved && (
        <div className="rounded-xl bg-badge px-4 py-3 text-sm font-bold text-foreground">
          Profil enregistré — le planning futur a été recalibré.
        </div>
      )}

      {/* Profil */}
      <div>
        <SectionTitle>Profil</SectionTitle>
        <Card>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label>Prénom / pseudo</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div>
              <Label>Objectif</Label>
              <Input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Prise de masse, -5 kg, premier muscle-up…"
              />
            </div>
            <div>
              <Label>Taille (cm)</Label>
              <Input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="178"
              />
            </div>
            <div>
              <Label>Date de naissance</Label>
              <Input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Avatar</Label>
              <div className="flex flex-wrap gap-2">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAvatar(a)}
                    className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-xl transition-all ${
                      avatar === a
                        ? "bg-[#fff6f0] ring-2 ring-volt"
                        : "bg-[#f9f9f9] hover:bg-raise"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Jours d'entraînement */}
      <div>
        <SectionTitle>Jours d&apos;entraînement</SectionTitle>
        <Card>
          <p className="mb-4 text-sm text-mute">
            Les séances ne sont planifiées que sur ces jours — les fériés sont
            automatiquement sautés.
          </p>
          <div className="flex flex-wrap gap-2">
            {DAY_OPTIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleDay(d.value)}
                className={`cursor-pointer rounded-full px-5 py-2 text-xs font-extrabold uppercase tracking-wide transition-colors ${
                  days.includes(d.value)
                    ? "bg-volt text-white"
                    : "border border-line bg-white text-mute hover:text-foreground"
                }`}
              >
                {d.short}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Rotation */}
      <div>
        <SectionTitle>Rotation des séances</SectionTitle>
        <Card>
          <p className="mb-4 text-sm text-mute">
            La semaine type de l&apos;équipe : 1er jour d&apos;entraînement = 1er
            élément. Un férié décale la semaine de tout le monde ; un skip perso
            ne décale rien — tu restes calé sur le groupe. Garde les mêmes
            réglages que les collègues pour rester synchro.
          </p>
          <div className="divide-y divide-line rounded-xl border border-line">
            {rotation.map((r, i) => {
              const opt = FOCUS_OPTIONS.find((f) => f.value === r);
              return (
                <div
                  key={`${r}-${i}`}
                  className="flex items-center gap-4 px-4 py-2.5"
                >
                  <span className="w-6 font-display text-base text-[#d5d5d5]">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm font-extrabold uppercase tracking-wide text-foreground">
                    {opt?.label ?? r}
                  </span>
                  <button
                    onClick={() => moveRotation(i, -1)}
                    className="cursor-pointer px-1.5 text-mute hover:text-foreground disabled:opacity-30"
                    disabled={i === 0}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveRotation(i, 1)}
                    className="cursor-pointer px-1.5 text-mute hover:text-foreground disabled:opacity-30"
                    disabled={i === rotation.length - 1}
                  >
                    ↓
                  </button>
                  <button
                    onClick={() =>
                      setRotation((prev) => prev.filter((_, j) => j !== i))
                    }
                    className="cursor-pointer px-1.5 text-[#d5d5d5] hover:text-alarm"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex gap-2">
            <Select value={addFocus} onChange={(e) => setAddFocus(e.target.value)}>
              {FOCUS_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
            <Button
              variant="secondary"
              onClick={() => setRotation((prev) => [...prev, addFocus])}
            >
              Ajouter
            </Button>
          </div>
        </Card>
      </div>

      <div>
        <Button onClick={save} disabled={busy} size="lg">
          {busy ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>

      {/* Génération du planning */}
      <div>
        <SectionTitle>Génération du planning</SectionTitle>
        <Card>
          <p className="mb-4 text-sm text-mute">
            Crée les séances futures selon tes jours et ta rotation — les jours
            déjà occupés sont conservés.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {[2, 4, 8, 12].map((w) => (
              <Button
                key={w}
                variant="secondary"
                onClick={() => generate(w)}
                disabled={genBusy}
              >
                {w} semaines
              </Button>
            ))}
            {genMsg && (
              <span className="text-sm font-bold text-volt">{genMsg}</span>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
