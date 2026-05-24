import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const MIN_PRICE = 0.01;
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

// ---------- deterministic RNG so each character is stable across reseeds ----------
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// ---------- gradient palette (avatar tiles, picked by hash for variety) ----------
const GRADIENTS = [
  "from-violet-500 to-fuchsia-500",
  "from-fuchsia-500 to-pink-500",
  "from-rose-500 to-orange-400",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-teal-400 to-cyan-500",
  "from-sky-500 to-indigo-500",
  "from-indigo-500 to-violet-600",
  "from-lime-400 to-emerald-500",
  "from-red-500 to-rose-600",
  "from-cyan-400 to-blue-500",
  "from-purple-500 to-indigo-500",
  "from-yellow-400 to-amber-500",
  "from-pink-500 to-rose-500",
  "from-blue-500 to-violet-500",
];
const gradientFor = (key: string) => GRADIENTS[hashStr(key) % GRADIENTS.length];

type Tier = "legend" | "star" | "rising";
const TIERS: Record<
  Tier,
  { price: [number, number]; liq: [number, number]; float: [number, number]; vol: number }
> = {
  legend: { price: [160, 520], liq: [9000, 16000], float: [6e6, 22e6], vol: 0.015 },
  star: { price: [45, 160], liq: [4500, 9000], float: [1.5e6, 8e6], vol: 0.025 },
  rising: { price: [6, 45], liq: [1800, 4500], float: [3e5, 2e6], vol: 0.042 },
};

function genHistory(rng: () => number, basePrice: number, vol: number) {
  const now = Date.now();
  const start = now - 60 * 864e5;
  const stamps: number[] = [];
  // older history is coarse, recent history is dense for nicer multi-range charts
  for (let t = start; t < now - 14 * 864e5; t += 12 * 36e5) stamps.push(t);
  for (let t = now - 14 * 864e5; t < now - 2 * 864e5; t += 3 * 36e5) stamps.push(t);
  for (let t = now - 2 * 864e5; t <= now; t += 30 * 6e4) stamps.push(t);

  let price = basePrice * (0.75 + rng() * 0.5);
  const points = stamps.map((t) => {
    const reversion = 0.02 * ((basePrice - price) / basePrice);
    const noise = (rng() * 2 - 1) * vol;
    price = Math.max(MIN_PRICE, price * (1 + reversion + noise));
    return { timestamp: new Date(t), price: round2(price) };
  });
  return { points, finalPrice: points[points.length - 1].price };
}

// ---------- the roster: Category -> Series -> Characters ----------
type Char = { name: string; ticker: string; emoji: string; blurb: string; tier: Tier };
type SeriesData = { name: string; emoji: string; blurb: string; characters: Char[] };
type CategoryData = {
  name: string;
  emoji: string;
  gradient: string;
  blurb: string;
  series: SeriesData[];
};

