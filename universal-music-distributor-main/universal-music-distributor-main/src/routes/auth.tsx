import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import heroImg from "@/assets/hero.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Globe,
  Headphones,
  Loader2,
  Lock,
  LogIn,
  Mail,
  Music2,
  ShieldCheck,
  User,
} from "lucide-react";
import "@lovable.dev/cloud-auth-js/styles.css";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — GruweyllMusic" },
      {
        name: "description",
        content: "Acesse o seu painel de artista ou crie a sua conta GruweyllMusic.",
      },
      { property: "og:title", content: "Entrar ou criar conta — GruweyllMusic" },
      {
        property: "og:description",
        content: "Acesse o seu painel de artista ou crie a sua conta GruweyllMusic.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [busy, setBusy] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [artistName, setArtistName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [country, setCountry] = useState("");

  useEffect(() => {
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        if (active && data.session) void navigate({ to: "/dashboard" });
      })
      .catch((error: unknown) => {
        if (active) toast.error(error instanceof Error ? error.message : "Não foi possível validar a sessão.");
      });
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (active && event === "SIGNED_IN") void navigate({ to: "/dashboard" });
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [navigate]);

  async function social(provider: "google" | "lovable") {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: `${window.location.origin}/auth`,
      });
      if (result.error) toast.error(result.error.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível iniciar o acesso.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signup" && !artistName.trim()) {
      toast.error("Indique o nome artístico para criar a conta.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { artist_name: artistName, display_name: displayName, country },
            emailRedirectTo: `${window.location.origin}/auth`,
          },
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        if (data.session) {
          navigate({ to: "/dashboard" });
        } else {
          setConfirmSent(true);
        }
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error(error.message);
          return;
        }
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Enviamos um link de recuperação para o seu email.");
        setMode("signin");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "O serviço de autenticação não respondeu.");
    } finally {
      setBusy(false);
    }
  }

  if (confirmSent) {
    return (
      <AuthShell>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#f5c542]/40 bg-[#f5c542]/10 text-[#f5c542]">
            <Mail className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Confirme o seu email</h1>
          <p className="mt-3 text-sm text-white/65">
            Enviámos um link de confirmação para <strong>{email}</strong>. Abra o link para
            ativar a sua conta de artista.
          </p>
          <Button
            variant="outline"
            className="mt-6 border-[#f5c542] bg-transparent text-[#f5c542] hover:bg-[#f5c542]/10 hover:text-[#ffdc73]"
            onClick={() => setMode("signin")}
          >
            Voltar ao início de sessão
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="text-center">
        <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-[#f5c542]">
          {mode === "signup"
            ? "COMECE A SUA JORNADA"
            : mode === "forgot"
              ? "RECUPERAÇÃO DE ACESSO"
              : "BEM-VINDO(A) À"}
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-white">
          {mode === "signup"
            ? "Crie a sua conta"
            : mode === "forgot"
              ? "Recuperar a senha"
              : "GruweyllMusic"}
        </h1>
        <p className="mt-1 text-sm tracking-[0.28em] text-white/55">
          {mode === "signin" && "D I S T R I B U T I O N"}
        </p>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-white/65">
          {mode === "signup"
            ? "Distribua a sua música para mais de 40 plataformas."
            : mode === "forgot"
              ? "Enviamos um link de recuperação para o seu email."
              : "Faça o login para acessar sua conta e gerenciar suas músicas."}
        </p>
      </div>

      {mode !== "forgot" && (
        <>
          <div className="grid gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => social("google")}
              className="flex min-h-12 items-center justify-center gap-3 rounded-full border border-white/15 bg-[#091116] px-4 py-3 text-sm font-medium text-white transition-colors hover:border-[#f5c542]/60 hover:bg-white/[0.04] disabled:opacity-60"
            >
              <GoogleIcon />
              Entrar com Google
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => social("lovable")}
              className="lovable-auth-button lovable-auth-button--dark lovable-auth-button--full-width !min-h-12 !rounded-full"
            >
              Entrar com Lovable
            </button>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/55">
            <span className="h-px flex-1 bg-white/20" />
            ou continue com email
            <span className="h-px flex-1 bg-white/20" />
          </div>
        </>
      )}

      <form onSubmit={submit} className="space-y-4">
        {mode === "signup" && (
          <>
            <Field
              id="artist"
              label="Nome artístico"
              icon={<User className="h-4 w-4" />}
              value={artistName}
              onValueChange={setArtistName}
              placeholder="Ex.: DJ Gruweyll"
              required
            />
            <Field
              id="display"
              label="Nome completo"
              icon={<User className="h-4 w-4" />}
              value={displayName}
              onValueChange={setDisplayName}
              placeholder="Paulo Gruweyll"
            />
            <Field
              id="country"
              label="País"
              icon={<Globe className="h-4 w-4" />}
              value={country}
              onValueChange={setCountry}
              placeholder="Angola"
            />
          </>
        )}
        <Field
          id="email"
          label="Email"
          type="email"
          icon={<Mail className="h-4 w-4" />}
          value={email}
          onValueChange={setEmail}
          visuallyHiddenLabel={mode !== "signup"}
          placeholder="E-mail"
          required
        />
        {mode !== "forgot" && (
          <Field
            id="password"
            label="Senha"
            type={showPassword ? "text" : "password"}
            icon={<Lock className="h-4 w-4" />}
            value={password}
            onValueChange={setPassword}
            visuallyHiddenLabel={mode !== "signup"}
            placeholder="••••••••"
            required
            minLength={6}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={showPassword}
                className="text-white/55 transition-colors hover:text-[#f5c542]"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            }
          />
        )}
        {mode === "signin" && (
          <div className="flex justify-end">
            <button
              type="button"
              className="text-sm font-medium text-[#f5c542] transition-colors hover:text-[#ffdc73]"
              onClick={() => setMode("forgot")}
            >
              Esqueceu sua senha?
            </button>
          </div>
        )}
        <Button
          type="submit"
          disabled={busy}
          className="h-14 w-full rounded-full bg-gradient-to-r from-[#f5c542] to-[#eaa91c] text-base font-bold text-[#171205] shadow-[0_8px_30px_-12px_rgba(245,197,66,0.75)] transition hover:brightness-110"
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : mode === "signin" ? (
            <LogIn className="h-5 w-5" />
          ) : null}
          {mode === "signup"
            ? "Criar conta"
            : mode === "forgot"
              ? "Enviar link de recuperação"
              : "Entrar"}
        </Button>
      </form>

      <div className="space-y-3 text-center text-sm text-white/65">
        {mode === "signin" && (
          <div className="pt-2">
            <p className="mb-3">Ainda não tem uma conta?</p>
            <button
              type="button"
              className="min-h-12 w-full rounded-full border border-[#f5c542] px-5 font-semibold text-[#f5c542] transition-colors hover:bg-[#f5c542]/10"
              onClick={() => setMode("signup")}
            >
              Criar conta
            </button>
          </div>
        )}
        {mode === "signup" && (
          <p>
            Já tem conta?{" "}
            <button
              type="button"
              className="font-semibold text-[#f5c542] hover:underline"
              onClick={() => setMode("signin")}
            >
              Entrar
            </button>
          </p>
        )}
        {mode === "forgot" && (
          <p>
            <button
              type="button"
              className="font-medium text-[#f5c542] hover:underline"
              onClick={() => setMode("signin")}
            >
              Voltar ao início de sessão
            </button>
          </p>
        )}
      </div>
    </AuthShell>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#03080b] px-0 text-white sm:px-5 sm:py-5 lg:px-8 lg:py-8">
      <section className="mx-auto grid min-h-[calc(100svh-2.5rem)] w-full max-w-[1440px] overflow-hidden border-y border-[#d3a92f]/50 bg-[#050b0f] shadow-[0_24px_90px_-45px_rgba(245,197,66,0.35)] sm:min-h-[calc(100svh-2.5rem)] sm:rounded-[2rem] sm:border lg:grid-cols-[1fr_1fr]">
        <div
          className="relative hidden min-h-[680px] grid-cols-1 content-between overflow-hidden bg-[#080a08] p-12 lg:grid xl:p-16"
        >
          <div
            className="absolute inset-0 bg-cover bg-center opacity-55 grayscale sepia"
            style={{ backgroundImage: `url("${heroImg}")` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#03080b]/35 via-[#03080b]/45 to-[#03080b]/95" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(245,197,66,0.2),transparent_55%)]" />
          <Link to="/" className="relative z-10 inline-flex items-center gap-3 self-start">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#f5c542]/50 bg-black/40 text-[#f5c542] shadow-[0_0_35px_-12px_rgba(245,197,66,0.8)]">
              <Music2 className="h-6 w-6" />
            </span>
            <span className="font-display text-2xl font-bold tracking-tight">
              Gruweyll<span className="text-[#f5c542]">Music</span>
              <span className="mt-0.5 block text-xs font-medium tracking-[0.35em] text-white/65">
                D I S T R I B U T I O N
              </span>
            </span>
          </Link>

          <div className="relative z-10 max-w-lg pb-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-[#f5c542]">
              A sua música, sem fronteiras
            </p>
            <h2 className="font-display text-4xl font-bold leading-tight xl:text-5xl">
              Sua música em todas as plataformas do mundo.
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/70">
              Gerencie seus lançamentos e leve seu som para ouvintes em todo o mundo.
            </p>
            <div className="mt-8 flex flex-wrap gap-2 text-xs font-medium text-white/75">
              {["Spotify", "Apple Music", "YouTube", "Amazon Music", "Deezer"].map(
                (platform) => (
                  <span
                    key={platform}
                    className="rounded-full border border-white/20 bg-black/35 px-3 py-2"
                  >
                    {platform}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>

        <div className="flex min-h-full flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 xl:px-20">
          <Link to="/" className="mb-8 inline-flex items-center justify-center gap-2 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#f5c542]/50 text-[#f5c542]">
              <Music2 className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-bold">
              Gruweyll<span className="text-[#f5c542]">Music</span>
            </span>
          </Link>
          <div className="mx-auto w-full max-w-md space-y-6">{children}</div>
          <Link
            to="/"
            className="mt-8 flex items-center justify-center gap-1.5 text-sm text-white/50 transition-colors hover:text-[#f5c542]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao site
          </Link>
        </div>
      </section>

      <footer className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-4 px-6 py-6 text-white/75 sm:grid-cols-3 sm:px-10 lg:px-14">
        <TrustItem
          icon={<ShieldCheck />}
          title="Segurança em primeiro lugar"
          detail="Seus dados estão protegidos"
        />
        <TrustItem
          icon={<Headphones />}
          title="Suporte especializado"
          detail="Estamos sempre com você"
        />
        <TrustItem
          icon={<Globe />}
          title="Distribuição global"
          detail="Sua música sem fronteiras"
        />
      </footer>
    </main>
  );
}

function TrustItem({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-3 sm:justify-center">
      <span className="text-[#f5c542] [&_svg]:h-6 [&_svg]:w-6">{icon}</span>
      <span>
        <span className="block text-sm font-medium text-white">{title}</span>
        <span className="mt-0.5 block text-xs text-white/50">{detail}</span>
      </span>
    </div>
  );
}

function Field({
  id,
  label,
  icon,
  trailing,
  visuallyHiddenLabel = false,
  onValueChange,
  ...props
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  trailing?: React.ReactNode;
  visuallyHiddenLabel?: boolean;
  onValueChange: (value: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  return (
    <div>
      <Label
        htmlFor={id}
        className={
          visuallyHiddenLabel ? "sr-only" : "mb-1.5 block text-sm font-medium text-white/80"
        }
      >
        {label}
      </Label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">
          {icon}
        </span>
        <Input
          id={id}
          className="h-14 rounded-xl border-white/20 bg-[#091116] pl-12 pr-12 text-white placeholder:text-white/45 focus-visible:border-[#f5c542] focus-visible:ring-[#f5c542]/30"
          {...props}
          onChange={(event) => onValueChange(event.target.value)}
        />
        {trailing && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2">
            {trailing}
          </span>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 5.04c1.62 0 3.06.56 4.2 1.64l3.12-3.12C17.46 1.8 14.96.75 12 .75 7.4.75 3.44 3.4 1.5 7.3l3.64 2.83C6 7.14 8.75 5.04 12 5.04z"
      />
      <path
        fill="#4285F4"
        d="M23.25 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.32a5.4 5.4 0 0 1-2.35 3.55l3.62 2.81c2.12-1.96 3.66-4.85 3.66-8.6z"
      />
      <path
        fill="#FBBC05"
        d="M5.15 14.07a7.2 7.2 0 0 1 0-4.14L1.5 7.1a11.25 11.25 0 0 0 0 9.8l3.65-2.83z"
      />
      <path
        fill="#34A853"
        d="M12 23.25c2.96 0 5.46-.98 7.28-2.65l-3.62-2.81c-.98.66-2.23 1.06-3.66 1.06-3.25 0-6-2.1-6.86-5.09l-3.64 2.83c1.94 3.9 5.9 6.66 10.5 6.66z"
      />
    </svg>
  );
}
