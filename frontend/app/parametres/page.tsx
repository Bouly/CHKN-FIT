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
import { API_URL, api, getToken } from "@/lib/api";
import {
  DAY_OPTIONS,
  FOCUS_OPTIONS,
  MemberDto,
  TeamSettingsDto,
  UserDto,
} from "@/lib/types";

export default function ParametresPage() {
  return (
    <AppShell>
      <Parametres />
    </AppShell>
  );
}

const AVATARS = ["🐔", "🐓", "🐤", "🐥", "🦅", "🦁", "🐺", "🦍", "🐂", "🦖", "🥊", "🤖"];

/** Éditeur jours + rotation, partagé entre le planning perso et le planning d'équipe. */
function PlanEditor({
  days,
  setDays,
  rotation,
  setRotation,
}: {
  days: string[];
  setDays: (d: string[]) => void;
  rotation: string[];
  setRotation: (r: string[]) => void;
}) {
  const [addFocus, setAddFocus] = useState("CHEST");

  function move(index: number, delta: number) {
    const next = [...rotation];
    const j = index + delta;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setRotation(next);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label>Jours d&apos;entraînement</Label>
        <div className="flex flex-wrap gap-2">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() =>
                setDays(
                  days.includes(d.value)
                    ? days.filter((x) => x !== d.value)
                    : [...days, d.value]
                )
              }
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
      </div>
      <div>
        <Label>Rotation — le 1er élément tombe le 1er jour de la semaine</Label>
        <div className="divide-y divide-line rounded-xl border border-line">
          {rotation.map((r, i) => {
            const opt = FOCUS_OPTIONS.find((f) => f.value === r);
            return (
              <div key={`${r}-${i}`} className="flex items-center gap-4 bg-white px-4 py-2.5">
                <span className="w-6 font-display text-base text-[#d5d5d5]">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-extrabold uppercase tracking-wide text-foreground">
                  {opt?.label ?? r}
                </span>
                <button
                  onClick={() => move(i, -1)}
                  className="cursor-pointer px-1.5 text-mute hover:text-foreground disabled:opacity-30"
                  disabled={i === 0}
                >
                  ↑
                </button>
                <button
                  onClick={() => move(i, 1)}
                  className="cursor-pointer px-1.5 text-mute hover:text-foreground disabled:opacity-30"
                  disabled={i === rotation.length - 1}
                >
                  ↓
                </button>
                <button
                  onClick={() => setRotation(rotation.filter((_, j) => j !== i))}
                  className="cursor-pointer px-1.5 text-[#d5d5d5] hover:text-alarm"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex gap-2">
          <Select value={addFocus} onChange={(e) => setAddFocus(e.target.value)}>
            {FOCUS_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </Select>
          <Button
            variant="secondary"
            onClick={() => setRotation([...rotation, addFocus])}
          >
            Ajouter
          </Button>
        </div>
      </div>
    </div>
  );
}

function Parametres() {
  const [user, setUser] = useState<UserDto | null>(null);
  const [team, setTeam] = useState<TeamSettingsDto | null>(null);
  const [members, setMembers] = useState<MemberDto[]>([]);

  // profil
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState("🐔");
  const [heightCm, setHeightCm] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [goal, setGoal] = useState("");

  // planning perso
  const [days, setDays] = useState<string[]>([]);
  const [rotation, setRotation] = useState<string[]>([]);

  // planning équipe (édition admin)
  const [teamDays, setTeamDays] = useState<string[]>([]);
  const [teamRotation, setTeamRotation] = useState<string[]>([]);

  // mot de passe
  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [genBusy, setGenBusy] = useState(false);
  const [genMsg, setGenMsg] = useState<string | null>(null);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const load = useCallback(() => {
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
    api<TeamSettingsDto>("/api/team/settings").then((t) => {
      setTeam(t);
      setTeamDays(t.trainingDays);
      setTeamRotation(t.rotation);
    });
    api<MemberDto[]>("/api/team/members").then(setMembers).catch(() => {});
  }, []);

  useEffect(load, [load]);

  const flash = toast;

  async function saveProfile() {
    setBusy(true);
    setError(null);
    try {
      const updated = await api<UserDto>("/api/auth/me", {
        method: "PUT",
        body: {
          displayName,
          avatarEmoji: avatar,
          heightCm: heightCm ? Number(heightCm) : null,
          birthDate: birthDate || null,
          goal: goal || null,
        },
      });
      setUser(updated);
      flash("Profil enregistré");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function savePersonalPlan() {
    if (days.length === 0 || rotation.length === 0) {
      setError("Il faut au moins un jour et une séance");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await api<UserDto>("/api/auth/me", {
        method: "PUT",
        body: { trainingDays: days, rotation },
      });
      setUser(updated);
      flash("Planning perso enregistré — tu ne suis plus le planning d'équipe");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function rejoinTeamPlan() {
    setBusy(true);
    try {
      const updated = await api<UserDto>("/api/auth/me", {
        method: "PUT",
        body: { followTeamPlan: true },
      });
      setUser(updated);
      flash("Tu suis à nouveau le planning d'équipe — planning recalibré");
    } finally {
      setBusy(false);
    }
  }

  async function saveTeamPlan() {
    if (teamDays.length === 0 || teamRotation.length === 0) {
      setError("Il faut au moins un jour et une séance");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const t = await api<TeamSettingsDto>("/api/team/settings", {
        method: "PUT",
        body: { trainingDays: teamDays, rotation: teamRotation },
      });
      setTeam(t);
      flash("Planning d'équipe mis à jour — tous les membres qui le suivent sont recalibrés");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg(null);
    try {
      await api("/api/auth/password", {
        method: "POST",
        body: { currentPassword: curPwd, newPassword: newPwd },
      });
      setCurPwd("");
      setNewPwd("");
      setPwdMsg(null);
      toast("Mot de passe changé");
    } catch (err) {
      setPwdMsg(err instanceof Error ? err.message : "Erreur");
    }
  }

  async function resetMemberPassword(m: MemberDto) {
    if (
      !(await confirmDialog(
        `Réinitialiser le mot de passe de ${m.displayName} ? Un mot de passe temporaire sera généré.`,
        { confirmLabel: "Réinitialiser" }
      ))
    )
      return;
    const res = await api<{ tempPassword: string }>(
      `/api/team/members/${m.userId}/reset-password`,
      { method: "POST" }
    );
    setResetMsg(
      `Mot de passe temporaire de ${m.displayName} : ${res.tempPassword} — transmets-le lui, il pourra le changer ici.`
    );
  }

  async function generate(weeks: number) {
    setGenBusy(true);
    setGenMsg(null);
    try {
      const res = await api<{ created: number }>("/api/plan/generate", {
        method: "POST",
        body: { weeks },
      });
      setGenMsg(null);
      toast(`${res.created} séance(s) créée(s)`);
    } catch (e) {
      setGenMsg(e instanceof Error ? e.message : "Erreur");
    } finally {
      setGenBusy(false);
    }
  }

  function exportCsv() {
    window.open(`${API_URL}/api/progress/export?token=${getToken() ?? ""}`, "_blank");
  }

  if (!user || !team) return <Spinner />;
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="flex flex-col gap-8">
      <PageTitle sub={`Connecté — ${user.email}${isAdmin ? " · admin de l'équipe" : ""}`}>
        Paramètres
      </PageTitle>

      <ErrorBanner message={error} />

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
          <div className="mt-5">
            <Button onClick={saveProfile} disabled={busy}>
              {busy ? "…" : "Enregistrer le profil"}
            </Button>
          </div>
        </Card>
      </div>

      {/* Planning d'équipe */}
      <div>
        <SectionTitle>Planning d&apos;équipe</SectionTitle>
        <Card>
          {user.followTeamPlan ? (
            <div className="mb-4 rounded-xl bg-[#fff6f0] px-4 py-3 text-sm font-bold text-foreground">
              ✓ Tu suis le planning d&apos;équipe — même séance que les collègues, tous les jours.
            </div>
          ) : (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-badge px-4 py-3">
              <span className="text-sm font-bold text-foreground">
                Tu as un planning perso : tu n&apos;es plus synchro avec le groupe.
              </span>
              <Button size="sm" onClick={rejoinTeamPlan} disabled={busy}>
                Revenir au planning d&apos;équipe
              </Button>
            </div>
          )}

          {isAdmin ? (
            <>
              <p className="mb-4 text-sm text-mute">
                Tu es admin : modifier ce planning recalibre automatiquement tous
                les membres qui le suivent.
              </p>
              <PlanEditor
                days={teamDays}
                setDays={setTeamDays}
                rotation={teamRotation}
                setRotation={setTeamRotation}
              />
              <div className="mt-5">
                <Button onClick={saveTeamPlan} disabled={busy}>
                  {busy ? "…" : "Enregistrer le planning d'équipe"}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-sm text-mute">
              <span className="font-bold text-foreground">Semaine de l&apos;équipe : </span>
              {team.rotation
                .map((r) => FOCUS_OPTIONS.find((f) => f.value === r)?.label ?? r)
                .join(" → ")}
              <span className="ml-2">
                ({team.trainingDays
                  .map((d) => DAY_OPTIONS.find((x) => x.value === d)?.short ?? d)
                  .join(", ")})
              </span>
              <p className="mt-2">Seul l&apos;admin peut modifier le planning d&apos;équipe.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Planning perso */}
      <div>
        <SectionTitle>Planning perso — optionnel</SectionTitle>
        <Card>
          <p className="mb-4 text-sm text-mute">
            Si tes contraintes diffèrent du groupe (jours, rotation), configure
            ton propre planning ici. Attention : tu ne seras plus synchro avec
            l&apos;équipe.
          </p>
          <PlanEditor
            days={days}
            setDays={setDays}
            rotation={rotation}
            setRotation={setRotation}
          />
          <div className="mt-5">
            <Button variant="secondary" onClick={savePersonalPlan} disabled={busy}>
              {busy ? "…" : "Utiliser ce planning perso"}
            </Button>
          </div>
        </Card>
      </div>

      {/* Génération */}
      <div>
        <SectionTitle>Génération du planning</SectionTitle>
        <Card>
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

      {/* Mot de passe */}
      <div>
        <SectionTitle>Mot de passe</SectionTitle>
        <Card>
          <form onSubmit={changePassword} className="flex flex-wrap items-end gap-3">
            <div className="w-full max-w-56">
              <Label>Mot de passe actuel</Label>
              <Input
                type="password"
                value={curPwd}
                onChange={(e) => setCurPwd(e.target.value)}
                required
              />
            </div>
            <div className="w-full max-w-56">
              <Label>Nouveau — 8 caractères min</Label>
              <Input
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <Button type="submit" variant="secondary">
              Changer
            </Button>
            {pwdMsg && (
              <span className="text-sm font-bold text-foreground">{pwdMsg}</span>
            )}
          </form>
        </Card>
      </div>

      {/* Membres (admin) */}
      {isAdmin && (
        <div>
          <SectionTitle>Membres — admin</SectionTitle>
          <Card className="p-0">
            {resetMsg && (
              <div className="border-b border-line bg-badge px-4 py-3 text-sm font-bold text-foreground">
                {resetMsg}
              </div>
            )}
            <div className="divide-y divide-line">
              {members.map((m) => (
                <div key={m.userId} className="flex items-center gap-3 px-4 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-raise text-base">
                    {m.avatarEmoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-foreground">
                      {m.displayName}
                      {m.role === "ADMIN" && (
                        <span className="ml-2 rounded bg-badge px-1.5 py-px text-[9px] font-extrabold uppercase">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-mute">
                      {m.followTeamPlan ? "suit le planning d'équipe" : "planning perso"}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => resetMemberPassword(m)}
                  >
                    Réinit. mot de passe
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Données */}
      <div>
        <SectionTitle>Mes données</SectionTitle>
        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={exportCsv}>
              Exporter mes séances (CSV)
            </Button>
            <span className="text-xs text-mute">
              Toutes tes séries validées : date, exercice, poids, reps, e1RM.
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
