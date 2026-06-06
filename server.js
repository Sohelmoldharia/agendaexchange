/* ============================================================
   Anime Battle Simulator — standalone scout backend
   Zero dependencies. Node 18+ (uses built-in fetch).
   Run:  ANTHROPIC_API_KEY=sk-ant-... node server.js
   Then open http://localhost:3000
   ------------------------------------------------------------
   What it does:
   - Serves the game + admin + the character DB (static)
   - POST /api/scout  -> cache-first lookup; on a miss, calls the
     AI ONCE (key stays here), validates, caches to characters.json
     forever, and returns the profile.
   - Enforces limits server-side (per-IP hourly + global daily cap)
   ============================================================ */
"use strict";
const http = require("http");
const fs   = require("fs");
const path = require("path");
const crypto = require("crypto");

/* ---------- config (override with env vars) ---------- */
const CFG = {
  PORT:              Number(process.env.PORT || 8080),
  PROVIDER:          process.env.SCOUT_PROVIDER || "anthropic",      // anthropic | gemini | openai
  MODEL:             process.env.SCOUT_MODEL    || "claude-haiku-4-5",
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
  GEMINI_API_KEY:    process.env.GEMINI_API_KEY    || "",
  OPENAI_API_KEY:    process.env.OPENAI_API_KEY    || "",
  DAILY_CAP:         Number(process.env.SCOUT_DAILY_CAP || 200),     // max AI scouts/day across everyone
  PER_IP_HOURLY:     Number(process.env.SCOUT_PER_IP_HOURLY || 10),  // max AI scouts/hour per IP
};

const ROOT     = __dirname;
const DB_PATH  = path.join(ROOT, "data", "characters.json");
const STAT_KEYS = ["power","speed","durability","technique","intelligence","stamina","range"];

