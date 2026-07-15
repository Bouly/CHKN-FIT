"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, setToken } from "@/lib/api";
import { AuthResponse } from "@/lib/types";
import { Button, ErrorBanner, Input, Label } from "@/components/ui";

const AVATARS = ["🐔", "🐓", "🐤", "🐥", "🦅", "🦁", "🐺", "🦍", "🐂", "🦖", "🥊", "🤖"];

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState("🐔");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: {
          email,
          password,
          displayName,
          avatarEmoji: avatar,
          inviteCode: inviteCode || null,
        },
      });
      setToken(res.token);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'inscription");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand p-4">
      <div className="fade-up w-full max-w-sm">
        <div className="mb-8">
          <div className="font-display text-5xl leading-none text-foreground">
            Rejoindre
            <br />
            <span className="text-volt">l&apos;équipe.</span>
          </div>
          <p className="mt-3 text-sm text-mute">
            Ton planning de 4 semaines est généré à l&apos;inscription.
          </p>
        </div>
        <form
          onSubmit={submit}
          className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-sm"
        >
          <ErrorBanner message={error} />
          <div>
            <Label>Prénom / pseudo</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ahmed"
              required
              autoFocus
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="toi@boite.fr"
              required
            />
          </div>
          <div>
            <Label>Mot de passe — 8 caractères min</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <Label>Code d&apos;invitation — si l&apos;équipe en a défini un</Label>
            <Input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="optionnel"
            />
          </div>
          <div>
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
          <Button type="submit" disabled={loading} className="mt-1">
            {loading ? "Création…" : "C'est parti"}
          </Button>
          <p className="text-sm text-mute">
            Déjà membre ?{" "}
            <Link href="/login" className="font-bold text-cta hover:underline">
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
