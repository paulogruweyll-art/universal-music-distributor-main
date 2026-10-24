import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, FileLock2, FileText, Loader2, ShieldAlert, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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

export const Route = createFileRoute("/direitos")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Direitos e documentos — GruweyllMusic" },
      {
        name: "description",
        content: "Declare titularidade, guarde documentos e comunique disputas.",
      },
    ],
  }),
  component: RightsPage,
});

type Release = Database["public"]["Tables"]["releases"]["Row"];
type RightsDeclaration = Database["public"]["Tables"]["rights_declarations"]["Row"];
type RightsDocument = Database["public"]["Tables"]["rights_documents"]["Row"];
type CopyrightReport = Omit<
  Database["public"]["Tables"]["copyright_reports"]["Row"],
  "admin_notes"
>;

const REPORT_STATUS: Record<string, string> = {
  submitted: "Recebida",
  investigating: "Em investigação",
  action_taken: "Ação interna tomada",
  counter_received: "Contestação recebida",
  resolved: "Resolvida",
  rejected: "Não aceite",
  withdrawn: "Retirada",
  appealed: "Contestada",
};

function RightsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [artistName, setArtistName] = useState("");
  const [releases, setReleases] = useState<Release[]>([]);
  const [declarations, setDeclarations] = useState<RightsDeclaration[]>([]);
  const [documents, setDocuments] = useState<RightsDocument[]>([]);
  const [reports, setReports] = useState<CopyrightReport[]>([]);
  const [busy, setBusy] = useState(false);
  const [reportType, setReportType] = useState("infringement");

  const loadData = useCallback(async (artistId: string) => {
    setLoadError("");
    const [releaseResult, declarationResult, documentResult, reportResult, profileResult] =
      await Promise.all([
        supabase
          .from("releases")
          .select("*")
          .eq("artist_id", artistId)
          .order("created_at", { ascending: false }),
        supabase
          .from("rights_declarations")
          .select("*")
          .eq("artist_id", artistId)
          .order("created_at", { ascending: false }),
        supabase
          .from("rights_documents")
          .select("*")
          .eq("artist_id", artistId)
          .order("created_at", { ascending: false }),
        supabase
          .from("copyright_reports")
          .select(
            "id,reporter_id,report_type,against_release_id,parent_report_id,claimant_name,work_description,external_reference,good_faith_attested,evidence_path,status,decision,decided_by,decided_at,created_at",
          )
          .order("created_at", { ascending: false }),
        supabase.from("profiles").select("artist_name").eq("id", artistId).maybeSingle(),
      ]);
    const resultError =
      releaseResult.error ??
      declarationResult.error ??
      documentResult.error ??
      reportResult.error ??
      profileResult.error;
    if (resultError) throw resultError;
    if (
      releaseResult.data === null ||
      declarationResult.data === null ||
      documentResult.data === null ||
      reportResult.data === null
    ) {
      throw new Error("O serviço devolveu uma resposta incompleta.");
    }
    setReleases(releaseResult.data);
    setDeclarations(declarationResult.data);
    setDocuments(documentResult.data);
    setReports(reportResult.data);
    setArtistName(profileResult.data?.artist_name ?? "");
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
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!data.user) {
          await navigate({ to: "/auth" });
          return;
        }
        if (!active) return;
        setUserId(data.user.id);
        setEmail(data.user.email ?? "");
        await loadData(data.user.id);
      } catch (error) {
        if (!active) return;
        const message =
          error instanceof Error ? error.message : "Não foi possível carregar a área de direitos.";
        setLoadError(message);
        toast.error(message);
      } finally {
        if (active) setLoading(false);
      }
    }
    void initialize();
    return () => {
      active = false;
    };
  }, [loadData, navigate]);

  const counterCandidates = useMemo(
    () =>
      reports.filter(
        (report) =>
          report.report_type === "infringement" &&
          ["action_taken", "investigating"].includes(report.status) &&
          releases.some((release) => release.id === report.against_release_id),
      ),
    [reports, releases],
  );
  const appealCandidates = reports.filter(
    (report) =>
      report.reporter_id === userId &&
      ["resolved", "rejected"].includes(report.status) &&
      report.report_type !== "appeal",
  );

  async function refresh() {
    try {
      await loadData(userId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível atualizar os dados.";
      setLoadError(message);
      toast.error(message);
    }
  }

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const releaseId = String(form.get("release_id") ?? "");
    const documentType = String(form.get("document_type") ?? "");
    const file = form.get("document_file");
    if (!(file instanceof File) || !file.size) {
      toast.error("Selecione um documento para enviar.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("O documento deve ter no máximo 20 MB.");
      return;
    }
    if (!["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("O formato permitido é PDF, JPG, PNG ou WebP.");
      return;
    }
    setBusy(true);
    const documentId = crypto.randomUUID();
    const objectPath = `${userId}/${releaseId}/${documentId}${fileExtension(file.name)}`;
    try {
      const uploaded = await supabase.storage
        .from("rights-evidence")
        .upload(objectPath, file, { contentType: file.type, upsert: false });
      if (uploaded.error) throw uploaded.error;
      const inserted = await supabase.from("rights_documents").insert({
        id: documentId,
        release_id: releaseId,
        artist_id: userId,
        document_type: documentType,
        object_path: objectPath,
      });
      if (inserted.error) {
        const cleanup = await supabase.storage.from("rights-evidence").remove([objectPath]);
        throw new Error(
          cleanup.error
            ? `${inserted.error.message}. A limpeza do ficheiro falhou: ${cleanup.error.message}`
            : inserted.error.message,
        );
      }
      toast.success("Documento privado associado ao lançamento.");
      formElement.reset();
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível guardar o documento.");
    } finally {
      setBusy(false);
    }
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const chosenParentId = String(form.get("parent_report_id") ?? "");
    const parent =
      reportType === "counter_notice"
        ? counterCandidates.find((report) => report.id === chosenParentId)
        : reportType === "appeal"
          ? appealCandidates.find((report) => report.id === chosenParentId)
          : undefined;
    if (reportType !== "infringement" && !parent) {
      toast.error("Selecione um processo elegível para contestar.");
      return;
    }
    if (form.get("good_faith_attested") !== "on") {
      toast.error("Confirme a declaração de boa-fé antes de enviar.");
      return;
    }
    const evidence = form.get("evidence_file");
    if (evidence instanceof File && evidence.size > 20 * 1024 * 1024) {
      toast.error("A prova deve ter no máximo 20 MB.");
      return;
    }
    setBusy(true);
    const reportId = crypto.randomUUID();
    let evidencePath: string | null = null;
    try {
      if (evidence instanceof File && evidence.size > 0) {
        if (!["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(evidence.type)) {
          throw new Error("A prova deve ser PDF, JPG, PNG ou WebP.");
        }
        evidencePath = `${userId}/${reportId}/evidence${fileExtension(evidence.name)}`;
        const upload = await supabase.storage
          .from("rights-evidence")
          .upload(evidencePath, evidence, { contentType: evidence.type, upsert: false });
        if (upload.error) throw upload.error;
      }

      const { error: submitError } = await supabase.rpc("submit_copyright_report", {
        p_report_id: reportId,
        p_report_type: reportType,
        p_against_release_id:
          reportType === "infringement"
            ? String(form.get("release_id") ?? "") || null
            : (parent?.against_release_id ?? null),
        p_parent_report_id: parent?.id ?? null,
        p_claimant_name: String(form.get("claimant_name") ?? "").trim(),
        p_claimant_email: String(form.get("claimant_email") ?? "").trim(),
        p_work_description: String(form.get("work_description") ?? "").trim(),
        p_external_reference: String(form.get("external_reference") ?? "").trim() || null,
        p_good_faith_attested: true,
        p_evidence_path: evidencePath,
      });
      if (submitError) throw submitError;
      toast.success("Comunicação registada. A equipa irá analisar o processo.");
      formElement.reset();
      setReportType("infringement");
      await refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível registar o processo.";
      if (evidencePath) {
        const cleanup = await supabase.storage.from("rights-evidence").remove([evidencePath]);
        toast.error(
          cleanup.error
            ? `${message}. A limpeza da prova falhou: ${cleanup.error.message}`
            : message,
        );
      } else {
        toast.error(message);
      }
    } finally {
      setBusy(false);
    }
  }

  async function openPrivateDocument(bucket: "rights-evidence", objectPath: string) {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(objectPath, 60);
    if (error) {
      toast.error(error.message);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function withdrawReport(reportId: string) {
    const confirmed = window.confirm("Retirar esta comunicação? O histórico será mantido.");
    if (!confirmed) return;
    const { error } = await supabase
      .from("copyright_reports")
      .update({ status: "withdrawn" })
      .eq("id", reportId)
      .eq("reporter_id", userId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Comunicação retirada; o registo foi preservado.");
    await refresh();
  }

  if (loading) {
    return <PageLoading />;
  }
  if (loadError && !userId) {
    return <PageError message={loadError} />;
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:py-12">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao painel
      </Link>
      <div className="mt-6">
        <div className="flex items-center gap-3">
          <span className="gradient-brand-soft flex h-12 w-12 items-center justify-center rounded-2xl text-primary">
            <FileLock2 className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">Direitos e conformidade</p>
            <h1 className="font-display text-3xl font-bold">Titularidade e créditos</h1>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          As declarações, créditos e documentos ficam associados ao processo de revisão. Os
          documentos são privados e só ficam acessíveis à sua conta e à equipa autorizada.
        </p>
      </div>

      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <h2 className="font-display text-lg font-semibold">Declarações registadas</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  As declarações de titularidade e os créditos são enviados com cada lançamento.
                </p>
              </div>
            </div>
            {declarations.length ? (
              <ul className="mt-5 space-y-3">
                {declarations.map((declaration) => {
                  const release = releases.find((item) => item.id === declaration.release_id);
                  return (
                    <li key={declaration.id} className="rounded-xl border p-4 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">{release?.title ?? "Lançamento"}</span>
                        <Badge variant="secondary">{declaration.status}</Badge>
                      </div>
                      <p className="mt-2 text-muted-foreground">
                        Master: {declaration.master_owner} · Composição:{" "}
                        {declaration.composition_owner}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-5 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                Ainda não declarou titulares. A declaração será solicitada ao enviar um lançamento.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <UploadCloud className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <h2 className="font-display text-lg font-semibold">Documentos privados</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Envie licenças, autorizações ou folhas de divisão de direitos.
                </p>
              </div>
            </div>
            {releases.length ? (
              <form onSubmit={uploadDocument} className="mt-5 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="document-release">Lançamento</Label>
                  <Select name="release_id" required>
                    <SelectTrigger id="document-release">
                      <SelectValue placeholder="Escolha um lançamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {releases.map((release) => (
                        <SelectItem key={release.id} value={release.id}>
                          {release.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="document-type">Tipo de documento</Label>
                  <Select name="document_type" required>
                    <SelectTrigger id="document-type">
                      <SelectValue placeholder="Escolha o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="license">Licença</SelectItem>
                      <SelectItem value="split_sheet">Divisão de direitos</SelectItem>
                      <SelectItem value="authorization">Autorização</SelectItem>
                      <SelectItem value="identity">Documento de identificação</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="document-file">Ficheiro privado (PDF ou imagem, até 20 MB)</Label>
                  <Input
                    id="document-file"
                    name="document_file"
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    required
                  />
                </div>
                <Button disabled={busy} className="w-full">
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar documento privado
                </Button>
              </form>
            ) : (
              <p className="mt-5 text-sm text-muted-foreground">
                Envie primeiro um lançamento para poder associar documentos.
              </p>
            )}
            {!!documents.length && (
              <ul className="mt-5 space-y-2 border-t pt-4">
                {documents.map((document) => (
                  <li key={document.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">{documentTypeName(document.document_type)}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void openPrivateDocument("rights-evidence", document.object_path)
                      }
                    >
                      Abrir (1 min)
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-10">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-1 h-5 w-5 text-primary" />
          <div>
            <h2 className="font-display text-2xl font-bold">Denúncias e contestações</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Pode comunicar uso não autorizado, responder a uma ação sobre um lançamento seu ou
              recorrer de uma decisão. Cada envio fica registado para análise da equipa.
            </p>
          </div>
        </div>

        <Card className="mt-5">
          <CardContent className="p-5 sm:p-6">
            <form onSubmit={submitReport} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="report-type">Tipo de comunicação</Label>
                <Select
                  name="report_type"
                  value={reportType}
                  onValueChange={setReportType}
                  required
                >
                  <SelectTrigger id="report-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="infringement">Denunciar uso não autorizado</SelectItem>
                    {!!counterCandidates.length && (
                      <SelectItem value="counter_notice">
                        Contestar uma denúncia sobre mim
                      </SelectItem>
                    )}
                    {!!appealCandidates.length && (
                      <SelectItem value="appeal">Recorrer de uma decisão</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Para responder ou recorrer, selecione o processo elegível no campo seguinte.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="parent-report">Processo relacionado (quando aplicável)</Label>
                <Select name="parent_report_id" required={reportType !== "infringement"}>
                  <SelectTrigger id="parent-report">
                    <SelectValue placeholder="Escolha um processo" />
                  </SelectTrigger>
                  <SelectContent>
                    {(reportType === "counter_notice"
                      ? counterCandidates
                      : reportType === "appeal"
                        ? appealCandidates
                        : []
                    ).map((report) => (
                      <SelectItem key={report.id} value={report.id}>
                        {report.report_type === "infringement" ? "Denúncia" : "Decisão"} ·{" "}
                        {report.id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="report-release">Lançamento relacionado (opcional)</Label>
                <Select name="release_id">
                  <SelectTrigger id="report-release">
                    <SelectValue placeholder="Não é um lançamento da plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    {releases.map((release) => (
                      <SelectItem key={release.id} value={release.id}>
                        {release.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="claimant-name">O seu nome ou organização</Label>
                <Input
                  id="claimant-name"
                  name="claimant_name"
                  defaultValue={artistName}
                  required
                  maxLength={200}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="claimant-email">Email para contacto</Label>
                <Input
                  id="claimant-email"
                  name="claimant_email"
                  type="email"
                  defaultValue={email}
                  required
                  maxLength={320}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="external-reference">Link ou referência da obra (opcional)</Label>
                <Input id="external-reference" name="external_reference" maxLength={1000} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="work-description">
                  Descrição da obra, direitos e motivo (mínimo 20 caracteres)
                </Label>
                <Textarea
                  id="work-description"
                  name="work_description"
                  minLength={20}
                  maxLength={10000}
                  required
                  rows={4}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="report-evidence">
                  Prova privada opcional (PDF ou imagem, até 20 MB)
                </Label>
                <Input
                  id="report-evidence"
                  name="evidence_file"
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                />
              </div>
              <label className="flex items-start gap-2 text-sm leading-relaxed sm:col-span-2">
                <Checkbox name="good_faith_attested" required />
                <span>
                  Declaro, de boa-fé, que as informações são verdadeiras e que posso comunicar estes
                  direitos. Compreendo que uma denúncia não garante remoção automática.
                </span>
              </label>
              <Button disabled={busy} className="sm:col-span-2">
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registar comunicação para análise
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-5 grid gap-3">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {REPORT_STATUS[report.status] ?? report.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {reportTypeName(report.report_type)} · {formatDate(report.created_at)}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{report.work_description}</p>
                  {report.decision && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Decisão registada: {decisionName(report.decision)}
                      {report.decided_at ? ` · ${formatDate(report.decided_at)}` : ""}
                    </p>
                  )}
                  {report.evidence_path && (
                    <Button
                      type="button"
                      size="sm"
                      variant="link"
                      className="px-0"
                      onClick={() =>
                        void openPrivateDocument("rights-evidence", report.evidence_path!)
                      }
                    >
                      Abrir prova privada
                    </Button>
                  )}
                </div>
                {report.reporter_id === userId && report.status === "submitted" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => void withdrawReport(report.id)}
                  >
                    Retirar comunicação
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
          {!reports.length && (
            <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
              Ainda não existem comunicações de direitos.
            </p>
          )}
        </div>
      </section>
      <p className="mt-10 text-xs text-muted-foreground">
        Este processo interno não substitui aconselhamento jurídico nem envia pedidos a serviços
        externos. A distribuição e a remoção em plataformas externas dependem de um distribuidor
        autorizado e de uma integração que ainda não está configurada.
      </p>
    </main>
  );
}

function PageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center gap-2 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />A carregar direitos e documentos…
    </div>
  );
}

function PageError({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-lg">
        <CardContent className="p-8 text-center">
          <h1 className="font-display text-xl font-bold">Não foi possível carregar os direitos</h1>
          <p className="mt-3 text-sm text-muted-foreground">{message}</p>
          <Button asChild className="mt-5">
            <Link to="/auth">Voltar ao início de sessão</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

function documentTypeName(value: string) {
  return (
    {
      license: "Licença",
      split_sheet: "Divisão de direitos",
      authorization: "Autorização",
      identity: "Documento de identificação",
      other: "Outro documento",
    }[value] ?? value
  );
}

function reportTypeName(value: string) {
  return (
    {
      infringement: "Denúncia de direitos",
      counter_notice: "Contestação",
      appeal: "Recurso",
    }[value] ?? value
  );
}

function decisionName(value: string) {
  return (
    {
      remove: "Conteúdo marcado para remoção interna",
      restore: "Conteúdo aprovado na plataforma interna",
      no_action: "Sem ação interna",
      accept_counter: "Contestação aceite",
    }[value] ?? value
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-PT");
}

function fileExtension(filename: string) {
  const match = filename.match(/\.[a-zA-Z0-9]{1,10}$/);
  return match?.[0] ?? "";
}