const DATA: CategoryData[] = [
  {
    name: "Anime",
    emoji: "🌸",
    gradient: "from-pink-500 to-rose-500",
    blurb: "Shonen legends, swordsmen, and sorcerers.",
    series: [
      {
        name: "Naruto",
        emoji: "🍥",
        blurb: "Ninja of the Hidden Leaf.",
        characters: [
          { name: "Naruto Uzumaki", ticker: "NRTO", emoji: "🍥", blurb: "The knucklehead ninja who became Hokage.", tier: "legend" },
          { name: "Sasuke Uchiha", ticker: "SASK", emoji: "⚡", blurb: "Brooding rival with lightning in his veins.", tier: "star" },
          { name: "Kakashi Hatake", ticker: "KKSH", emoji: "📖", blurb: "Copy Ninja. Always late, always reading.", tier: "star" },
          { name: "Itachi Uchiha", ticker: "ITCH", emoji: "🔥", blurb: "Tragic genius of the Sharingan.", tier: "star" },
        ],
      },
      {
        name: "One Piece",
        emoji: "🏴‍☠️",
        blurb: "Pirates chasing the One Piece.",
        characters: [
          { name: "Monkey D. Luffy", ticker: "LUFY", emoji: "👒", blurb: "Rubber-bodied captain gunning for Pirate King.", tier: "legend" },
          { name: "Roronoa Zoro", ticker: "ZORO", emoji: "⚔️", blurb: "Three-sword swordsman with no sense of direction.", tier: "star" },
          { name: "Nami", ticker: "NAMI", emoji: "🍊", blurb: "Navigator who weaponizes the weather.", tier: "rising" },
          { name: "Sanji", ticker: "SNJI", emoji: "🚬", blurb: "Black Leg chef who fights with his feet.", tier: "rising" },
        ],
      },
      {
        name: "Dragon Ball",
        emoji: "🐉",
        blurb: "Saiyans pushing past their limits.",
        characters: [
          { name: "Goku", ticker: "GOKU", emoji: "🥋", blurb: "Saiyan who trains to fight stronger foes.", tier: "legend" },
          { name: "Vegeta", ticker: "VGTA", emoji: "💪", blurb: "Prince of all Saiyans. Eternal rival.", tier: "star" },
          { name: "Gohan", ticker: "GOHN", emoji: "📗", blurb: "Scholar with hidden world-ending power.", tier: "rising" },
          { name: "Frieza", ticker: "FRZA", emoji: "❄️", blurb: "Galactic tyrant with many forms.", tier: "star" },
        ],
      },
      {
        name: "Demon Slayer",
        emoji: "⚔️",
        blurb: "Breath styles versus demons.",
        characters: [
          { name: "Tanjiro Kamado", ticker: "TNJR", emoji: "🌊", blurb: "Kind-hearted slayer with a water breath.", tier: "star" },
          { name: "Nezuko Kamado", ticker: "NZKO", emoji: "🎋", blurb: "Demon who protects humans. Bamboo included.", tier: "star" },
          { name: "Zenitsu", ticker: "ZNTS", emoji: "⚡", blurb: "Coward who's unstoppable while asleep.", tier: "rising" },
          { name: "Rengoku", ticker: "RNGK", emoji: "🔥", blurb: "Flame Hashira. Set your heart ablaze.", tier: "star" },
        ],
      },
      {
        name: "Attack on Titan",
        emoji: "🗡️",
        blurb: "Humanity behind the walls.",
        characters: [
          { name: "Eren Yeager", ticker: "EREN", emoji: "💥", blurb: "Boy who'd raze the world for freedom.", tier: "star" },
          { name: "Mikasa Ackerman", ticker: "MKSA", emoji: "🧣", blurb: "Elite soldier, fiercely loyal.", tier: "star" },
          { name: "Levi Ackerman", ticker: "LEVI", emoji: "🧹", blurb: "Humanity's strongest soldier.", tier: "legend" },
        ],
      },
      {
        name: "Jujutsu Kaisen",
        emoji: "👹",
        blurb: "Sorcerers exorcising cursed spirits.",
        characters: [
          { name: "Satoru Gojo", ticker: "GOJO", emoji: "🔵", blurb: "The strongest. Infinity at his fingertips.", tier: "legend" },
          { name: "Yuji Itadori", ticker: "YUJI", emoji: "👊", blurb: "Vessel of Sukuna with a big heart.", tier: "star" },
          { name: "Megumi Fushiguro", ticker: "MGMI", emoji: "🐺", blurb: "Summons shikigami shadows.", tier: "rising" },
        ],
      },
    ],
  },
  {
    name: "Gaming",
    emoji: "🎮",
    gradient: "from-violet-500 to-indigo-500",
    blurb: "Mascots, heroes, and final bosses.",
    series: [
      {
        name: "Super Mario",
        emoji: "🍄",
        blurb: "The Mushroom Kingdom's finest.",
        characters: [
          { name: "Mario", ticker: "MARO", emoji: "🍄", blurb: "It's-a him. Gaming's most famous plumber.", tier: "legend" },
          { name: "Luigi", ticker: "LUGI", emoji: "👻", blurb: "Taller, greener, slightly braver than you'd think.", tier: "star" },
          { name: "Princess Peach", ticker: "PECH", emoji: "👑", blurb: "Royalty of the Mushroom Kingdom.", tier: "star" },
          { name: "Bowser", ticker: "BWSR", emoji: "🐢", blurb: "Spiky king of the Koopas.", tier: "star" },
          { name: "Yoshi", ticker: "YOSH", emoji: "🦖", blurb: "Loyal dino with a very long tongue.", tier: "rising" },
        ],
      },
      {
        name: "The Legend of Zelda",
        emoji: "🗡️",
        blurb: "Hyrule's eternal struggle.",
        characters: [
          { name: "Link", ticker: "LINK", emoji: "🗡️", blurb: "Silent hero of the Triforce of Courage.", tier: "legend" },
          { name: "Zelda", ticker: "ZLDA", emoji: "👑", blurb: "Princess bearing the Triforce of Wisdom.", tier: "star" },
          { name: "Ganondorf", ticker: "GNON", emoji: "🐗", blurb: "King of Evil. The recurring final boss.", tier: "star" },
        ],
      },
      {
        name: "Pokémon",
        emoji: "⚡",
        blurb: "Gotta trade 'em all.",
        characters: [
          { name: "Pikachu", ticker: "PIKA", emoji: "⚡", blurb: "The electric mascot of an empire.", tier: "legend" },
          { name: "Charizard", ticker: "CHAR", emoji: "🔥", blurb: "Fire-breathing fan favorite.", tier: "legend" },
          { name: "Mewtwo", ticker: "MEW2", emoji: "🧬", blurb: "Genetically engineered psychic powerhouse.", tier: "star" },
          { name: "Eevee", ticker: "EVEE", emoji: "🦊", blurb: "The one with all the evolutions.", tier: "rising" },
        ],
      },
      {
        name: "Sonic the Hedgehog",
        emoji: "💨",
        blurb: "Gotta go fast.",
        characters: [
          { name: "Sonic", ticker: "SONC", emoji: "💙", blurb: "The blue blur. Allergic to slow.", tier: "legend" },
          { name: "Tails", ticker: "TAIL", emoji: "🦊", blurb: "Two-tailed fox who flies via propeller.", tier: "rising" },
          { name: "Shadow", ticker: "SHDW", emoji: "🖤", blurb: "The edgy, brooding ultimate life form.", tier: "star" },
        ],
      },
      {
        name: "Minecraft",
        emoji: "⛏️",
        blurb: "Blocks, mobs, and infinite worlds.",
        characters: [
          { name: "Steve", ticker: "STVE", emoji: "⛏️", blurb: "The blocky everyman builder.", tier: "star" },
          { name: "Creeper", ticker: "CRPR", emoji: "💚", blurb: "Aw man. The original jump scare.", tier: "star" },
          { name: "Enderman", ticker: "ENDR", emoji: "🟪", blurb: "Don't look it in the eyes.", tier: "rising" },
        ],
      },
      {
        name: "Final Fantasy",
        emoji: "✨",
        blurb: "JRPG icons across the ages.",
        characters: [
          { name: "Cloud Strife", ticker: "CLUD", emoji: "⚔️", blurb: "Spiky merc with an oversized sword.", tier: "star" },
          { name: "Sephiroth", ticker: "SPHR", emoji: "🗡️", blurb: "One-winged angel, the iconic villain.", tier: "legend" },
          { name: "Tifa Lockhart", ticker: "TIFA", emoji: "🥊", blurb: "Bare-knuckle brawler with a big heart.", tier: "rising" },
        ],
      },
    ],
  },
  {
    name: "Movies",
    emoji: "🎬",
    gradient: "from-amber-500 to-orange-500",
    blurb: "Blockbuster heroes and villains.",
    series: [
      {
        name: "Marvel",
        emoji: "🦸",
        blurb: "Earth's mightiest heroes.",
        characters: [
          { name: "Iron Man", ticker: "IRON", emoji: "🤖", blurb: "Genius, billionaire, playboy, philanthropist.", tier: "legend" },
          { name: "Spider-Man", ticker: "SPDR", emoji: "🕷️", blurb: "Your friendly neighborhood wall-crawler.", tier: "legend" },
          { name: "Thor", ticker: "THOR", emoji: "🔨", blurb: "God of Thunder, wielder of Mjolnir.", tier: "star" },
          { name: "Captain America", ticker: "CAPA", emoji: "🛡️", blurb: "The first Avenger. Can do this all day.", tier: "star" },
          { name: "Thanos", ticker: "THNS", emoji: "🟣", blurb: "The Mad Titan. Perfectly balanced.", tier: "star" },
        ],
      },
      {
        name: "Star Wars",
        emoji: "🌌",
        blurb: "A galaxy far, far away.",
        characters: [
          { name: "Darth Vader", ticker: "VADR", emoji: "🔴", blurb: "The Dark Lord of the Sith. Heavy breathing.", tier: "legend" },
          { name: "Luke Skywalker", ticker: "LUKE", emoji: "💫", blurb: "Farmboy turned Jedi Knight.", tier: "star" },
          { name: "Yoda", ticker: "YODA", emoji: "🟢", blurb: "Wise, the Force is strong with this one.", tier: "legend" },
          { name: "Grogu", ticker: "GROG", emoji: "👶", blurb: "Baby Yoda. The internet's favorite child.", tier: "star" },
        ],
      },
      {
        name: "Harry Potter",
        emoji: "⚡",
        blurb: "The Wizarding World.",
        characters: [
          { name: "Harry Potter", ticker: "HPOT", emoji: "⚡", blurb: "The Boy Who Lived.", tier: "legend" },
          { name: "Hermione Granger", ticker: "HRMN", emoji: "📚", blurb: "Brightest witch of her age.", tier: "star" },
          { name: "Lord Voldemort", ticker: "VLDM", emoji: "🐍", blurb: "He Who Must Not Be Named.", tier: "star" },
          { name: "Albus Dumbledore", ticker: "DMBL", emoji: "🧙", blurb: "Headmaster with a flair for the dramatic.", tier: "star" },
        ],
      },
      {
        name: "The Lord of the Rings",
        emoji: "💍",
        blurb: "One ring to rule them all.",
        characters: [
          { name: "Gandalf", ticker: "GNDF", emoji: "🧙", blurb: "You shall not pass.", tier: "legend" },
          { name: "Frodo Baggins", ticker: "FRDO", emoji: "🦶", blurb: "The hobbit who carried the burden.", tier: "star" },
          { name: "Gollum", ticker: "GLLM", emoji: "💍", blurb: "My precious. Conflicted to the core.", tier: "rising" },
          { name: "Aragorn", ticker: "ARGN", emoji: "👑", blurb: "The rightful king of Gondor.", tier: "star" },
        ],
      },
    ],
  },
  {
    name: "Cartoons",
    emoji: "📺",
    gradient: "from-cyan-500 to-blue-500",
    blurb: "Saturday-morning to streaming legends.",
    series: [
      {
        name: "SpongeBob SquarePants",
        emoji: "🧽",
        blurb: "Life under the sea in Bikini Bottom.",
        characters: [
          { name: "SpongeBob", ticker: "SPNG", emoji: "🧽", blurb: "Optimistic fry cook of the Krusty Krab.", tier: "legend" },
          { name: "Patrick Star", ticker: "PTRK", emoji: "⭐", blurb: "A starfish of questionable wisdom.", tier: "star" },
          { name: "Squidward", ticker: "SQID", emoji: "🦑", blurb: "Clarinet enthusiast, perpetually annoyed.", tier: "rising" },
        ],
      },
      {
        name: "Rick and Morty",
        emoji: "🛸",
        blurb: "Interdimensional misadventures.",
        characters: [
          { name: "Rick Sanchez", ticker: "RICK", emoji: "🧪", blurb: "Smartest man in the universe. Wubba lubba dub dub.", tier: "legend" },
          { name: "Morty Smith", ticker: "MRTY", emoji: "😬", blurb: "Anxious grandson, reluctant sidekick.", tier: "star" },
          { name: "Mr. Meeseeks", ticker: "MEEK", emoji: "💙", blurb: "Existence is pain. Can do!", tier: "rising" },
        ],
      },
      {
        name: "The Simpsons",
        emoji: "🍩",
        blurb: "America's favorite yellow family.",
        characters: [
          { name: "Homer Simpson", ticker: "HOMR", emoji: "🍩", blurb: "D'oh! Patriarch of Springfield.", tier: "legend" },
          { name: "Bart Simpson", ticker: "BART", emoji: "🛹", blurb: "Eat my shorts. Springfield's bad boy.", tier: "star" },
          { name: "Lisa Simpson", ticker: "LISA", emoji: "🎷", blurb: "Saxophone prodigy and the family's conscience.", tier: "rising" },
        ],
      },
      {
        name: "Avatar: The Last Airbender",
        emoji: "🔥",
        blurb: "Master of all four elements.",
        characters: [
          { name: "Aang", ticker: "AANG", emoji: "🌪️", blurb: "The last airbender and the Avatar.", tier: "legend" },
          { name: "Zuko", ticker: "ZUKO", emoji: "🔥", blurb: "Banished prince on a redemption arc.", tier: "star" },
          { name: "Toph Beifong", ticker: "TOPH", emoji: "🪨", blurb: "Blind earthbending prodigy who invented metalbending.", tier: "star" },
        ],
      },
    ],
  },
];

