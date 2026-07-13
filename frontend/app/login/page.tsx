"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, setToken } from "@/lib/api";
import { AuthResponse } from "@/lib/types";
import { Button, ErrorBanner, Input, Label } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      setToken(res.token);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="font-display text-6xl leading-none text-volt">
            CHKN-FIT
          </div>
          <p className="mt-3 font-display text-2xl leading-tight text-foreground">
            Le suivi sportif
            <br />
            de l&apos;équipe.
          </p>
        </div>
        <form
          onSubmit={submit}
          className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-sm"
        >
          <ErrorBanner message={error} />
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="toi@boite.fr"
              required
              autoFocus
            />
          </div>
          <div>
            <Label>Mot de passe</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="mt-1">
            {loading ? "Connexion…" : "Se connecter"}
          </Button>
          <p className="text-sm text-mute">
            Pas encore de compte ?{" "}
            <Link
              href="/register"
              className="font-bold text-cta hover:underline"
            >
              Rejoindre l&apos;équipe
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