/* ---------- in-memory DB (loaded from disk, written back on new scouts) ---------- */
let DB = { version:1, updated:"", characters:[] };
const index = new Map();                                   // norm key -> character
const norm  = s => String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"");
const slug  = s => String(s||"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
function reindex(){
  index.clear();
  for(const c of DB.characters){
    index.set(norm(c.name)+"|"+norm(c.anime), c);
    if(!index.has(norm(c.name))) index.set(norm(c.name), c);
  }
}
function loadDB(){
  try{ DB = JSON.parse(fs.readFileSync(DB_PATH,"utf8")); if(!Array.isArray(DB.characters)) DB.characters=[]; }
  catch(e){ DB = { version:1, updated:"", characters:[] }; }
  reindex();
  console.log(`[db] loaded ${DB.characters.length} characters`);
}
let writeTimer=null;
function saveDB(){                                         // debounced atomic write
  clearTimeout(writeTimer);
  writeTimer=setTimeout(()=>{
    DB.updated = new Date().toISOString().slice(0,10);
    const tmp = DB_PATH+".tmp";
    fs.writeFileSync(tmp, JSON.stringify(DB,null,2));
    fs.renameSync(tmp, DB_PATH);
    console.log(`[db] saved ${DB.characters.length} characters`);
  }, 400);
}

/* ---------- runtime config (set from the admin panel, stored locally) ---------- */
const CFG_PATH = path.join(ROOT, ".scout-config.json");   // gitignored — holds the key
let ADMIN = { salt:"", hash:"" };
function loadConfig(){
  try{
    const j=JSON.parse(fs.readFileSync(CFG_PATH,"utf8"));
    if(j.provider) CFG.PROVIDER=j.provider;
    if(j.model) CFG.MODEL=j.model;
    if(typeof j.dailyCap==="number") CFG.DAILY_CAP=j.dailyCap;
    if(typeof j.perIpHourly==="number") CFG.PER_IP_HOURLY=j.perIpHourly;
    if(j.anthropicKey) CFG.ANTHROPIC_API_KEY=j.anthropicKey;
    if(j.geminiKey) CFG.GEMINI_API_KEY=j.geminiKey;
    if(j.openaiKey) CFG.OPENAI_API_KEY=j.openaiKey;
    if(j.adminSalt&&j.adminHash) ADMIN={salt:j.adminSalt,hash:j.adminHash};
    console.log("[config] loaded .scout-config.json");
  }catch(e){ /* none yet */ }
}
function saveConfig(){
  const j={ provider:CFG.PROVIDER, model:CFG.MODEL, dailyCap:CFG.DAILY_CAP, perIpHourly:CFG.PER_IP_HOURLY,
    anthropicKey:CFG.ANTHROPIC_API_KEY, geminiKey:CFG.GEMINI_API_KEY, openaiKey:CFG.OPENAI_API_KEY,
    adminSalt:ADMIN.salt, adminHash:ADMIN.hash };
  const tmp=CFG_PATH+".tmp"; fs.writeFileSync(tmp, JSON.stringify(j,null,2),{mode:0o600}); fs.renameSync(tmp,CFG_PATH);
}
const hashPw=(pw,salt)=>crypto.createHash("sha256").update(salt+":"+pw).digest("hex");
function checkPw(pw){ if(!ADMIN.hash) return false; try{ return crypto.timingSafeEqual(Buffer.from(hashPw(pw,ADMIN.salt)),Buffer.from(ADMIN.hash)); }catch(e){ return false; } }
const currentKey=()=> CFG.PROVIDER==="gemini"?CFG.GEMINI_API_KEY : CFG.PROVIDER==="openai"?CFG.OPENAI_API_KEY : CFG.ANTHROPIC_API_KEY;
const sendJson=(res,code,obj)=>{res.writeHead(code,{"content-type":"application/json"});res.end(JSON.stringify(obj));};
function readJson(req){return new Promise(resolve=>{let b="";req.on("data",d=>{b+=d;if(b.length>1e5)req.destroy();});req.on("end",()=>{try{resolve(JSON.parse(b||"{}"))}catch(e){resolve(null)}});req.on("error",()=>resolve(null));});}

/* ---------- validation / clamp ---------- */
const clamp=(v,lo,hi,d)=>{v=Number(v);if(!isFinite(v))v=d;return Math.max(lo,Math.min(hi,Math.round(v)));};
function sanitize(o, name, anime){
  const stats={}; STAT_KEYS.forEach(k=>stats[k]=clamp(o?.stats?.[k],0,100,50));
  let w=(Array.isArray(o?.wildcards)?o.wildcards:[]).slice(0,3).map(x=>({
    name:String(x?.name||"Hidden Power"),
    trigger_chance:Math.max(0,Math.min(1,Number(x?.trigger_chance)||0.1)),
    effect_desc:String(x?.effect_desc||""),
    stat_boost:clamp(x?.stat_boost,0,30,8)
  }));
  if(!w.length) w=[{name:"Second Wind",trigger_chance:0.12,effect_desc:"Hidden reserves.",stat_boost:8}];
  return {
    id: slug(name)+"|"+slug(anime),
    name:String(o?.name||name), anime:String(o?.anime||anime), medium:"anime",
    stats,
    pros:(Array.isArray(o?.pros)?o.pros:[]).slice(0,3).map(String).filter(Boolean),
    weaknesses:(Array.isArray(o?.weaknesses)?o.weaknesses:[]).slice(0,2).map(String).filter(Boolean),
    wildcards:w,
    signature_move:String(o?.signature_move||"—"),
    tier:["low","mid","high","top","godtier"].includes(String(o?.tier||"").toLowerCase())?String(o.tier).toLowerCase():"mid"
  };
}

/* ---------- AI call (provider-agnostic, key stays here) ---------- */
const SYS = "You are a rigorous anime/cartoon/movie power-scaling analyst. Output ONLY raw JSON — no preamble, no markdown fences.";
function userPrompt(name, anime){
  return `Generate a combat profile for "${name}" from "${anime}".
Return STRICT JSON (no fences):
{"name":"","anime":"","stats":{"power":0,"speed":0,"durability":0,"technique":0,"intelligence":0,"stamina":0,"range":0},"pros":["","",""],"weaknesses":["",""],"wildcards":[{"name":"","trigger_chance":0.0,"effect_desc":"","stat_boost":0}],"signature_move":"","tier":"low|mid|high|top|godtier"}
Stats are integers 0-100. Calibrate to a FIXED ladder so all characters are consistent: godtier 90-100 (universe-level e.g. Saitama), top 75-89 (world threats e.g. Gojo), high 60-74 (city busters), mid 40-59 (skilled super-humans), low 15-39 (street-level; John Wick power ~30; trained soldier ~18). Be honest — do NOT make everything 95+. 2 real weaknesses. 1-3 wildcards (trigger_chance 0-1, stat_boost 0-30). Output JSON now.`;
}
async function callAI(name, anime){
  const p = userPrompt(name, anime);
  if(CFG.PROVIDER==="anthropic"){
    if(!CFG.ANTHROPIC_API_KEY) throw new Error("server missing ANTHROPIC_API_KEY");
    const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",
      headers:{"content-type":"application/json","x-api-key":CFG.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01"},
      body:JSON.stringify({model:CFG.MODEL,max_tokens:1000,system:SYS,messages:[{role:"user",content:p}]})});
    if(!r.ok) throw new Error("anthropic "+r.status);
    const d=await r.json(); return (d.content||[]).map(b=>b.text||"").join("");
  }
  if(CFG.PROVIDER==="gemini"){
    if(!CFG.GEMINI_API_KEY) throw new Error("server missing GEMINI_API_KEY");
    const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${CFG.MODEL}:generateContent?key=${encodeURIComponent(CFG.GEMINI_API_KEY)}`,{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({system_instruction:{parts:[{text:SYS}]},contents:[{role:"user",parts:[{text:p}]}],generationConfig:{responseMimeType:"application/json",maxOutputTokens:1000}})});
    if(!r.ok) throw new Error("gemini "+r.status);
    const d=await r.json(); return (d?.candidates?.[0]?.content?.parts||[]).map(x=>x.text||"").join("");
  }
  if(CFG.PROVIDER==="openai"){
    if(!CFG.OPENAI_API_KEY) throw new Error("server missing OPENAI_API_KEY");
    const r=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",
      headers:{"content-type":"application/json","authorization":"Bearer "+CFG.OPENAI_API_KEY},
      body:JSON.stringify({model:CFG.MODEL,max_tokens:1000,response_format:{type:"json_object"},messages:[{role:"system",content:SYS},{role:"user",content:p}]})});
    if(!r.ok) throw new Error("openai "+r.status);
    const d=await r.json(); return d?.choices?.[0]?.message?.content||"";
  }
  throw new Error("bad SCOUT_PROVIDER");
}
function parseProfile(text, name, anime){
  let t=(text||"").trim().replace(/```json/gi,"").replace(/```/g,"").trim();
  const s=t.indexOf("{"), e=t.lastIndexOf("}"); if(s!==-1&&e!==-1) t=t.slice(s,e+1);
  return sanitize(JSON.parse(t), name, anime);
}

/* ---------- rate limiting (server-side = real) ---------- */
let day = { date:"", count:0 };
const ipHits = new Map();                                  // ip -> [timestamps]
function checkLimits(ip){
  const today = new Date().toISOString().slice(0,10);
  if(day.date!==today){ day={date:today,count:0}; }
  if(day.count >= CFG.DAILY_CAP) return "Daily scout limit reached — try a roster fighter, or come back tomorrow.";
  const now=Date.now(), hrAgo=now-3600e3;
  const hits=(ipHits.get(ip)||[]).filter(t=>t>hrAgo);
  if(hits.length >= CFG.PER_IP_HOURLY) return "You've scouted a lot this hour — slow down and try a roster fighter.";
  ipHits.set(ip, hits);
  return null;
}
function recordHit(ip){
  day.count++;
  const hits=ipHits.get(ip)||[]; hits.push(Date.now()); ipHits.set(ip, hits);
}

/* ---------- static file serving (whitelist only) ---------- */
const STATIC = {
  "/":                              ["anime-battle-simulator.html","text/html"],
  "/index.html":                    ["anime-battle-simulator.html","text/html"],
  "/anime-battle-simulator.html":   ["anime-battle-simulator.html","text/html"],
  "/admin":                         ["admin.html","text/html"],
  "/admin.html":                    ["admin.html","text/html"],
  "/data/characters.json":          ["data/characters.json","application/json"],
};
function serveStatic(res, file, type){
  fs.readFile(path.join(ROOT,file),(err,buf)=>{
    if(err){ res.writeHead(404); res.end("not found"); return; }
    res.writeHead(200,{"content-type":type,"cache-control":"no-cache"}); res.end(buf);
  });
}

/* ---------- request handler ---------- */
const server = http.createServer(async (req,res)=>{
  const url = req.url.split("?")[0];

  if(req.method==="GET" && STATIC[url]){ return serveStatic(res, STATIC[url][0], STATIC[url][1]); }

  /* ---- server AI-key config (driven by the admin panel) ---- */
  if(req.method==="GET" && url==="/api/config"){
    const today=new Date().toISOString().slice(0,10);
    return sendJson(res,200,{hasPassword:!!ADMIN.hash, hasKey:!!currentKey(), provider:CFG.PROVIDER, model:CFG.MODEL, dailyCap:CFG.DAILY_CAP, perIpHourly:CFG.PER_IP_HOURLY, todayUsed:(day&&day.date===today?day.count:0)});
  }
  if(req.method==="POST" && url==="/api/config/setup"){
    const b=await readJson(req); if(!b) return sendJson(res,400,{error:"bad request"});
    if(ADMIN.hash) return sendJson(res,403,{error:"already set up — use Save with your password (delete .scout-config.json to reset)"});
    const pw=String(b.password||""); if(pw.length<4) return sendJson(res,400,{error:"password too short (min 4 chars)"});
    ADMIN.salt=crypto.randomBytes(16).toString("hex"); ADMIN.hash=hashPw(pw,ADMIN.salt); saveConfig();
    return sendJson(res,200,{ok:true});
  }
  if(req.method==="POST" && url==="/api/config"){
    const b=await readJson(req); if(!b) return sendJson(res,400,{error:"bad request"});
    if(!ADMIN.hash) return sendJson(res,400,{error:"set an admin password first"});
    if(!checkPw(String(b.password||""))) return sendJson(res,403,{error:"wrong password"});
    if(b.provider) CFG.PROVIDER=String(b.provider);
    if(b.model) CFG.MODEL=String(b.model);
    if(b.dailyCap!=null&&isFinite(+b.dailyCap)) CFG.DAILY_CAP=Math.max(0,+b.dailyCap|0);
    if(b.perIpHourly!=null&&isFinite(+b.perIpHourly)) CFG.PER_IP_HOURLY=Math.max(0,+b.perIpHourly|0);
    const k=String(b.apiKey||"").trim();
    if(k){ if(CFG.PROVIDER==="gemini")CFG.GEMINI_API_KEY=k; else if(CFG.PROVIDER==="openai")CFG.OPENAI_API_KEY=k; else CFG.ANTHROPIC_API_KEY=k; }
    saveConfig();
    return sendJson(res,200,{ok:true, hasKey:!!currentKey(), provider:CFG.PROVIDER, model:CFG.MODEL});
  }

  if(req.method==="POST" && url==="/api/scout"){
    let body=""; req.on("data",d=>{ body+=d; if(body.length>2000) req.destroy(); });
    req.on("end", async ()=>{
      const send=(code,obj)=>{res.writeHead(code,{"content-type":"application/json"});res.end(JSON.stringify(obj));};
      let name="",anime="";
      try{ const j=JSON.parse(body||"{}"); name=String(j.name||"").trim(); anime=String(j.anime||"").trim(); }
      catch(e){ return send(400,{error:"bad request"}); }
      if(!name) return send(400,{error:"name required"});

      // 1) cache-first
      const hit = index.get(norm(name)+"|"+norm(anime)) || index.get(norm(name));
      if(hit) return send(200, hit);

      // 2) limits
      const ip = (req.headers["x-forwarded-for"]||req.socket.remoteAddress||"?").toString().split(",")[0].trim();
      const limited = checkLimits(ip);
      if(limited) return send(429,{error:limited});

      // 3) AI fetch -> cache forever
      try{
        const profile = parseProfile(await callAI(name,anime), name, anime||"Unknown");
        recordHit(ip);
        DB.characters.push(profile);
        index.set(norm(profile.name)+"|"+norm(profile.anime), profile);
        if(!index.has(norm(profile.name))) index.set(norm(profile.name), profile);
        saveDB();
        return send(200, profile);
      }catch(e){
        console.error("[scout] fail", name, e.message);
        return send(502,{error:"couldn't scout this fighter, try again"});
      }
    });
    return;
  }

  res.writeHead(404); res.end("not found");
});

loadDB();
loadConfig();
server.on("error",err=>{
  if(err.code==="EADDRINUSE"){ console.error(`\n✕ Port ${CFG.PORT} is already in use. Start on another port:\n    PORT=8090 node server.js\n`); process.exit(1); }
  throw err;
});
server.listen(CFG.PORT, "0.0.0.0", ()=>{
  console.log(`\n⚡ Anime Battle Simulator running:  http://localhost:${CFG.PORT}`);
  console.log(`   admin panel:                     http://localhost:${CFG.PORT}/admin`);
  console.log(`   provider=${CFG.PROVIDER} model=${CFG.MODEL}`);
  console.log(`   limits: ${CFG.DAILY_CAP}/day global, ${CFG.PER_IP_HOURLY}/hour per IP`);
  if(!currentKey())
    console.log(`   ⚠ no AI key yet — roster works; set one in the admin panel → 🔑 Server Key`);
});
