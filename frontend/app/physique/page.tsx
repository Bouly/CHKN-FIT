"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Select,
  Spinner,
} from "@/components/ui";
import { confirmDialog, toast } from "@/components/ui";
import { api, apiUpload, fmtDate, photoUrl, todayIso } from "@/lib/api";
import { PhotoDto } from "@/lib/types";

export default function PhysiquePage() {
  return (
    <AppShell>
      <Physique />
    </AppShell>
  );
}

const ANGLES = [
  { value: "FRONT", label: "Face" },
  { value: "SIDE", label: "Profil" },
  { value: "BACK", label: "Dos" },
];

function Physique() {
  const [photos, setPhotos] = useState<PhotoDto[] | null>(null);
  const [tab, setTab] = useState("FRONT");
  const [uploadAngle, setUploadAngle] = useState("FRONT");
  const [uploadDate, setUploadDate] = useState(todayIso());
  const [uploadWeight, setUploadWeight] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // comparateur
  const [idA, setIdA] = useState<number | null>(null);
  const [idB, setIdB] = useState<number | null>(null);
  const [overlay, setOverlay] = useState(false);
  const [slider, setSlider] = useState(50);

  const load = useCallback(() => {
    api<PhotoDto[]>("/api/progress/photos").then(setPhotos);
  }, []);

  useEffect(load, [load]);

  const tabPhotos = useMemo(
    () => (photos ?? []).filter((p) => p.angle === tab),
    [photos, tab]
  );

  // sélection par défaut : la plus ancienne vs la plus récente de l'angle courant
  useEffect(() => {
    if (tabPhotos.length >= 2) {
      setIdB(tabPhotos[0].id); // liste triée du plus récent au plus ancien
      setIdA(tabPhotos[tabPhotos.length - 1].id);
    } else {
      setIdA(null);
      setIdB(null);
    }
  }, [tabPhotos]);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Choisis une photo");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("angle", uploadAngle);
      form.append("takenAt", uploadDate);
      if (uploadWeight) form.append("weightKg", uploadWeight.replace(",", "."));
      await apiUpload("/api/progress/photos", form);
      if (fileRef.current) fileRef.current.value = "";
      setUploadWeight("");
      setTab(uploadAngle);
      toast("Photo ajoutée à ta progression");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'upload");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (
      !(await confirmDialog("Supprimer cette photo ? Elle sera définitivement perdue.", {
        confirmLabel: "Supprimer",
        danger: true,
      }))
    )
      return;
    await api(`/api/progress/photos/${id}`, { method: "DELETE" });
    load();
  }

  if (!photos) return <Spinner />;

  const photoA = photos.find((p) => p.id === idA) ?? null;
  const photoB = photos.find((p) => p.id === idB) ?? null;

  return (
    <div className="flex flex-col gap-8">
      <PageTitle sub="Photos privées — visibles par toi seul.">Physique</PageTitle>

      {/* Upload */}
      <div>
        <SectionTitle>Nouvelle photo</SectionTitle>
        <Card>
          <form onSubmit={upload} className="flex flex-col gap-5">
            <ErrorBanner message={error} />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="col-span-2 md:col-span-1">
                <Label>Fichier</Label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  className="w-full rounded border-2 border-[#d5d5d5] bg-white px-3 py-2 text-xs text-foreground/80 file:mr-3 file:rounded file:border-0 file:bg-raise file:px-3 file:py-1 file:text-[10px] file:font-extrabold file:uppercase file:tracking-wide file:text-foreground"
                />
              </div>
              <div>
                <Label>Angle</Label>
                <Select
                  value={uploadAngle}
                  onChange={(e) => setUploadAngle(e.target.value)}
                >
                  {ANGLES.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={uploadDate}
                  onChange={(e) => setUploadDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Poids du jour (kg)</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={uploadWeight}
                  onChange={(e) => setUploadWeight(e.target.value)}
                  placeholder="optionnel"
                />
              </div>
            </div>
            <div>
              <Button type="submit" disabled={busy}>
                {busy ? "Envoi…" : "Uploader"}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Onglets par angle */}
      <div className="flex gap-2">
        {ANGLES.map((a) => (
          <button
            key={a.value}
            onClick={() => setTab(a.value)}
            className={`cursor-pointer rounded-full px-5 py-2 text-xs font-extrabold uppercase tracking-wide transition-colors ${
              tab === a.value
                ? "bg-volt text-white"
                : "bg-white text-mute hover:text-foreground border border-line"
            }`}
          >
            {a.label} · {photos.filter((p) => p.angle === a.value).length}
          </button>
        ))}
      </div>

      {/* Comparateur */}
      {tabPhotos.length >= 2 && photoA && photoB && (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <SectionTitle className="mb-0">Avant / Après</SectionTitle>
            <label className="flex cursor-pointer items-center gap-2 text-xs font-bold uppercase tracking-wide text-mute">
              <input
                type="checkbox"
                checked={overlay}
                onChange={(e) => setOverlay(e.target.checked)}
                className="accent-[#eb6800]"
              />
              Superposition
            </label>
          </div>
          <Card>
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <Label>Avant</Label>
                <Select
                  value={idA ?? ""}
                  onChange={(e) => setIdA(Number(e.target.value))}
                >
                  {tabPhotos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {fmtDate(p.takenAt)}
                      {p.weightKg ? ` — ${p.weightKg} kg` : ""}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Après</Label>
                <Select
                  value={idB ?? ""}
                  onChange={(e) => setIdB(Number(e.target.value))}
                >
                  {tabPhotos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {fmtDate(p.takenAt)}
                      {p.weightKg ? ` — ${p.weightKg} kg` : ""}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {overlay ? (
              <div className="mx-auto max-w-md">
                <div className="relative aspect-3/4 overflow-hidden rounded-xl bg-raise">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl(photoA.id)}
                    alt="Avant"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - slider}% 0 0)` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoUrl(photoB.id)}
                      alt="Après"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div
                    className="absolute inset-y-0 w-0.5 bg-volt"
                    style={{ left: `${slider}%` }}
                  />
                  <div className="absolute left-2 top-2 rounded bg-volt px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-white">
                    Après · {fmtDate(photoB.takenAt)}
                  </div>
                  <div className="absolute right-2 top-2 rounded bg-white/90 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-foreground">
                    Avant · {fmtDate(photoA.takenAt)}
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={slider}
                  onChange={(e) => setSlider(Number(e.target.value))}
                  className="mt-4 w-full accent-[#eb6800]"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {[photoA, photoB].map((p, i) => (
                  <div key={`${p.id}-${i}`}>
                    <div className="aspect-3/4 overflow-hidden rounded-xl bg-raise">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoUrl(p.id)}
                        alt={i === 0 ? "Avant" : "Après"}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="mt-2 text-xs font-bold uppercase tracking-wide text-mute">
                      {i === 0 ? "Avant" : "Après"} · {fmtDate(p.takenAt)}
                      {p.weightKg ? ` · ${p.weightKg} kg` : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Galerie */}
      <div>
        <SectionTitle>
          Galerie — {ANGLES.find((a) => a.value === tab)?.label}
        </SectionTitle>
        {tabPhotos.length === 0 ? (
          <EmptyState title="Aucune photo sous cet angle">
            Prends la photo après la séance, toujours au même endroit et à la
            même heure : la comparaison sera honnête.
          </EmptyState>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {tabPhotos.map((p) => (
              <div key={p.id} className="group relative">
                <div className="aspect-3/4 overflow-hidden rounded-xl bg-raise">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl(p.id)}
                    alt={fmtDate(p.takenAt)}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                </div>
                <div className="mt-1.5 text-xs font-semibold text-mute">
                  {fmtDate(p.takenAt)}
                  {p.weightKg ? ` · ${p.weightKg} kg` : ""}
                </div>
                <button
                  onClick={() => remove(p.id)}
                  className="absolute right-2 top-2 hidden cursor-pointer rounded bg-white/90 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-alarm group-hover:block"
                >
                  Suppr
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