async function main() {
  console.log("Clearing existing data...");
  await prisma.pricePoint.deleteMany();
  await prisma.order.deleteMany();
  await prisma.holding.deleteMany();
  await prisma.watchlistItem.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.series.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const seenTickers = new Set<string>();
  const seenSlugs = new Set<string>();
  let categoryOrder = 0;
  const createdStocks: { id: string; price: number }[] = [];

  for (const cat of DATA) {
    const category = await prisma.category.create({
      data: {
        name: cat.name,
        slug: slugify(cat.name),
        emoji: cat.emoji,
        gradient: cat.gradient,
        blurb: cat.blurb,
        sortOrder: categoryOrder++,
      },
    });

    for (const ser of cat.series) {
      const series = await prisma.series.create({
        data: {
          name: ser.name,
          slug: slugify(ser.name),
          emoji: ser.emoji,
          blurb: ser.blurb,
          categoryId: category.id,
        },
      });

      for (const ch of ser.characters) {
        if (seenTickers.has(ch.ticker)) throw new Error(`Duplicate ticker: ${ch.ticker}`);
        seenTickers.add(ch.ticker);
        const slug = slugify(ch.name);
        if (seenSlugs.has(slug)) throw new Error(`Duplicate slug: ${slug}`);
        seenSlugs.add(slug);

        const rng = mulberry32(hashStr(ch.ticker));
        const t = TIERS[ch.tier];
        const basePrice = round2(t.price[0] + rng() * (t.price[1] - t.price[0]));
        const liquidity = Math.round(t.liq[0] + rng() * (t.liq[1] - t.liq[0]));
        const floatShares = Math.round(t.float[0] + rng() * (t.float[1] - t.float[0]));
        const { points, finalPrice } = genHistory(rng, basePrice, t.vol);
        const sharesHeld = Math.round(floatShares * (0.02 + rng() * 0.08));

        const stock = await prisma.stock.create({
          data: {
            name: ch.name,
            ticker: ch.ticker,
            slug,
            blurb: ch.blurb,
            emoji: ch.emoji,
            gradient: gradientFor(ch.ticker),
            price: finalPrice,
            basePrice,
            liquidity,
            floatShares,
            sharesHeld,
            volume: round2(finalPrice * sharesHeld * (0.1 + rng() * 0.4)),
            seriesId: series.id,
          },
        });
        createdStocks.push({ id: stock.id, price: finalPrice });

        await prisma.pricePoint.createMany({
          data: points.map((p) => ({
            stockId: stock.id,
            price: p.price,
            timestamp: p.timestamp,
          })),
        });
      }
    }
  }

  console.log(`Created ${createdStocks.length} stocks.`);

  // Demo account so people can explore immediately.
  const demo = await prisma.user.create({
    data: {
      email: "demo@fandx.test",
      username: "demo",
      passwordHash: await bcrypt.hash("demo1234", 10),
      cashBalance: 25_000,
    },
  });

  // Give the demo user a few holdings + a watchlist.
  const picks = createdStocks.slice(0, 4);
  let spent = 0;
  for (const p of picks) {
    const shares = Math.max(1, Math.round((1500 / p.price) as number));
    const cost = round2(shares * p.price);
    spent += cost;
    await prisma.holding.create({
      data: { userId: demo.id, stockId: p.id, shares, avgCost: p.price },
    });
    await prisma.stock.update({
      where: { id: p.id },
      data: { sharesHeld: { increment: shares } },
    });
  }
  await prisma.user.update({
    where: { id: demo.id },
    data: { cashBalance: round2(25_000 - spent) },
  });
  for (const p of createdStocks.slice(5, 11)) {
    await prisma.watchlistItem.create({
      data: { userId: demo.id, stockId: p.id },
    });
  }

  console.log("Seeded demo user: demo@fandx.test / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
