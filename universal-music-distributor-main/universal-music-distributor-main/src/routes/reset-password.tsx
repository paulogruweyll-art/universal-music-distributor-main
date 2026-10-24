import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Music2, Lock, Loader2, KeyRound } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Redefinir senha — GruweyllMusic" },
      { name: "description", content: "Defina uma nova senha para a sua conta GruweyllMusic." },
    ],
  }),
  component: ResetPasswordPage,
});

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    async function verifyRecoverySession() {
      const recoveryLink =
        window.location.hash.includes("type=recovery") ||
        new URLSearchParams(window.location.search).has("code");
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error) {
        toast.error(error.message);
        setIsRecovery(false);
      } else {
        setIsRecovery(recoveryLink && Boolean(data.session));
      }
      setChecking(false);
    }
    void verifyRecoverySession();
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (active && event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
        setChecking(false);
      }
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  if (checking) {
    return (
      <CenterShell>
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            A validar o link de recuperação…
          </CardContent>
        </Card>
      </CenterShell>
    );
  }

  if (!isRecovery) {
    return (
      <CenterShell>
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="font-display text-xl font-bold">Link inválido</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Este link de recuperação não é válido ou já expirou.
            </p>
            <Button className="mt-6 gradient-brand text-white" asChild>
              <Link to="/auth">Voltar ao início de sessão</Link>
            </Button>
          </CardContent>
        </Card>
      </CenterShell>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        return;
      }
      setDone(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a senha.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <CenterShell>
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="font-display text-xl font-bold">Senha atualizada</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              A sua nova senha está ativa. Pode entrar normalmente.
            </p>
            <Button className="mt-6 gradient-brand text-white" asChild>
              <Link to="/auth">Entrar</Link>
            </Button>
          </CardContent>
        </Card>
      </CenterShell>
    );
  }

  return (
    <CenterShell>
      <Card>
        <CardContent className="p-8">
          <div className="mb-6 text-center">
            <div className="gradient-brand-soft mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-primary">
              <KeyRound className="h-7 w-7" />
            </div>
            <h1 className="font-display text-2xl font-bold">Definir nova senha</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Escolha uma nova senha para a sua conta.
            </p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pwd">Nova senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="pwd"
                  type="password"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pwd2">Confirmar nova senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="pwd2"
                  type="password"
                  className="pl-9"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={busy}
              className="w-full gradient-brand text-white shadow-glow-sm"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar nova senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </CenterShell>
  );
}

function CenterShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="gradient-brand-soft flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="gradient-brand flex h-10 w-10 items-center justify-center rounded-xl shadow-glow-sm">
            <Music2 className="h-5 w-5 text-white" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            Gruweyll<span className="text-gradient-brand">Music</span>
          </span>
        </Link>
        {children}
      </div>
    </div>
  );
}
