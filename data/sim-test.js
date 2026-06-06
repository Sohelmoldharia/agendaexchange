/* ============================================================
   Battle-engine test harness.  Run: node data/sim-test.js
   Verifies the engine behaves sensibly:
     - mirror matches ~50/50
     - close matchups stay competitive (never always 100-0)
     - big mismatches are decisive
     - clever / hax underdogs steal real (but rare) upsets
   ============================================================ */
const path = require("path");
const E = require(path.join(__dirname, "..", "engine.js"));
const DB = require("./characters.json").characters;

const N = 4000;
function rate(A, B, n = N) {
  let a = 0, b = 0, d = 0, t = 0, g = 0;
  for (let i = 0; i < n; i++) {
    const r = E.simulateDetailed(A, B);
    t += r.turns; g += r.gambits;
    if (r.winner === "f1") a++; else if (r.winner === "f2") b++; else d++;
  }
  return { a: a / n * 100, b: b / n * 100, draw: d / n * 100, turns: t / n, gambits: g / n };
}
const S = (p, w = {}) => ({ name: p, stats: w.s, powers: w.powers || [], pros: w.pros || [], wildcards: w.wc || [{ name: "x", trigger_chance: 0.12, effect_desc: "", stat_boost: 8 }], signature_move: w.sig || "" });
const stat = (p, sp, du, te, int, st, ra) => ({ power: p, speed: sp, durability: du, technique: te, intelligence: int, stamina: st, range: ra });
const find = n => DB.find(c => c.name.toLowerCase() === n.toLowerCase());

let pass = 0, fail = 0;
function check(name, cond, info) {
  (cond ? (pass++, console.log("  \x1b[32m✓\x1b[0m " + name))
        : (fail++, console.log("  \x1b[31m✗\x1b[0m " + name + "   " + (info || ""))));
}

console.log("\n=== SYNTHETIC (controlled) ===");

// 1) mirror match -> ~50/50
{
  const f = S("Mirror", { s: stat(70, 70, 70, 70, 70, 70, 70) });
  const r = rate(f, f);
  check(`mirror ~50/50 (got ${r.a.toFixed(0)}/${r.b.toFixed(0)}, ${r.turns.toFixed(1)} turns)`,
    Math.abs(r.a - r.b) < 8, "should be symmetric");
  check(`mirror fight length sane (${r.turns.toFixed(1)} turns)`, r.turns > 5 && r.turns < 45);
}

// 2) two equal mid fighters -> competitive
{
  const x = S("MidX", { s: stat(55, 55, 55, 55, 55, 55, 55) });
  const y = S("MidY", { s: stat(55, 55, 55, 55, 55, 55, 55) });
  const r = rate(x, y);
  check(`equal fighters competitive (${r.a.toFixed(0)}/${r.b.toFixed(0)})`, Math.abs(r.a - r.b) < 8);
}

// 3) slight edge -> favored but not a blowout
{
  const strong = S("Edge+", { s: stat(72, 70, 70, 70, 68, 70, 65) });
  const weak   = S("Edge-", { s: stat(64, 66, 66, 66, 62, 66, 60) });
  const r = rate(strong, weak);
  check(`slight edge favored (${r.a.toFixed(0)}%) and competitive`, r.a > 52 && r.a < 80, `got ${r.a.toFixed(0)}%`);
}

// 4) big mismatch (no hax) -> decisive, but not necessarily perfect
{
  const god = S("Brute", { s: stat(98, 96, 96, 90, 70, 95, 90) });
  const low = S("Mook",  { s: stat(25, 40, 30, 35, 30, 45, 30) });
  const r = rate(god, low);
  check(`mismatch decisive (god ${r.a.toFixed(0)}%)`, r.a >= 90, `got ${r.a.toFixed(0)}%`);
}

// 5) THE LOKI TEST: weak but cunning trickster vs raw godtier brute
{
  const goku = S("Brute God", { s: stat(98, 96, 96, 88, 65, 95, 88), powers: ["ki", "super strength", "flight"] });
  const loki = S("Trickster", {
    s: stat(45, 70, 45, 78, 92, 65, 70),
    powers: ["illusion", "reflection", "shapeshift", "mind control", "deception"],
    pros: ["tricks stronger foes", "reality-bending illusions"],
    wc: [{ name: "Mirror Stab", trigger_chance: 0.15, effect_desc: "reflection illusion counter", stat_boost: 10 }]
  });
  const haxL = E.computeHax(loki), haxG = E.computeHax(goku);
  const r = rate(goku, loki);
  console.log(`     hax: trickster=${haxL.toFixed(2)} brute=${haxG.toFixed(2)} | avg gambits/fight=${r.gambits.toFixed(2)}`);
  check(`brute still usually wins (${r.a.toFixed(0)}%)`, r.a > 65, `got ${r.a.toFixed(0)}%`);
  check(`but trickster steals upsets "in some instances" (${r.b.toFixed(0)}%)`,
    r.b >= 6 && r.b <= 40, `got ${r.b.toFixed(0)}% — want 6-40%`);
  // hax matters: same weak fighter WITHOUT hax should win far less
  const plain = S("Plain", { s: stat(45, 70, 45, 78, 92, 65, 70), powers: ["punch"], pros: ["fast"] });
  const r2 = rate(goku, plain);
  check(`hax materially helps the underdog (${r.b.toFixed(0)}% vs ${r2.b.toFixed(0)}% without hax)`,
    r.b > r2.b + 4, `hax=${r.b.toFixed(0)}% plain=${r2.b.toFixed(0)}%`);
}

// 6) high-IQ underdog out-reads a stronger but dumber bruiser
{
  const dumb = S("Bruiser", { s: stat(82, 70, 80, 60, 35, 80, 55) });
  const smart = S("Genius", { s: stat(70, 74, 66, 80, 95, 70, 65) });
  const r = rate(dumb, smart);
  check(`brains close the gap on a dumb bruiser (genius ${r.b.toFixed(0)}%)`, r.b >= 30, `got ${r.b.toFixed(0)}%`);
}

console.log("\n=== REAL ROSTER ===");
function show(n1, n2) {
  const A = find(n1), B = find(n2);
  if (!A || !B) { console.log(`  (skip ${n1} vs ${n2} — not in roster)`); return null; }
  const r = rate(A, B, 2000);
  console.log(`  ${n1.padEnd(16)} ${r.a.toFixed(0).padStart(3)}% — ${r.b.toFixed(0)}% ${n2}   (${r.turns.toFixed(0)} turns, hax ${E.computeHax(A).toFixed(2)}/${E.computeHax(B).toFixed(2)})`);
  return r;
}
{
  const g = find("Goku");
  if (g) { const r = rate(g, g, 2000); check(`Goku mirror ~50/50 (${r.a.toFixed(0)}/${r.b.toFixed(0)})`, Math.abs(r.a - r.b) < 9); }
}
show("Goku", "Saitama");
show("Naruto Uzumaki", "Monkey D. Luffy");
show("Gojo Satoru", "Naruto Uzumaki");
const gi = show("Goku", "Isagi Yoichi");
if (gi) check(`Goku massively favored vs Isagi (${gi.a.toFixed(0)}%)`, gi.a >= 92, `got ${gi.a.toFixed(0)}%`);
show("Levi Ackerman", "Batman");
show("Saitama", "Naruto Uzumaki");

console.log(`\n=== ${pass} passed, ${fail} failed ===\n`);
process.exit(fail ? 1 : 0);
