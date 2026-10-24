import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  FileLock2,
  History,
  Loader2,
  Radio,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Administração — GruweyllMusic" },
      { name: "description", content: "Área restrita de revisão e gestão da plataforma." },
    ],
  }),
  component: AdminPage,
});

type Release = Database["public"]["Tables"]["releases"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type CopyrightReport = Omit<
  Database["public"]["Tables"]["copyright_reports"]["Row"],
  "admin_notes"
>;
type AuditEvent = Database["public"]["Tables"]["audit_events"]["Row"];
type CaseNote = Database["public"]["Tables"]["copyright_case_notes"]["Row"];
type CaseContact = Pick<
  Database["public"]["Tables"]["copyright_report_contacts"]["Row"],
  "report_id" | "email"
>;
type RightsDocument = Database["public"]["Tables"]["rights_documents"]["Row"];
type RightsDeclaration = Omit<
  Database["public"]["Tables"]["rights_declarations"]["Row"],
  "admin_notes"
>;
type PayoutRequest = Database["public"]["Tables"]["payout_requests"]["Row"];

const RELEASE_STATUSES: Record<string, string> = {
  draft: "Rascunho",
  pending: "A aguardar revisão",
  in_review: "Em revisão",
  approved: "Aprovado internamente",
  live: "Distribuição externa confirmada",
  rejected: "Requer ajustes",
  removed: "Removido da plataforma interna",
};

function formatAmount(value: number) {
  return new Intl.NumberFormat("pt-PT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function AdminPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminId, setAdminId] = useState("");
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [releases, setReleases] = useState<Release[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [reports, setReports] = useState<CopyrightReport[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [caseContacts, setCaseContacts] = useState<CaseContact[]>([]);
  const [documents, setDocuments] = useState<RightsDocument[]>([]);
  const [declarations, setDeclarations] = useState<RightsDeclaration[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [decisionDrafts, setDecisionDrafts] = useState<Record<string, string>>({});

  const loadAdminData = useCallback(async () => {
    setLoadError("");
    const [
      releaseResult,
      profileResult,
      reportResult,
      contactResult,
      auditResult,
      noteResult,
      documentResult,
      declarationResult,
      payoutResult,
    ] = await Promise.all([
      supabase.from("releases").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100),
      supabase
        .from("copyright_reports")
        .select(
          "id,reporter_id,report_type,against_release_id,parent_report_id,claimant_name,work_description,external_reference,good_faith_attested,evidence_path,status,decision,decided_by,decided_at,created_at",
        )
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("copyright_report_contacts").select("report_id,email"),
      supabase.from("audit_events").select("*").order("created_at", { ascending: false }).limit(50),
      supabase
        .from("copyright_case_notes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("rights_documents")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("rights_declarations")
        .select("id,release_id,artist_id,master_owner,composition_owner,attested,status,created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("payout_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    const failure =
      releaseResult.error ??
      profileResult.error ??
      reportResult.error ??
      contactResult.error ??
      auditResult.error ??
      noteResult.error ??
      documentResult.error ??
      declarationResult.error ??
      payoutResult.error;
    if (failure) throw failure;
    if (
      releaseResult.data === null ||
      profileResult.data === null ||
      reportResult.data === null ||
      contactResult.data === null ||
      auditResult.data === null ||
      noteResult.data === null ||
      documentResult.data === null ||
      declarationResult.data === null ||
      payoutResult.data === null
    ) {
      throw new Error("O serviço devolveu uma resposta incompleta ao carregar a administração.");
    }
    setReleases(releaseResult.data);
    setProfiles(profileResult.data);
    setReports(reportResult.data);
    setCaseContacts(contactResult.data);
    setAudit(auditResult.data);
    setNotes(noteResult.data);
    setDocuments(documentResult.data);
    setDeclarations(declarationResult.data);
    setPayoutRequests(payoutResult.data);
  }, []);

  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
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
        const { data: roles, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userData.user.id);
        if (roleError) throw roleError;
        if (!roles?.some((role) => role.role === "admin")) {
          setIsAdmin(false);
          setChecking(false);
          return;
        }
        if (!active) return;
        setAdminId(userData.user.id);
        setIsAdmin(true);
        await loadAdminData();
      } catch (error) {
        if (!active) return;
        const message =
          error instanceof Error
            ? error.message
            : "Não foi possível validar a sessão administrativa.";
        setLoadError(message);
        toast.error(message);
      } finally {
        if (active) setChecking(false);
      }
    }
    void initialize();
    return () => {
      active = false;
    };
  }, [loadAdminData, navigate]);

  async function refresh() {
    try {
      await loadAdminData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível atualizar a administração.";
      setLoadError(message);
      toast.error(message);
    }
  }

  async function updateReleaseStatus(release: Release, status: string) {
    const reviewNotes = noteDrafts[`release-${release.id}`] ?? release.review_notes ?? "";
    setBusyId(release.id);
    const { data, error } = await supabase
      .from("releases")
      .update({ status, review_notes: reviewNotes.trim() || null })
      .eq("id", release.id)
      .select("id")
      .maybeSingle();
    setBusyId("");
    if (error || !data) {
      toast.error(error?.message ?? "A política de segurança recusou a alteração.");
      return;
    }
    toast.success(`Lançamento atualizado: ${RELEASE_STATUSES[status] ?? status}.`);
    await refresh();
  }

  async function decideReport(report: CopyrightReport, decision: string) {
    const confirmation = window.confirm(
      "Esta decisão fica registada no histórico. A ação afeta apenas o estado interno desta plataforma, não outros serviços de streaming. Continuar?",
    );
    if (!confirmation) return;
    setBusyId(report.id);
    const { error } = await supabase.rpc("decide_copyright_report", {
      p_report_id: report.id,
      p_decision: decision,
    });
    if (error) {
      setBusyId("");
      toast.error(error.message);
      return;
    }
    setBusyId("");
    toast.success("Decisão guardada no processo.");
    await refresh();
  }

  async function addPrivateNote(event: FormEvent<HTMLFormElement>, reportId: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = String(new FormData(form).get("note") ?? "").trim();
    if (!body) {
      toast.error("Escreva uma nota antes de guardar.");
      return;
    }
    setBusyId(reportId);
    const { error } = await supabase.from("copyright_case_notes").insert({
      report_id: reportId,
      author_id: adminId,
      body,
    });
    setBusyId("");
    if (error) {
      toast.error(error.message);
      return;
    }
    form.reset();
    toast.success("Nota privada adicionada ao processo.");
    await refresh();
  }

  async function updateArtistStatus(profile: Profile) {
    const nextStatus = profile.account_status === "active" ? "suspended" : "active";
    if (profile.id === adminId) {
      toast.error("Não pode alterar o estado da sua própria conta administrativa.");
      return;
    }
    if (
      !window.confirm(
        `${nextStatus === "suspended" ? "Suspender" : "Reativar"} a conta de ${profile.artist_name || profile.display_name}?`,
      )
    ) {
      return;
    }
    setBusyId(profile.id);
    const { error } = await supabase
      .from("profiles")
      .update({ account_status: nextStatus })
      .eq("id", profile.id);
    setBusyId("");
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      nextStatus === "suspended" ? "Conta suspensa na plataforma." : "Conta reativada.",
    );
    await refresh();
  }

  async function openEvidence(path: string) {
    const { data, error } = await supabase.storage
      .from("rights-evidence")
      .createSignedUrl(path, 60);
    if (error) {
      toast.error(error.message);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function updatePayoutStatus(request: PayoutRequest, status: string) {
    if (
      status === "paid" &&
      !window.confirm("Confirma que a transferência foi efetivamente concluída?")
    ) {
      return;
    }
    setBusyId(request.id);
    const { error } = await supabase
      .from("payout_requests")
      .update({ status })
      .eq("id", request.id);
    setBusyId("");
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Estado do pedido de levantamento atualizado.");
    await refresh();
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />A validar permissões…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-primary" />
            <h1 className="mt-4 font-display text-xl font-bold">Acesso restrito</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Esta área exige uma permissão administrativa atribuída pelo responsável da base de
              dados.
            </p>
            {loadError && <p className="mt-2 text-sm text-destructive">{loadError}</p>}
            <Button asChild className="mt-5">
              <Link to="/dashboard">Voltar ao painel</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:py-12">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao painel
      </Link>
      <div className="mt-6">
        <p className="text-sm text-muted-foreground">Área protegida por Supabase RLS</p>
        <h1 className="font-display text-3xl font-bold">Administração</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Ações de revisão, estado da conta e decisões de direitos são validadas pela base de dados
          e registadas no histórico.
        </p>
      </div>

      {loadError && (
        <Card className="mt-6 border-destructive/40">
          <CardContent className="p-4 text-sm text-destructive">{loadError}</CardContent>
        </Card>
      )}

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <AdminSummary
          icon={<Radio className="h-5 w-5" />}
          label="Lançamentos"
          value={releases.length}
        />
        <AdminSummary
          icon={<Users className="h-5 w-5" />}
          label="Artistas"
          value={profiles.length}
        />
        <AdminSummary
          icon={<FileLock2 className="h-5 w-5" />}
          label="Processos abertos"
          value={
            reports.filter(
              (report) => !["resolved", "rejected", "withdrawn"].includes(report.status),
            ).length
          }
        />
        <AdminSummary
          icon={<Wallet className="h-5 w-5" />}
          label="Pedidos de levantamento"
          value={payoutRequests.length}
        />
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold">Revisão de lançamentos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Aprovação aqui é interna. A distribuição só é confirmada após integração e referência
          verificável de um parceiro.
        </p>
        <div className="mt-4 grid gap-4">
          {releases.map((release) => (
            <Card key={release.id}>
              <CardContent className="grid gap-4 p-5 lg:grid-cols-[1fr_300px]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{release.title}</h3>
                    <Badge variant="secondary">
                      {RELEASE_STATUSES[release.status] ?? release.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Artista: {artistLabel(profiles, release.artist_id)} ·{" "}
                    {release.release_type.toUpperCase()} · {release.genre}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Data: {formatDate(release.release_date)} · Plataformas escolhidas:{" "}
                    {release.platforms.join(", ")}
                  </p>
                  {release.review_notes && (
                    <p className="mt-2 rounded-lg bg-muted p-3 text-sm">
                      Nota anterior: {release.review_notes}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`review-${release.id}`}>Nota de revisão</Label>
                  <Textarea
                    id={`review-${release.id}`}
                    value={noteDrafts[`release-${release.id}`] ?? release.review_notes ?? ""}
                    onChange={(event) =>
                      setNoteDrafts((current) => ({
                        ...current,
                        [`release-${release.id}`]: event.target.value,
                      }))
                    }
                    maxLength={2000}
                    rows={2}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      disabled={busyId === release.id}
                      onClick={() => void updateReleaseStatus(release, "in_review")}
                    >
                      Em revisão
                    </Button>
                    <Button
                      disabled={busyId === release.id}
                      onClick={() => void updateReleaseStatus(release, "approved")}
                    >
                      Aprovar internamente
                    </Button>
                    <Button
                      variant="destructive"
                      className="col-span-2"
                      disabled={busyId === release.id}
                      onClick={() => void updateReleaseStatus(release, "rejected")}
                    >
                      Pedir ajustes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {!releases.length && <EmptyMessage>Não há lançamentos para rever.</EmptyMessage>}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold">Pedidos de levantamento</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A alteração para «pago» exige confirmação manual de uma transferência efetivamente
          concluída.
        </p>
        <div className="mt-4 grid gap-3">
          {payoutRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                <div>
                  <p className="font-semibold">
                    {formatAmount(Number(request.amount))} {request.currency} ·{" "}
                    {artistLabel(profiles, request.artist_id)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {request.method} · {request.status} · {formatDate(request.created_at)}
                  </p>
                  <p className="mt-2 break-words text-sm">
                    Dados de pagamento: {request.payment_details || "Não indicados"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["processing", "paid", "rejected"] as const).map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={status === "rejected" ? "destructive" : "outline"}
                      disabled={busyId === request.id || request.status === status}
                      onClick={() => void updatePayoutStatus(request, status)}
                    >
                      {status === "processing"
                        ? "Em processamento"
                        : status === "paid"
                          ? "Confirmar pago"
                          : "Rejeitar"}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          {!payoutRequests.length && (
            <EmptyMessage>Não existem pedidos de levantamento.</EmptyMessage>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold">Gestão de artistas</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {profiles.map((profile) => (
            <Card key={profile.id}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {profile.artist_name || profile.display_name || "Artista"}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {profile.country || "País não indicado"}
                  </p>
                  <Badge
                    className="mt-2"
                    variant={profile.account_status === "active" ? "secondary" : "destructive"}
                  >
                    {profile.account_status === "active" ? "Ativa" : "Suspensa"}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === profile.id || profile.id === adminId}
                  onClick={() => void updateArtistStatus(profile)}
                >
                  {profile.account_status === "active" ? "Suspender" : "Reativar"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold">Denúncias e investigação</h2>
        <div className="mt-4 grid gap-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{report.status}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {report.report_type} · {formatDate(report.created_at)} ·{" "}
                        {report.against_release_id
                          ? artistLabel(
                              profiles,
                              releases.find((release) => release.id === report.against_release_id)
                                ?.artist_id ?? "",
                            )
                          : "Conteúdo externo"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium">{report.claimant_name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Contacto privado:{" "}
                      {caseContacts.find((contact) => contact.report_id === report.id)?.email ??
                        "Não indicado"}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {report.work_description}
                    </p>
                    {report.external_reference && (
                      <p className="mt-2 break-all text-sm">
                        Referência: {report.external_reference}
                      </p>
                    )}
                    {report.evidence_path && (
                      <Button
                        variant="link"
                        className="px-0"
                        onClick={() => void openEvidence(report.evidence_path!)}
                      >
                        Abrir prova privada (1 min)
                      </Button>
                    )}
                  </div>
                  <p className="shrink-0 text-sm text-muted-foreground">
                    Decisão: {report.decision ?? "Pendente"}
                  </p>
                </div>

                {!!notes.filter((note) => note.report_id === report.id).length && (
                  <div className="space-y-2 rounded-xl bg-muted p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide">
                      Notas privadas da equipa
                    </p>
                    {notes
                      .filter((note) => note.report_id === report.id)
                      .map((note) => (
                        <p key={note.id} className="whitespace-pre-wrap text-sm">
                          {note.body}{" "}
                          <span className="text-xs text-muted-foreground">
                            · {formatDate(note.created_at)}
                          </span>
                        </p>
                      ))}
                  </div>
                )}

                <form
                  className="grid gap-2 sm:grid-cols-[1fr_auto]"
                  onSubmit={(event) => void addPrivateNote(event, report.id)}
                >
                  <Input
                    name="note"
                    placeholder="Nota interna (visível apenas à administração)"
                    maxLength={5000}
                    required
                  />
                  <Button type="submit" variant="outline" disabled={busyId === report.id}>
                    Guardar nota privada
                  </Button>
                </form>
                <div className="flex flex-wrap items-end gap-2 border-t pt-3">
                  <div className="min-w-52 flex-1 space-y-1.5">
                    <Label htmlFor={`decision-${report.id}`}>Decisão</Label>
                    <Select
                      value={decisionDrafts[report.id] ?? ""}
                      onValueChange={(value) =>
                        setDecisionDrafts((current) => ({ ...current, [report.id]: value }))
                      }
                    >
                      <SelectTrigger id={`decision-${report.id}`}>
                        <SelectValue placeholder="Escolha uma decisão" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="remove">Marcar remoção interna</SelectItem>
                        <SelectItem value="restore">Repor como aprovado internamente</SelectItem>
                        <SelectItem value="no_action">Sem ação interna</SelectItem>
                        <SelectItem
                          value="accept_counter"
                          disabled={report.report_type !== "counter_notice"}
                        >
                          Aceitar contestação
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    disabled={busyId === report.id || !decisionDrafts[report.id]}
                    onClick={() =>
                      void decideReport(report, decisionDrafts[report.id] ?? "no_action")
                    }
                  >
                    Registar decisão
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {!reports.length && <EmptyMessage>Não há processos de direitos registados.</EmptyMessage>}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold">Documentos e declarações de direitos</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {declarations.map((declaration) => (
            <Card key={declaration.id}>
              <CardContent className="space-y-3 p-5">
                <p className="font-medium">
                  {releases.find((release) => release.id === declaration.release_id)?.title ??
                    "Lançamento"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Master: {declaration.master_owner} · Composição: {declaration.composition_owner}
                </p>
                <div className="flex flex-wrap gap-2">
                  {["under_review", "verified", "disputed", "rejected"].map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={declaration.status === status ? "default" : "outline"}
                      disabled={busyId === declaration.id}
                      onClick={() => void updateDeclaration(declaration, status)}
                    >
                      {statusName(status)}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          {documents.map((document) => (
            <Card key={document.id}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{document.document_type}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {artistLabel(profiles, document.artist_id)} ·{" "}
                    {releases.find((release) => release.id === document.release_id)?.title}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void openEvidence(document.object_path)}
                >
                  Abrir privado
                </Button>
              </CardContent>
            </Card>
          ))}
          {!declarations.length && !documents.length && (
            <EmptyMessage>Ainda não há declarações ou documentos submetidos.</EmptyMessage>
          )}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <h2 className="font-display text-2xl font-bold">Histórico de auditoria</h2>
        </div>
        <div className="mt-4 overflow-x-auto rounded-2xl border bg-card">
          {audit.length ? (
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Ação</th>
                  <th className="px-4 py-3 font-medium">Registo</th>
                  <th className="px-4 py-3 font-medium">Responsável</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {audit.map((event) => (
                  <tr key={event.id}>
                    <td className="px-4 py-3">{formatDate(event.created_at)}</td>
                    <td className="px-4 py-3">{event.action}</td>
                    <td className="px-4 py-3">
                      {event.entity_type} · {event.entity_id}
                    </td>
                    <td className="px-4 py-3">{event.actor_id ?? "Sistema"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-5 text-sm text-muted-foreground">Ainda não há eventos de auditoria.</p>
          )}
        </div>
      </section>
    </main>
  );

  async function updateDeclaration(declaration: RightsDeclaration, status: string) {
    setBusyId(declaration.id);
    const { error } = await supabase
      .from("rights_declarations")
      .update({ status })
      .eq("id", declaration.id);
    setBusyId("");
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Estado da declaração atualizado.");
    await refresh();
  }
}

function AdminSummary({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-primary">{icon}</span>
          {label}
        </div>
        <p className="mt-3 font-display text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function EmptyMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">{children}</p>
  );
}

function artistLabel(profiles: Profile[], artistId: string) {
  const profile = profiles.find((item) => item.id === artistId);
  return profile?.artist_name || profile?.display_name || "Artista";
}

function statusName(status: string) {
  return (
    {
      under_review: "Em revisão",
      verified: "Verificada",
      disputed: "Contestada",
      rejected: "Rejeitada",
    }[status] ?? status
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" });
}
