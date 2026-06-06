/* ============================================================
   Roster ingest — turns the rich CSV(s) in data/roster/*.csv into
   the simulator's character schema, deriving the 7 numeric stats
   from Power Tier + keyword analysis of Powers/Strengths/Weaknesses.
   Merges into data/characters.json (keeps hand-tuned stats, enriches
   everything with the new metadata fields). Deterministic.

   Run:  node data/ingest.mjs
   ============================================================ */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const DIR   = path.dirname(fileURLToPath(import.meta.url));
const ROOT  = path.join(DIR, "..");
const ROSTER_DIR = path.join(DIR, "roster");
const DB_PATH    = path.join(DIR, "characters.json");
const STAT_KEYS = ["power","speed","durability","technique","intelligence","stamina","range"];

/* ---------- Power Tier ladder (from the Legend sheet) ---------- */
const TIER = {
  universal:{base:97,enum:"godtier",boost:16},
  star:     {base:90,enum:"godtier",boost:16},
  planet:   {base:84,enum:"top",    boost:14},
  continent:{base:76,enum:"top",    boost:14},
  island:   {base:68,enum:"high",   boost:12},
  city:     {base:58,enum:"high",   boost:11},
  building: {base:46,enum:"mid",    boost:10},
  wall:     {base:34,enum:"low",    boost:8},
  human:    {base:24,enum:"low",    boost:8},
};
const tierInfo = t => TIER[String(t||"").toLowerCase().trim()] || TIER.city;

/* ---------- keyword nudges ---------- */
const POS = {
  power:        ["destruction","planet","universe","universal","reality","overwhelming","godlike","god ","omnipotent","immense","devastating","cataclysm","nuke","destroy"],
  speed:        ["speed","fast","flight","fly","teleport","instant","lightning","sonic","quick","agile","blitz","swift","warp","time ","velocity","hypersonic"],
  durability:   ["durable","tough","invulnerable","regeneration","regenerate","armor","tank","indestructible","hardened","immortal","healing","resilient","sturdy"],
  technique:    ["master","skilled","technique","precision","swordsm","martial","tactic","expert","marksman","trained","disciplined","combat","prodigy","mastery"],
  intelligence: ["genius","tactic","strateg","intelligen","mastermind","planner","analytic","calculat","scientist","leader","cunning","prodigy","smart"],
  stamina:      ["stamina","endless","limitless","endurance","regeneration","immortal","tireless","infinite","healing","relentless"],
  range:        ["ranged","beam","blast","projectile","long-range","telekinesis","magic","energy","cannon","missile","gun","bow","laser","spell","summon","ki ","aura","fireball"],
};
const NEG = {
  power:        [],
  speed:        ["slow","sluggish","immobile","ponderous"],
  durability:   ["fragile","glass","squishy","frail","mortal","vulnerable","weak body","low durability"],
  technique:    ["crude","untrained","wild","sloppy","clumsy"],
  intelligence: ["naive","reckless","arrogant","overconfiden","impulsive","hubris","pride","gullible","short-temper","hot-headed"],
  stamina:      ["drain","fatigue","tires","exhaust","time limit","time-limit","limited use","sickly","stamina"],
  range:        ["melee","close-range","close range","hand-to-hand","brawler","short range","short-range"],
};
const hits = (txt, list) => list.reduce((n,w)=>n+(txt.includes(w)?1:0),0);
const capN = v => Math.max(-22, Math.min(22, v));

/* deterministic per-character jitter so same-tier fighters differ */
function jitter(seed, stat){
  let h=2166136261; const s=seed+"|"+stat;
  for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); }
  return ((h>>>0)%9)-4;   // -4..+4
}
const clamp=(v)=>Math.max(3,Math.min(100,Math.round(v)));

function deriveStats(name, tierName, posText, negText){
  const {base:B}=tierInfo(tierName);
  const soft=50+(B-50)*0.45;
  const n={};
  for(const k of STAT_KEYS) n[k]=capN(7*hits(posText,POS[k]) - 7*hits(negText,NEG[k]));
  const raw={
    power:        B + Math.min(10,Math.max(0,n.power)),
    speed:        soft + n.speed,
    durability:   (B-3) + n.durability,
    technique:    soft + n.technique,
    intelligence: 48 + 0.25*(B-50) + n.intelligence,
    stamina:      soft + n.stamina,
    range:        (soft-4) + n.range,
  };
  const out={};
  for(const k of STAT_KEYS) out[k]=clamp(raw[k]+jitter(name,k));
  return out;
}

