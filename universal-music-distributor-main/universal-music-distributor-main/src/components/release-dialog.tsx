import { useState, type FormEvent } from "react";
import { Loader2, Plus, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { PLATFORMS, PLATFORM_CATEGORY_LABEL, type PlatformCategory } from "@/lib/platforms";

type ReleaseType = "single" | "ep" | "album";
type CreditRole =
  | "primary_artist"
  | "featured_artist"
  | "performer"
  | "songwriter"
  | "composer"
  | "producer"
  | "publisher"
  | "engineer"
  | "other";
type TrackCredit = { name: string; role: CreditRole; share: string };
type TrackFile = { file: File; title: string; credits: TrackCredit[] };

const CATEGORIES: PlatformCategory[] = ["streaming", "social", "regional", "store"];
const DEFAULT_PLATFORMS = ["spotify", "apple_music", "youtube_music", "tiktok"];

export function ReleaseDialog({
  artistId,
  onCreated,
  compact = false,
  className,
}: {
  artistId: string;
  onCreated: () => void;
  compact?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [releaseType, setReleaseType] = useState<ReleaseType>("single");
  const [genre, setGenre] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [description, setDescription] = useState("");
  const [masterOwner, setMasterOwner] = useState("");
  const [compositionOwner, setCompositionOwner] = useState("");
  const [rightsAttested, setRightsAttested] = useState(false);
  const [cover, setCover] = useState<File | null>(null);
  const [tracks, setTracks] = useState<TrackFile[]>([]);
  const [platforms, setPlatforms] = useState(DEFAULT_PLATFORMS);
  const [explicit, setExplicit] = useState(false);

  function resetForm() {
    setTitle("");
    setReleaseType("single");
    setGenre("");
    setReleaseDate("");
    setDescription("");
    setMasterOwner("");
    setCompositionOwner("");
    setRightsAttested(false);
    setCover(null);
    setTracks([]);
    setPlatforms(DEFAULT_PLATFORMS);
    setExplicit(false);
  }

  function updateOpen(nextOpen: boolean) {
    if (saving) return;
    setOpen(nextOpen);
    if (!nextOpen) resetForm();
  }

  function updatePlatforms(platformId: string, checked: boolean | "indeterminate") {
    setPlatforms((current) =>
      checked
        ? [...new Set([...current, platformId])]
        : current.filter((platform) => platform !== platformId),
    );
  }

  function updateTrackFiles(files: FileList | null) {
    if (!files) return;
    setTracks(
      Array.from(files).map((file) => ({
        file,
        title: file.name.replace(/\.[^/.]+$/, ""),
        credits: [{ name: "", role: "primary_artist" as const, share: "" }],
      })),
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!artistId) {
      toast.error("A sua sessão expirou. Entre novamente para enviar um lançamento.");
      return;
    }
    if (!cover) {
      toast.error("Selecione a capa do lançamento.");
      return;
    }
    if (!tracks.length) {
      toast.error("Adicione pelo menos uma faixa de áudio.");
      return;
    }
    if (releaseType === "single" && tracks.length !== 1) {
      toast.error("Um single deve conter exatamente uma faixa.");
      return;
    }
    if (!platforms.length) {
      toast.error("Selecione pelo menos uma plataforma.");
      return;
    }
    if (tracks.some((track) => !track.title.trim())) {
      toast.error("Preencha o título de cada faixa.");
      return;
    }
    if (
      tracks.some(
        (track) => track.credits.length === 0 || track.credits.some((credit) => !credit.name.trim()),
      )
    ) {
      toast.error("Adicione pelo menos um crédito com nome para cada faixa.");
      return;
    }
    if (!masterOwner.trim() || !compositionOwner.trim() || !rightsAttested) {
      toast.error("Declare os titulares dos direitos e confirme a declaração de titularidade.");
      return;
    }
    if (cover.size > 10 * 1024 * 1024) {
      toast.error("A capa deve ter no máximo 10 MB.");
      return;
    }
    if (tracks.some((track) => track.file.size > 100 * 1024 * 1024)) {
      toast.error("Cada faixa de áudio deve ter no máximo 100 MB.");
      return;
    }

    setSaving(true);
    const releaseId = crypto.randomUUID();
    const uploadedPaths: string[] = [];

    try {
      const coverPath = `${artistId}/${releaseId}/cover-${crypto.randomUUID()}${fileExtension(cover.name)}`;
      const coverUpload = await supabase.storage.from("covers").upload(coverPath, cover, {
        contentType: cover.type || "application/octet-stream",
        upsert: false,
      });
      if (coverUpload.error) {
        throw new Error(`Falha ao enviar a capa: ${coverUpload.error.message}`);
      }
      uploadedPaths.push(coverPath);

      const uploadedTracks: Array<{ track: TrackFile; path: string }> = [];
      for (const track of tracks) {
        const audioPath = `${artistId}/${releaseId}/audio-${crypto.randomUUID()}${fileExtension(track.file.name)}`;
        const audioUpload = await supabase.storage.from("audio").upload(audioPath, track.file, {
          contentType: track.file.type || "application/octet-stream",
          upsert: false,
        });
        if (audioUpload.error) {
          throw new Error(`Falha ao enviar "${track.title}": ${audioUpload.error.message}`);
        }
        uploadedPaths.push(audioPath);
        uploadedTracks.push({ track, path: audioPath });
      }

      const { error: submitError } = await supabase.rpc("submit_release", {
        p_release_id: releaseId,
        p_title: title.trim(),
        p_release_type: releaseType,
        p_genre: genre.trim(),
        p_release_date: releaseDate,
        p_cover_path: coverPath,
        p_description: description.trim() || null,
        p_explicit: explicit,
        p_platforms: platforms,
        p_master_owner: masterOwner.trim(),
        p_composition_owner: compositionOwner.trim(),
        p_rights_attested: rightsAttested,
        p_tracks: uploadedTracks.map(({ track, path }) => ({
          title: track.title.trim(),
          audio_path: path,
          credits: track.credits.map((credit) => ({
            name: credit.name.trim(),
            role: credit.role,
            ...(credit.share.trim() ? { ownership_share: Number(credit.share) } : {}),
          })),
        })),
      });
      if (submitError) {
        throw new Error(`Falha ao registar o lançamento: ${submitError.message}`);
      }

      toast.success("Lançamento enviado para revisão.");
      setOpen(false);
      resetForm();
      onCreated();
    } catch (error) {
      const failure =
        error instanceof Error ? error.message : "Não foi possível enviar o lançamento.";
      const cleanupErrors: string[] = [];

      if (uploadedPaths.length) {
        const result = await supabase.storage
          .from("covers")
          .remove(
            uploadedPaths.filter((path) => path.startsWith(`${artistId}/${releaseId}/cover-`)),
          );
        if (result.error) {
          cleanupErrors.push(`não foi possível remover a capa (${result.error.message})`);
        }
        const audioResult = await supabase.storage
          .from("audio")
          .remove(uploadedPaths.filter((path) => path.includes("/audio-")));
        if (audioResult.error) {
          cleanupErrors.push(`não foi possível remover os áudios (${audioResult.error.message})`);
        }
      }

      toast.error(
        cleanupErrors.length
          ? `${failure}. A limpeza também falhou: ${cleanupErrors.join("; ")}.`
          : failure,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={updateOpen}>
      <DialogTrigger asChild>
        <Button className={className} size={compact ? "sm" : "default"}>
          <Plus className="mr-2 h-4 w-4" />
          Novo lançamento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enviar novo lançamento</DialogTitle>
          <DialogDescription>
            Preencha os detalhes e envie o material para revisão da equipa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="release-title">Título do lançamento</Label>
              <Input
                id="release-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                maxLength={150}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="release-type">Tipo de lançamento</Label>
              <Select
                value={releaseType}
                onValueChange={(value) => setReleaseType(value as ReleaseType)}
              >
                <SelectTrigger id="release-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="ep">EP</SelectItem>
                  <SelectItem value="album">Álbum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="release-genre">Género musical</Label>
              <Input
                id="release-genre"
                value={genre}
                onChange={(event) => setGenre(event.target.value)}
                required
                maxLength={80}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="release-date">Data de lançamento</Label>
              <Input
                id="release-date"
                type="date"
                value={releaseDate}
                onChange={(event) => setReleaseDate(event.target.value)}
                min={localDate()}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="release-cover">Capa (imagem)</Label>
              <Input
                id="release-cover"
                type="file"
                accept="image/*"
                required
                onChange={(event) => setCover(event.target.files?.[0] ?? null)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="release-audio">Faixas de áudio</Label>
              <Input
                id="release-audio"
                type="file"
                accept="audio/*"
                multiple
                required
                onChange={(event) => updateTrackFiles(event.target.files)}
              />
              <p className="text-xs text-muted-foreground">
                Para EPs e álbuns, selecione todas as faixas de uma só vez. Os títulos podem ser
                ajustados abaixo.
              </p>
            </div>
            {tracks.map((track, index) => (
              <div className="space-y-2 sm:col-span-2" key={`${track.file.name}-${index}`}>
                <Label htmlFor={`track-${index}`}>Faixa {index + 1}</Label>
                <Input
                  id={`track-${index}`}
                  value={track.title}
                  onChange={(event) =>
                    setTracks((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, title: event.target.value } : item,
                      ),
                    )
                  }
                  required
                  maxLength={150}
                />
                <div className="space-y-2 rounded-lg border p-3">
                  <p className="text-sm font-medium">Créditos da faixa</p>
                  {track.credits.map((credit, creditIndex) => (
                    <div
                      className="grid gap-2 sm:grid-cols-[1fr_160px_110px_auto]"
                      key={`${index}-${creditIndex}`}
                    >
                      <Input
                        aria-label={`Nome do crédito ${creditIndex + 1} da faixa ${index + 1}`}
                        placeholder="Nome da pessoa"
                        value={credit.name}
                        onChange={(event) =>
                          setTracks((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    credits: item.credits.map((entry, entryIndex) =>
                                      entryIndex === creditIndex
                                        ? { ...entry, name: event.target.value }
                                        : entry,
                                    ),
                                  }
                                : item,
                            ),
                          )
                        }
                        required
                        maxLength={200}
                      />
                      <Select
                        value={credit.role}
                        onValueChange={(value) =>
                          setTracks((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    credits: item.credits.map((entry, entryIndex) =>
                                      entryIndex === creditIndex
                                        ? { ...entry, role: value as CreditRole }
                                        : entry,
                                    ),
                                  }
                                : item,
                            ),
                          )
                        }
                      >
                        <SelectTrigger aria-label={`Função do crédito ${creditIndex + 1}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary_artist">Artista principal</SelectItem>
                          <SelectItem value="featured_artist">Artista convidado</SelectItem>
                          <SelectItem value="performer">Intérprete</SelectItem>
                          <SelectItem value="songwriter">Compositor de letra</SelectItem>
                          <SelectItem value="composer">Compositor musical</SelectItem>
                          <SelectItem value="producer">Produtor</SelectItem>
                          <SelectItem value="publisher">Editora musical</SelectItem>
                          <SelectItem value="engineer">Engenheiro de som</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        aria-label={`Percentagem de direitos do crédito ${creditIndex + 1}`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="% direitos"
                        value={credit.share}
                        onChange={(event) =>
                          setTracks((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    credits: item.credits.map((entry, entryIndex) =>
                                      entryIndex === creditIndex
                                        ? { ...entry, share: event.target.value }
                                        : entry,
                                    ),
                                  }
                                : item,
                            ),
                          )
                        }
                      />
                      {track.credits.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            setTracks((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? {
                                      ...item,
                                      credits: item.credits.filter(
                                        (_, entryIndex) => entryIndex !== creditIndex,
                                      ),
                                    }
                                  : item,
                              ),
                            )
                          }
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setTracks((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...item,
                                credits: [
                                  ...item.credits,
                                  { name: "", role: "performer", share: "" },
                                ],
                              }
                            : item,
                        ),
                      )
                    }
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Adicionar crédito
                  </Button>
                </div>
              </div>
            ))}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="release-description">Descrição (opcional)</Label>
              <Textarea
                id="release-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={1000}
                rows={3}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="master-owner">Titular da gravação (master)</Label>
              <Input
                id="master-owner"
                value={masterOwner}
                onChange={(event) => setMasterOwner(event.target.value)}
                required
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="composition-owner">Titular da composição</Label>
              <Input
                id="composition-owner"
                value={compositionOwner}
                onChange={(event) => setCompositionOwner(event.target.value)}
                required
                maxLength={200}
              />
            </div>
          </div>

          <label className="flex items-start gap-2 text-sm leading-relaxed">
            <Checkbox
              checked={rightsAttested}
              onCheckedChange={(checked) => setRightsAttested(checked === true)}
            />
            <span>
              Confirmo que indiquei corretamente os titulares e créditos e que tenho autorização
              para enviar este material. Uma declaração falsa pode levar à suspensão da análise.
            </span>
          </label>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Plataformas de destino</legend>
            <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              {CATEGORIES.map((category) => (
                <div key={category} className="space-y-2">
                  <h3 className="text-sm font-semibold">{PLATFORM_CATEGORY_LABEL[category]}</h3>
                  <div className="space-y-2">
                    {PLATFORMS.filter((platform) => platform.category === category).map(
                      (platform) => (
                        <label key={platform.id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={platforms.includes(platform.id)}
                            onCheckedChange={(checked) => updatePlatforms(platform.id, checked)}
                          />
                          {platform.name}
                        </label>
                      ),
                    )}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={explicit}
              onCheckedChange={(checked) => setExplicit(checked === true)}
            />
            Este lançamento contém conteúdo explícito
          </label>

          <Button type="submit" className="w-full gradient-brand text-white" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />A enviar ficheiros…
              </>
            ) : (
              <>
                <UploadCloud className="mr-2 h-4 w-4" />
                Enviar para revisão
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function fileExtension(filename: string) {
  const match = filename.match(/\.[a-zA-Z0-9]{1,10}$/);
  return match?.[0] ?? "";
}

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
