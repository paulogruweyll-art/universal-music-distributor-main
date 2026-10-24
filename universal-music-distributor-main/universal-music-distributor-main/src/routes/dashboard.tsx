import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ArrowDownToLine, Disc3, Loader2, LogOut, Music2, Plus, Radio, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ReleaseDialog } from "@/components/release-dialog";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Painel do artista — GruweyllMusic" },
      { name: "description", content: "Acompanhe os seus lançamentos e royalties." },
    ],
  }),
  component: DashboardPage,
});

type Release = Database["public"]["Tables"]["releases"]["Row"];
type Royalty = Database["public"]["Tables"]["royalty_transactions"]["Row"];
type PayoutRequest = Database["public"]["Tables"]["payout_requests"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const RELEASE_STATUS: Record<string, string> = {
  draft: "Rascunho",
  pending: "Em análise",
  in_review: "Em revisão",
  approved: "Aprovado",
  live: "Publicado",
  rejected: "Precisa de ajustes",
};

function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [releases, setReleases] = useState<Release[]>([]);
  const [royalties, setRoyalties] = useState<Royalty[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [payoutBusy, setPayoutBusy] = useState(false);

  const loadArtistData = useCallback(async (artistId: string) => {
    setLoading(true);
    setLoadError("");
    try {
      const [profileResult, releasesResult, royaltiesResult, payoutResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", artistId).maybeSingle(),
        supabase
          .from("releases")
          .select("*")
          .eq("artist_id", artistId)
          .order("created_at", { ascending: false }),
        supabase
          .from("royalty_transactions")
          .select("*")
          .eq("artist_id", artistId)
          .order("period_end", { ascending: false }),
        supabase
          .from("payout_requests")
          .select("*")
          .eq("artist_id", artistId)
          .order("created_at", { ascending: false }),
      ]);

      const queryError =
        profileResult.error ?? releasesResult.error ?? royaltiesResult.error ?? payoutResult.error;
      if (queryError) throw queryError;
      if (
        releasesResult.data === null ||
        royaltiesResult.data === null ||
        payoutResult.data === null
      ) {
        throw new Error("O serviço devolveu uma resposta incompleta ao carregar o painel.");
      }

      setProfile(profileResult.data);
      setReleases(releasesResult.data);
      setRoyalties(royaltiesResult.data);
      setPayoutRequests(payoutResult.data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível carregar o painel.";
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (!active) return;
        if (sessionError) throw sessionError;
        if (!sessionData.session) {
          await navigate({ to: "/auth" });
          return;
        }

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!userData.user) {
          await navigate({ to: "/auth" });
          return;
        }
        setUserId(userData.user.id);
        setEmail(userData.user.email ?? "");
        const { data: roles, error: rolesError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userData.user.id);
        if (rolesError) throw rolesError;
        if (roles === null) throw new Error("Não foi possível validar as permissões da conta.");
        setIsAdmin(roles.some((role) => role.role === "admin"));
        await loadArtistData(userData.user.id);
      } catch (error) {
        if (!active) return;
        const message =
          error instanceof Error ? error.message : "Não foi possível validar a sessão.";
        setLoadError(message);
        setLoading(false);
        toast.error(message);
      }
    }

    void initialize();
    return () => {
      active = false;
    };
  }, [loadArtistData, navigate]);

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    await navigate({ to: "/" });
  }

  async function requestPayout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const amount = Number(values.get("payout_amount"));
    const currency = String(values.get("payout_currency") ?? "");
    const method = String(values.get("payout_method") ?? "");
    const paymentDetails = String(values.get("payment_details") ?? "").trim();
    if (!Number.isFinite(amount) || amount <= 0 || paymentDetails.length < 5) {
      toast.error("Indique um valor positivo e dados de pagamento válidos.");
      return;
    }
    if (
      !window.confirm(
        "Confirma o pedido? Este envio regista uma solicitação e não transfere dinheiro automaticamente.",
      )
    ) {
      return;
    }
    setPayoutBusy(true);
    const { error } = await supabase.rpc("submit_payout_request", {
      p_amount: amount,
      p_currency: currency,
      p_method: method,
      p_payment_details: paymentDetails,
    });
    setPayoutBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    form.reset();
    toast.success("Pedido de levantamento enviado para análise.");
    await loadArtistData(userId);
  }

  const royaltiesByCurrency = royalties.reduce<Record<string, number>>((totals, royalty) => {
    totals[royalty.currency] = (totals[royalty.currency] ?? 0) + Number(royalty.amount);
    return totals;
  }, {});
  const availableByCurrency = { ...royaltiesByCurrency };
  for (const request of payoutRequests) {
    if (["pending", "processing", "paid"].includes(request.status)) {
      availableByCurrency[request.currency] =
        (availableByCurrency[request.currency] ?? 0) - Number(request.amount);
    }
  }
  const approvedCount = releases.filter((release) => release.status === "approved").length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        A carregar o seu painel…
      </div>
    );
  }

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h1 className="font-display text-xl font-bold">Não foi possível abrir o painel</h1>
            <p className="mt-3 text-sm text-muted-foreground">{loadError}</p>
            <Button className="mt-6 gradient-brand text-white" onClick={() => void signOut()}>
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="gradient-brand flex h-9 w-9 items-center justify-center rounded-xl shadow-glow-sm">
              <Music2 className="h-5 w-5 text-white" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              Gruweyll<span className="text-gradient-brand">Music</span>
            </span>
          </Link>
          <Button variant="ghost" onClick={() => void signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm text-muted-foreground">Painel do artista</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Olá, {profile?.artist_name || profile?.display_name || email || "artista"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              Acompanhe os seus lançamentos e os royalties registados.
            </p>
          </div>
          <ReleaseDialog artistId={userId} onCreated={() => void loadArtistData(userId)} />
        </div>

        <div className="mt-6 rounded-2xl border border-info/30 bg-info/10 px-4 py-3 text-sm leading-relaxed">
          A aprovação nesta plataforma não publica a música nos serviços de streaming. Ainda não
          existe uma integração ativa com um distribuidor autorizado.
        </div>

        <nav aria-label="Áreas do artista" className="mt-5 flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/direitos">Direitos, créditos e documentos</Link>
          </Button>
          {isAdmin && (
            <Button asChild variant="outline" size="sm">
              <Link to="/admin">Administração</Link>
            </Button>
          )}
        </nav>

        <section aria-label="Resumo da conta" className="mt-8 grid gap-4 sm:grid-cols-3">
          <SummaryCard
            icon={<Disc3 className="h-5 w-5" />}
            label="Lançamentos"
            value={String(releases.length)}
          />
          <SummaryCard
            icon={<Radio className="h-5 w-5" />}
            label="Aprovados internamente"
            value={String(approvedCount)}
          />
          <SummaryCard
            icon={<Wallet className="h-5 w-5" />}
            label="Royalties registados"
            value={
              Object.keys(royaltiesByCurrency).length
                ? `${Object.entries(royaltiesByCurrency)
                    .map(([currency, amount]) => `${formatAmount(amount)} ${currency}`)
                    .join(" · ")}`
                : "Ainda sem royalties"
            }
          />
        </section>

        <section className="mt-12">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold">Os seus lançamentos</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                O estado é atualizado pela equipa durante a revisão.
              </p>
            </div>
            <ReleaseDialog
              artistId={userId}
              compact
              onCreated={() => void loadArtistData(userId)}
            />
          </div>

          {releases.length ? (
            <div className="mt-5 grid gap-3">
              {releases.map((release) => (
                <Card key={release.id}>
                  <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="gradient-brand-soft flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-primary">
                        <Disc3 className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">{release.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {release.release_type.toUpperCase()} · {release.genre} ·{" "}
                          {formatDate(release.release_date)}
                        </p>
                        {release.review_notes && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            Nota da revisão: {release.review_notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={release.status === "live" ? "default" : "secondary"}>
                      {RELEASE_STATUS[release.status] ?? release.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="mt-5 border-dashed">
              <CardContent className="flex flex-col items-center px-6 py-12 text-center">
                <div className="gradient-brand-soft flex h-14 w-14 items-center justify-center rounded-2xl text-primary">
                  <Music2 className="h-7 w-7" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">
                  O seu primeiro lançamento começa aqui
                </h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Envie a capa, as faixas e os detalhes do lançamento. A equipa irá rever o material
                  antes de iniciar a distribuição.
                </p>
                <ReleaseDialog
                  artistId={userId}
                  className="mt-5"
                  onCreated={() => void loadArtistData(userId)}
                />
              </CardContent>
            </Card>
          )}
        </section>

        <section className="mt-12">
          <div className="flex items-center gap-2">
            <ArrowDownToLine className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl font-bold">Royalties</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Transações disponibilizadas pela equipa de distribuição.
          </p>
          {royalties.length ? (
            <div className="mt-5 overflow-x-auto rounded-2xl border bg-card">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-b text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Plataforma</th>
                    <th className="px-5 py-3 font-medium">Período</th>
                    <th className="px-5 py-3 text-right font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {royalties.slice(0, 10).map((royalty) => (
                    <tr key={royalty.id}>
                      <td className="px-5 py-4">{royalty.platform}</td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {formatDate(royalty.period_start)} — {formatDate(royalty.period_end)}
                      </td>
                      <td className="px-5 py-4 text-right font-medium">
                        {formatAmount(Number(royalty.amount))} {royalty.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Card className="mt-5 border-dashed">
              <CardContent className="p-6 text-sm text-muted-foreground">
                Ainda não há transações de royalties para mostrar.
              </CardContent>
            </Card>
          )}
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold">Pedidos de levantamento</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            O pedido é verificado pela equipa e não inicia uma transferência automática.
          </p>
          <Card className="mt-5">
            <CardContent className="p-5">
              {Object.keys(availableByCurrency).length ? (
                <>
                  <p className="text-sm">
                    Saldo disponível calculado:{" "}
                    {Object.entries(availableByCurrency)
                      .map(
                        ([currency, amount]) => `${formatAmount(Math.max(0, amount))} ${currency}`,
                      )
                      .join(" · ")}
                  </p>
                  <form onSubmit={requestPayout} className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label htmlFor="payout-amount" className="text-sm font-medium">
                        Valor solicitado
                      </label>
                      <input
                        id="payout-amount"
                        name="payout_amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        max={Math.max(...Object.values(availableByCurrency), 0)}
                        required
                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="payout-currency" className="text-sm font-medium">
                        Moeda
                      </label>
                      <select
                        id="payout-currency"
                        name="payout_currency"
                        required
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        {Object.keys(availableByCurrency).map((currency) => (
                          <option key={currency} value={currency}>
                            {currency} — disponível{" "}
                            {formatAmount(Math.max(0, availableByCurrency[currency] ?? 0))}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="payout-method" className="text-sm font-medium">
                        Método preferido
                      </label>
                      <select
                        id="payout-method"
                        name="payout_method"
                        required
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="bank_transfer">Transferência bancária</option>
                        <option value="mobile_money">Mobile money</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="payout-details" className="text-sm font-medium">
                        Dados necessários para o pagamento
                      </label>
                      <input
                        id="payout-details"
                        name="payment_details"
                        maxLength={1000}
                        required
                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={
                        payoutBusy ||
                        !Object.values(availableByCurrency).some((amount) => amount > 0)
                      }
                      className="sm:col-span-2"
                    >
                      {payoutBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Solicitar levantamento
                    </Button>
                  </form>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Ainda não existem transações de royalties registadas para calcular um saldo.
                </p>
              )}
              {!!payoutRequests.length && (
                <ul className="mt-5 space-y-2 border-t pt-4">
                  {payoutRequests.map((request) => (
                    <li key={request.id} className="flex flex-wrap justify-between gap-2 text-sm">
                      <span>
                        {formatAmount(Number(request.amount))} {request.currency}
                      </span>
                      <span className="text-muted-foreground">
                        {request.status} · {formatDate(request.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-primary">{icon}</span>
          {label}
        </div>
        <p className="mt-3 break-words font-display text-xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function formatDate(value: string) {
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-PT");
}

function formatAmount(value: number) {
  return value.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
