// ---------------------------------------------------------------------------
// Anime Index — a directory of anime sites across the whole landscape:
// official/legal services, free (unofficial) streamers, region-blocked sites,
// and the graveyard of shut-down ones.
//
// This is an informational catalog (in the spirit of everythingmoe.com). It
// does NOT host, stream, or proxy any content. Entries marked "free" are
// unofficial; statuses and dates are approximate and change often.
// ---------------------------------------------------------------------------

export type SiteStatus = "legal" | "free" | "shutdown";
export type SiteKind = "stream" | "manga" | "download" | "database" | "news";

export interface AnimeSite {
  slug: string;
  name: string;
  /** Omitted for shut-down sites (and where we'd rather not deep-link). */
  url?: string;
  status: SiteStatus;
  kind: SiteKind;
  blurb: string;
  features: string[];
  founded?: number;
  /** Year it shut down / merged away, for status === "shutdown". */
  endedYear?: number;
  /** Primary availability, e.g. "Worldwide", "SEA", "Japan". */
  region?: string;
  /** Regions where it's been ISP- or court-blocked. */
  blockedIn?: string[];
  /** What replaced it / what it merged into. */
  successor?: string;
  emoji: string;
  gradient: string;
  featured?: boolean;
}

export const ANIME_SITES: AnimeSite[] = [
  // ===== Legal / official streaming =====
  {
    slug: "crunchyroll",
    name: "Crunchyroll",
    url: "https://www.crunchyroll.com",
    status: "legal",
    kind: "stream",
    blurb:
      "The largest dedicated anime streaming service, now owned by Sony. Absorbed Funimation, Wakanim, and VRV into a single global catalog.",
    features: ["Subbed", "Dubbed", "Simulcast", "Mobile", "Free w/ ads tier"],
    founded: 2006,
    region: "Worldwide",
    emoji: "🍥",
    gradient: "from-amber-400 to-orange-500",
    featured: true,
  },
  {
    slug: "hidive",
    name: "HIDIVE",
    url: "https://www.hidive.com",
    status: "legal",
    kind: "stream",
    blurb:
      "Sentai-backed streamer known for niche simulcasts, dubs, and titles that don't land on Crunchyroll.",
    features: ["Subbed", "Dubbed", "Simulcast", "Exclusives"],
    founded: 2017,
    region: "Select regions",
    emoji: "🌊",
    gradient: "from-sky-500 to-indigo-500",
    featured: true,
  },
  {
    slug: "netflix",
    name: "Netflix",
    url: "https://www.netflix.com",
    status: "legal",
    kind: "stream",
    blurb:
      "Heavy investor in anime originals (Devilman Crybaby, Cyberpunk: Edgerunners) plus a rotating licensed catalog.",
    features: ["Subbed", "Dubbed", "Originals", "4K"],
    founded: 2007,
    region: "Worldwide",
    emoji: "🅽",
    gradient: "from-red-500 to-rose-600",
  },
  {
    slug: "prime-video",
    name: "Amazon Prime Video",
    url: "https://www.primevideo.com",
    status: "legal",
    kind: "stream",
    blurb:
      "Large licensed library plus exclusives. Once ran the separate 'Anime Strike' channel before folding it in.",
    features: ["Subbed", "Dubbed", "Exclusives", "4K"],
    founded: 2006,
    region: "Worldwide",
    emoji: "📦",
    gradient: "from-cyan-400 to-blue-500",
  },
  {
    slug: "bilibili",
    name: "Bilibili (Bstation)",
    url: "https://www.bilibili.tv",
    status: "legal",
    kind: "stream",
    blurb:
      "Major Chinese platform; its overseas 'Bstation' app legally simulcasts anime and donghua across Southeast Asia.",
    features: ["Subbed", "Simulcast", "Donghua", "Free tier"],
    founded: 2009,
    region: "Asia (overseas app)",
    emoji: "📺",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    slug: "muse-asia",
    name: "Muse Asia",
    url: "https://www.youtube.com/@MuseAsia",
    status: "legal",
    kind: "stream",
    blurb:
      "Licensed YouTube channel that legally streams simulcast anime for free (with ads) across South & Southeast Asia.",
    features: ["Subbed", "Simulcast", "Free", "YouTube"],
    founded: 2019,
    region: "S/SE Asia",
    emoji: "🎶",
    gradient: "from-fuchsia-500 to-pink-500",
  },
  {
    slug: "ani-one",
    name: "Ani-One Asia",
    url: "https://www.youtube.com/@Ani-OneAsia",
    status: "legal",
    kind: "stream",
    blurb:
      "Medialink's licensed YouTube channel with free and 'Ultra' membership simulcasts for the Asian region.",
    features: ["Subbed", "Simulcast", "Free + membership", "YouTube"],
    founded: 2020,
    region: "Asia",
    emoji: "🇦",
    gradient: "from-teal-400 to-cyan-500",
  },
  {
    slug: "laftel",
    name: "Laftel",
    url: "https://laftel.net",
    status: "legal",
    kind: "stream",
    blurb:
      "Popular Korean anime streaming service with a deep simulcast catalog tailored to the Korean market.",
    features: ["Subbed", "Simulcast", "Korean market"],
    founded: 2014,
    region: "South Korea",
    emoji: "🇰🇷",
    gradient: "from-purple-500 to-indigo-500",
  },
  {
    slug: "retrocrush",
    name: "RetroCrush",
    url: "https://www.retrocrush.tv",
    status: "legal",
    kind: "stream",
    blurb:
      "Free, ad-supported service focused on classic and retro anime from the 70s through the 2000s.",
    features: ["Subbed", "Dubbed", "Free w/ ads", "Retro"],
    founded: 2020,
    region: "North America",
    emoji: "📼",
    gradient: "from-yellow-400 to-amber-500",
  },

  // ===== Legal manga / reading =====
  {
    slug: "manga-plus",
    name: "MANGA Plus by Shueisha",
    url: "https://mangaplus.shueisha.co.jp",
    status: "legal",
    kind: "manga",
    blurb:
      "Shueisha's official app — read the latest Shonen Jump chapters (One Piece, etc.) free, same day as Japan.",
    features: ["Official", "Free", "Simulpub", "Multi-language"],
    founded: 2019,
    region: "Worldwide (most)",
    emoji: "➕",
    gradient: "from-red-500 to-rose-600",
    featured: true,
  },
  {
    slug: "viz",
    name: "VIZ / Shonen Jump",
    url: "https://www.viz.com",
    status: "legal",
    kind: "manga",
    blurb:
      "VIZ Media's official reader. A cheap monthly Shonen Jump membership unlocks a huge digital vault in English.",
    features: ["Official", "Membership", "English", "Vault"],
    founded: 1986,
    region: "US / CA",
    emoji: "📚",
    gradient: "from-blue-500 to-violet-500",
  },
  {
    slug: "k-manga",
    name: "K MANGA",
    url: "https://kmanga.kodansha.com",
    status: "legal",
    kind: "manga",
    blurb:
      "Kodansha's official US app for simulpub manga (Blue Lock, Attack on Titan catalog and more).",
    features: ["Official", "Simulpub", "Ticket system"],
    founded: 2023,
    region: "United States",
    emoji: "🇰",
    gradient: "from-emerald-400 to-teal-500",
  },

  // ===== Databases / news (neutral, legal) =====
  {
    slug: "myanimelist",
    name: "MyAnimeList",
    url: "https://myanimelist.net",
    status: "legal",
    kind: "database",
    blurb:
      "The default anime/manga database and tracking community — scores, seasonal charts, and lists for everything.",
    features: ["Tracking", "Database", "Community", "Seasonal"],
    founded: 2004,
    region: "Worldwide",
    emoji: "📊",
    gradient: "from-indigo-500 to-violet-600",
    featured: true,
  },
  {
    slug: "anilist",
    name: "AniList",
    url: "https://anilist.co",
    status: "legal",
    kind: "database",
    blurb:
      "Modern, fast tracker and database with a clean UI, rich stats, social feed, and a public GraphQL API.",
    features: ["Tracking", "Database", "API", "Social"],
    founded: 2014,
    region: "Worldwide",
    emoji: "📈",
    gradient: "from-cyan-400 to-blue-500",
  },
  {
    slug: "anidb",
    name: "AniDB",
    url: "https://anidb.net",
    status: "legal",
    kind: "database",
    blurb:
      "Veteran, extremely detailed anime database — the canonical source for episode, release, and file metadata.",
    features: ["Database", "Metadata", "Veteran"],
    founded: 2003,
    region: "Worldwide",
    emoji: "🗂️",
    gradient: "from-teal-400 to-cyan-500",
  },
  {
    slug: "ann",
    name: "Anime News Network",
    url: "https://www.animenewsnetwork.com",
    status: "legal",
    kind: "news",
    blurb:
      "The long-running news outlet of record for the industry — announcements, reviews, and an encyclopedia.",
    features: ["News", "Reviews", "Encyclopedia"],
    founded: 1998,
    region: "Worldwide",
    emoji: "📰",
    gradient: "from-sky-500 to-indigo-500",
  },

  // ===== Free / unofficial streaming =====
  {
    slug: "hianime",
    name: "HiAnime (ex-Zoro)",
    status: "free",
    kind: "stream",
    blurb:
      "Successor to the popular Zoro.to. A widely used free streamer; frequently changes domains and is blocked in several countries.",
    features: ["Subbed", "Dubbed", "No account", "Domain-hops"],
    region: "Worldwide",
    blockedIn: ["India", "Italy", "Australia"],
    emoji: "👁️",
    gradient: "from-violet-500 to-fuchsia-500",
    featured: true,
  },
  {
    slug: "gogoanime",
    name: "Gogoanime",
    status: "free",
    kind: "stream",
    blurb:
      "Long-running free streaming brand survived through countless clones and mirror domains after takedowns.",
    features: ["Subbed", "Dubbed", "Many clones"],
    region: "Worldwide",
    blockedIn: ["India", "Australia", "UK"],
    emoji: "🟢",
    gradient: "from-lime-400 to-emerald-500",
  },
  {
    slug: "animepahe",
    name: "AnimePahe",
    status: "free",
    kind: "stream",
    blurb:
      "Free streamer favored for small file sizes and download links; minimal UI and a Cloudflare gate.",
    features: ["Subbed", "Downloads", "Small files"],
    region: "Worldwide",
    blockedIn: ["India"],
    emoji: "🥧",
    gradient: "from-amber-400 to-orange-500",
  },
  {
    slug: "allanime",
    name: "AllAnime",
    status: "free",
    kind: "stream",
    blurb:
      "Free streaming/library site with a public API, popular as a back-end for community CLI and app front-ends.",
    features: ["Subbed", "Dubbed", "API", "CLI-friendly"],
    region: "Worldwide",
    emoji: "🅰️",
    gradient: "from-purple-500 to-indigo-500",
  },
  {
    slug: "miruro",
    name: "Miruro",
    status: "free",
    kind: "stream",
    blurb:
      "Sleek modern front-end that aggregates free streams with AniList integration and a polished player.",
    features: ["Subbed", "Dubbed", "AniList sync", "Modern UI"],
    region: "Worldwide",
    emoji: "✨",
    gradient: "from-fuchsia-500 to-pink-500",
  },
  {
    slug: "animeflv",
    name: "AnimeFLV",
    status: "free",
    kind: "stream",
    blurb:
      "The dominant Spanish-language free streaming site for Latin America, around for over a decade.",
    features: ["Subbed (ES)", "Latam", "Veteran"],
    region: "Latin America",
    blockedIn: ["Spain"],
    emoji: "🇪🇸",
    gradient: "from-rose-500 to-orange-400",
  },

  // ===== Free / unofficial manga =====
  {
    slug: "mangadex",
    name: "MangaDex",
    url: "https://mangadex.org",
    status: "free",
    kind: "manga",
    blurb:
      "Ad-free, community-run scanlation aggregator with a strong API. Hosts fan translations across many languages.",
    features: ["Scanlations", "Ad-free", "API", "Multi-language"],
    founded: 2018,
    region: "Worldwide",
    emoji: "📖",
    gradient: "from-blue-500 to-violet-500",
    featured: true,
  },
  {
    slug: "natomanga",
    name: "Natomanga (ex-Manganato)",
    status: "free",
    kind: "manga",
    blurb:
      "One of the Mangakakalot/Manganato family of free manga readers; rebrands and shifts domains over time.",
    features: ["Free", "Large library", "Domain-hops"],
    region: "Worldwide",
    emoji: "🍅",
    gradient: "from-red-500 to-rose-600",
  },
  {
    slug: "batoto",
    name: "Bato.to",
    status: "free",
    kind: "manga",
    blurb:
      "Community manga reader (revived from the original Batoto) hosting scanlations with group-friendly features.",
    features: ["Scanlations", "Community", "Multi-language"],
    region: "Worldwide",
    emoji: "🦇",
    gradient: "from-indigo-500 to-violet-600",
  },

  // ===== Free / download & torrents =====
  {
    slug: "nyaa",
    name: "Nyaa",
    status: "free",
    kind: "download",
    blurb:
      "The central public BitTorrent index for fansubs and raws — the backbone of the anime torrent ecosystem.",
    features: ["Torrents", "Fansubs", "Raws", "Index"],
    region: "Worldwide",
    blockedIn: ["UK", "Australia", "Finland"],
    emoji: "🐱",
    gradient: "from-cyan-400 to-blue-500",
  },
  {
    slug: "subsplease",
    name: "SubsPlease",
    url: "https://subsplease.org",
    status: "free",
    kind: "download",
    blurb:
      "Active release group posting fast, consistent weekly subs; effectively the successor to HorribleSubs.",
    features: ["Torrents", "Weekly", "Fast subs"],
    region: "Worldwide",
    successor: "Replaced HorribleSubs (2020)",
    emoji: "⬇️",
    gradient: "from-teal-400 to-cyan-500",
  },
  {
    slug: "animetosho",
    name: "AnimeTosho",
    url: "https://animetosho.org",
    status: "free",
    kind: "download",
    blurb:
      "Mirror/index of anime torrents with direct download links (DDL) and rich metadata layered on top of Nyaa.",
    features: ["DDL", "Index", "Metadata", "Mirror"],
    region: "Worldwide",
    emoji: "🗾",
    gradient: "from-sky-500 to-indigo-500",
  },

  // ===== Shut down / defunct =====
  {
    slug: "funimation",
    name: "Funimation",
    status: "shutdown",
    kind: "stream",
    blurb:
      "The legendary dub powerhouse and streamer. After Sony bought it, its catalog and subscribers were folded into Crunchyroll.",
    features: ["Was: Dubbed", "Was: Simulcast"],
    founded: 1994,
    endedYear: 2024,
    successor: "Merged into Crunchyroll",
    emoji: "🎬",
    gradient: "from-violet-500 to-fuchsia-500",
    featured: true,
  },
  {
    slug: "wakanim",
    name: "Wakanim",
    status: "shutdown",
    kind: "stream",
    blurb:
      "Sony's European simulcast service (France/Germany/Nordics). Shut down as its library moved to Crunchyroll.",
    features: ["Was: Subbed", "Was: EU simulcast"],
    founded: 2013,
    endedYear: 2024,
    successor: "Merged into Crunchyroll",
    region: "Europe",
    emoji: "🇪🇺",
    gradient: "from-sky-500 to-indigo-500",
  },
  {
    slug: "animelab",
    name: "AnimeLab",
    status: "shutdown",
    kind: "stream",
    blurb:
      "The go-to legal streamer for Australia & New Zealand, run by Madman. Replaced by Crunchyroll in the region.",
    features: ["Was: Subbed", "Was: Dubbed"],
    founded: 2014,
    endedYear: 2022,
    successor: "Migrated to Crunchyroll",
    region: "AU / NZ",
    emoji: "🧪",
    gradient: "from-emerald-400 to-teal-500",
  },
  {
    slug: "vrv",
    name: "VRV",
    status: "shutdown",
    kind: "stream",
    blurb:
      "Bundle service that once housed Crunchyroll, HIDIVE, and other channels under one subscription before being retired.",
    features: ["Was: Bundle", "Was: Channels"],
    founded: 2016,
    endedYear: 2024,
    successor: "Folded into Crunchyroll",
    region: "United States",
    emoji: "🎛️",
    gradient: "from-purple-500 to-indigo-500",
  },
  {
    slug: "kissanime",
    name: "KissAnime",
    status: "shutdown",
    kind: "stream",
    blurb:
      "Once the most infamous free streaming site in the world. Shut down in 2020 amid Japan's piracy crackdown; clones still abuse the name.",
    features: ["Was: Subbed", "Was: Dubbed", "Name abused by clones"],
    endedYear: 2020,
    emoji: "💋",
    gradient: "from-pink-500 to-rose-500",
    featured: true,
  },
  {
    slug: "9anime",
    name: "9anime / Aniwave",
    status: "shutdown",
    kind: "stream",
    blurb:
      "Hugely popular free streamer that rebranded to Aniwave, then shut itself down in 2024 citing the difficulty of continuing.",
    features: ["Was: Subbed", "Was: Dubbed"],
    endedYear: 2024,
    successor: "Was renamed from 9anime → Aniwave",
    emoji: "9️⃣",
    gradient: "from-rose-500 to-orange-400",
  },
  {
    slug: "animixplay",
    name: "AniMixPlay",
    status: "shutdown",
    kind: "stream",
    blurb:
      "Free aggregator with a slick UI that abruptly shut down in 2022, with its operator posting a cryptic farewell.",
    features: ["Was: Aggregator", "Was: Subbed"],
    endedYear: 2022,
    emoji: "🎚️",
    gradient: "from-fuchsia-500 to-pink-500",
  },
  {
    slug: "4anime",
    name: "4anime",
    status: "shutdown",
    kind: "stream",
    blurb:
      "Minimalist free streamer popular for downloads; went offline in 2021 following legal pressure (ACE).",
    features: ["Was: Subbed", "Was: Downloads"],
    endedYear: 2021,
    emoji: "4️⃣",
    gradient: "from-lime-400 to-emerald-500",
  },
  {
    slug: "horriblesubs",
    name: "HorribleSubs",
    status: "shutdown",
    kind: "download",
    blurb:
      "The de-facto weekly fansub release group for years. Disbanded in 2020; its members regrouped as SubsPlease.",
    features: ["Was: Torrents", "Was: Weekly subs"],
    endedYear: 2020,
    successor: "Became SubsPlease",
    emoji: "📦",
    gradient: "from-amber-400 to-orange-500",
  },
  {
    slug: "kissmanga",
    name: "KissManga",
    status: "shutdown",
    kind: "manga",
    blurb:
      "The manga sister site of KissAnime. Shut down alongside it in 2020; the brand lives on only in clones.",
    features: ["Was: Free manga", "Name abused by clones"],
    endedYear: 2020,
    emoji: "💄",
    gradient: "from-pink-500 to-rose-500",
  },
];

// --- helpers ---------------------------------------------------------------

export function getAllSites(): AnimeSite[] {
  return ANIME_SITES;
}

export function getSite(slug: string): AnimeSite | undefined {
  return ANIME_SITES.find((s) => s.slug === slug);
}

export function isBlocked(site: AnimeSite): boolean {
  return (site.blockedIn?.length ?? 0) > 0;
}

export interface SiteCounts {
  total: number;
  legal: number;
  free: number;
  shutdown: number;
  blocked: number;
}

export function getCounts(sites: AnimeSite[] = ANIME_SITES): SiteCounts {
  return {
    total: sites.length,
    legal: sites.filter((s) => s.status === "legal").length,
    free: sites.filter((s) => s.status === "free").length,
    shutdown: sites.filter((s) => s.status === "shutdown").length,
    blocked: sites.filter(isBlocked).length,
  };
}