/* ---------- helpers ---------- */
const slug=s=>String(s||"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const splitList=s=>String(s||"").split(/[;,]/).map(x=>x.trim()).filter(Boolean);

function parseCSV(text){
  const rows=[]; let row=[],cur="",q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(q){ if(c==='"'&&text[i+1]==='"'){cur+='"';i++;} else if(c==='"'){q=false;} else cur+=c; }
    else{ if(c==='"')q=true; else if(c===","){row.push(cur);cur="";} else if(c==="\n"){row.push(cur);rows.push(row);row=[];cur="";} else if(c!=="\r")cur+=c; }
  }
  if(cur.length||row.length){row.push(cur);rows.push(row);}
  return rows.filter(r=>r.some(c=>c.trim()));
}

function rowToChar(rec){
  const name=rec["Name"], anime=rec["Franchise"]||"";
  const tierName=rec["Power Tier"]||"City";
  const powers=splitList(rec["Powers"]);
  const strengths=splitList(rec["Strengths"]);
  const weaknesses=splitList(rec["Weaknesses"]);
  const sigs=splitList(rec["Signature Abilities"]);
  const posText=(rec["Powers"]+" "+rec["Strengths"]+" "+rec["Role"]).toLowerCase();
  const negText=(rec["Weaknesses"]).toLowerCase();
  const info=tierInfo(tierName);
  const stats=deriveStats(name, tierName, posText, negText);
  const wild = sigs.length? [{
    name: sigs[0],
    trigger_chance: 0.15,
    effect_desc: "Unleashes "+sigs[0]+".",
    stat_boost: info.boost
  }] : [{name:"Hidden Reserves",trigger_chance:0.12,effect_desc:"Digs deep for more.",stat_boost:info.boost}];
  return {
    id: slug(name)+"|"+slug(anime),
    name, anime,
    medium:(rec["Medium"]||"anime").toLowerCase(),
    role: rec["Role"]||"",
    power_tier: tierName,                          // descriptive (Universal..Human)
    tier: info.enum,                               // simulator enum
    confidence: rec["Confidence"]||"",
    cross_medium_note: rec["Cross-Medium Note"]||"",
    powers,
    stats,
    stats_source: "derived",
    pros: strengths.slice(0,3),
    weaknesses: weaknesses.slice(0,3),
    signature_abilities: sigs,
    signature_move: sigs.join(", ") || (rec["Signature Abilities"]||"—"),
    wildcards: wild,
  };
}

/* ---------- load existing DB ---------- */
let DB={version:1,updated:"",characters:[]};
try{ DB=JSON.parse(fs.readFileSync(DB_PATH,"utf8")); if(!Array.isArray(DB.characters))DB.characters=[]; }catch(e){}
const byId=new Map(DB.characters.map(c=>[c.id||slug(c.name)+"|"+slug(c.anime), c]));

/* ---------- ingest all CSVs ---------- */
let added=0, enriched=0;
const files=fs.existsSync(ROSTER_DIR)?fs.readdirSync(ROSTER_DIR).filter(f=>f.endsWith(".csv")):[];
for(const f of files){
  const rows=parseCSV(fs.readFileSync(path.join(ROSTER_DIR,f),"utf8"));
  if(!rows.length) continue;
  const header=rows[0].map(h=>h.trim());
  for(let i=1;i<rows.length;i++){
    const rec={}; header.forEach((h,j)=>rec[h]=(rows[i][j]||"").trim());
    if(!rec["Name"]) continue;
    const c=rowToChar(rec);
    const ex=byId.get(c.id);
    if(ex){
      // keep curated/hand-tuned stats; enrich with new metadata + any missing fields
      const keepStats = ex.stats && STAT_KEYS.some(k=>Number(ex.stats[k])>0) && ex.stats_source!=="derived";
      const merged={
        ...c, ...ex,
        role: ex.role||c.role,
        power_tier: ex.power_tier||c.power_tier,
        confidence: ex.confidence||c.confidence,
        cross_medium_note: ex.cross_medium_note||c.cross_medium_note,
        powers: (ex.powers&&ex.powers.length)?ex.powers:c.powers,
        signature_abilities: (ex.signature_abilities&&ex.signature_abilities.length)?ex.signature_abilities:c.signature_abilities,
        pros: (ex.pros&&ex.pros.length)?ex.pros:c.pros,
        weaknesses: (ex.weaknesses&&ex.weaknesses.length)?ex.weaknesses:c.weaknesses,
        stats: keepStats?ex.stats:c.stats,
        stats_source: keepStats?(ex.stats_source||"manual"):"derived",
        tier: keepStats?(ex.tier||c.tier):c.tier,
      };
      byId.set(c.id, merged); enriched++;
    } else {
      byId.set(c.id, c); added++;
    }
  }
}

DB.characters=[...byId.values()];
DB.updated=new Date().toISOString().slice(0,10);
fs.writeFileSync(DB_PATH, JSON.stringify(DB,null,2));
console.log(`ingest: +${added} new, ${enriched} enriched, total ${DB.characters.length}`);
const byTier={}; DB.characters.forEach(c=>byTier[c.power_tier||"?"]=(byTier[c.power_tier||"?"]||0)+1);
console.log("by power tier:", byTier);
