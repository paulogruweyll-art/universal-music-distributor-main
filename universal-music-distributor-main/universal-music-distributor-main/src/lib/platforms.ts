export type PlatformCategory = "streaming" | "social" | "store" | "regional";

export interface Platform {
  id: string;
  name: string;
  category: PlatformCategory;
}

/** Lista completa de destinos de distribuição da GruweyllMusic. */
export const PLATFORMS: Platform[] = [
  // Streaming globais
  { id: "spotify", name: "Spotify", category: "streaming" },
  { id: "apple_music", name: "Apple Music", category: "streaming" },
  { id: "youtube_music", name: "YouTube Music", category: "streaming" },
  { id: "deezer", name: "Deezer", category: "streaming" },
  { id: "amazon_music", name: "Amazon Music", category: "streaming" },
  { id: "tidal", name: "Tidal", category: "streaming" },
  { id: "pandora", name: "Pandora", category: "streaming" },
  { id: "qobuz", name: "Qobuz", category: "streaming" },
  { id: "napster", name: "Napster", category: "streaming" },
  { id: "iheartradio", name: "iHeartRadio", category: "streaming" },
  { id: "soundcloud", name: "SoundCloud", category: "streaming" },
  { id: "anghami", name: "Anghami", category: "streaming" },
  { id: "kkbox", name: "KKBOX", category: "streaming" },
  { id: "line_music", name: "LINE MUSIC", category: "streaming" },
  { id: "joox", name: "JOOX", category: "streaming" },
  { id: "yandex_music", name: "Yandex Music", category: "streaming" },
  { id: "vk_music", name: "VK Música", category: "streaming" },
  { id: "netease", name: "NetEase Cloud Music", category: "regional" },
  { id: "qq_music", name: "QQ Music", category: "regional" },
  { id: "jiosaavn", name: "JioSaavn", category: "regional" },
  { id: "gaana", name: "Gaana", category: "regional" },
  { id: "wynk", name: "Wynk Music", category: "regional" },

  // África e lusofonia
  { id: "boomplay", name: "Boomplay", category: "regional" },
  { id: "audiomack", name: "Audiomack", category: "regional" },
  { id: "mdundo", name: "Mdundo", category: "regional" },
  { id: "claro_musica", name: "Claro Música", category: "regional" },
  { id: "uma_look", name: "UMA/LOOK", category: "regional" },
  { id: "styngr", name: "Styngr", category: "regional" },
  { id: "kaboodle", name: "Kaboodle", category: "regional" },
  { id: "sefi", name: "Sefi", category: "regional" },

  // Redes sociais e vídeo
  { id: "tiktok", name: "TikTok", category: "social" },
  { id: "instagram_meta", name: "Instagram & Facebook (Meta)", category: "social" },
  { id: "youtube_content_id", name: "YouTube Content ID", category: "social" },
  { id: "snapchat", name: "Snapchat", category: "social" },
  { id: "triller", name: "Triller", category: "social" },
  { id: "shazam", name: "Shazam", category: "social" },
  { id: "spotify_discovery", name: "Spotify Discovery Mode", category: "social" },

  // Lojas e especializadas
  { id: "beatport", name: "Beatport", category: "store" },
  { id: "traxsource", name: "Traxsource", category: "store" },
  { id: "junodownload", name: "Junodownload", category: "store" },
  { id: "bandcamp", name: "Bandcamp", category: "store" },
  { id: "itunes_store", name: "iTunes Store", category: "store" },
  { id: "amazon_store", name: "Loja Amazon", category: "store" },
];

export const PLATFORM_COUNT = PLATFORMS.length;

export const PLATFORM_CATEGORY_LABEL: Record<PlatformCategory, string> = {
  streaming: "Streaming",
  social: "Redes sociais",
  store: "Lojas",
  regional: "Regionais",
};

export function platformName(id: string): string {
  return PLATFORMS.find((p) => p.id === id)?.name ?? id;
}
