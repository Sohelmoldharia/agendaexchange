/* ============================================================
   Battle engine — shared by the game (browser) and the Node test
   harness (data/sim-test.js). Single source of truth.

   Beyond raw stats, it models the things that make power-scaling
   debates fun — a weaker, cleverer fighter (Loki) CAN steal a win
   from a stronger one (Goku) "in some instances":

     power        base damage
     technique    damage + crit chance + counters
     durability   bigger effective-HP pool
     speed        turn order, dodge, double-strike
     intelligence dodge, counters, tighter variance, and EXPLOITS
                  (out-reads a dumber opponent for a big hit)
     stamina      effective-HP + slower decay
     range        opening "poke" before melee closes
     wildcards    per-turn trigger -> temporary stat boost
     hax (derived) reflection / illusion / soul / time / mind /
                  reality tricks -> a "gambit" blow that bypasses
                  raw power. This is the underdog's real path to an
                  upset, scaled by how cunning they are.
   ============================================================ */
(function (root) {
  function gaussian(mean, std) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

  // hax = bypass/trick potential, read from the character's described abilities
  const HAX_WORDS = [
    "reflect","illusion","mind control","mind-control","soul","time stop","stop time",
    "time manip","rewind","seal","erase","reality","one-shot","one shot","oneshot",
    "instant death","insta-kill","instakill","instant kill","curse","negate","nullify",
    "intangib","phas","possess","hypno","paraly","petrif","probability","shapeshift",
    "deceiv","trick","void","dimension","banish","absorb","copy ability","steal ability"
  ];
  function haxText(C) {
    return [
      (C.powers || []).join(" "),
      (C.pros || []).join(" "),
      C.signature_move || "",
      ...((C.wildcards || []).map(w => (w.name || "") + " " + (w.effect_desc || "")))
    ].join(" ").toLowerCase();
  }
  function computeHax(C) {
    const t = haxText(C);
    let h = 0;
    for (const k of HAX_WORDS) if (t.includes(k)) h++;
    return clamp(h * 0.16, 0, 0.85);
  }

  // Full battle -> { winner:"f1"|"f2"|"draw", turns, hpA, hpB, gambits }
  function simulateDetailed(A, B) {
    const sA = A.stats, sB = B.stats;
    const haxA = computeHax(A), haxB = computeHax(B);

    let hpA = 90 + sA.durability * 0.7 + sA.stamina * 0.1;
    let hpB = 90 + sB.durability * 0.7 + sB.stamina * 0.1;
    const maxA = hpA, maxB = hpB;

    // opening: the longer-ranged fighter pokes before melee closes
    const rGap = sA.range - sB.range;
    if (rGap > 10) hpB -= clamp((rGap - 10) * 0.25, 0, 18);
    else if (rGap < -10) hpA -= clamp((-rGap - 10) * 0.25, 0, 18);

    const initA = sA.speed * 0.8 + sA.range * 0.2 + 5;
    const initB = sB.speed * 0.8 + sB.range * 0.2 + 5;
    let gambits = 0;

    // one attack -> damage to defender (negative = a counter that hits the attacker)
    function strike(atk, def, turn, haxAtk) {
      const a = atk.stats, d = def.stats;

      // --- hax gambit: a trick that bypasses raw power, can't be dodged ---
      // chance scales with hax rating and the attacker's cunning (intelligence)
      const gambitChance = haxAtk * clamp(0.07 + a.intelligence / 1300, 0, 0.18);
      if (haxAtk > 0 && Math.random() < gambitChance) {
        gambits++;
        return clamp(26 + a.technique * 0.22 + a.intelligence * 0.10 + gaussian(0, 6), 14, 75);
      }

      const decay = clamp(1 - turn * (1 - a.stamina / 100) * 0.010, 0.5, 1);
      let boost = 0;
      for (const w of (atk.wildcards || [])) if (Math.random() < w.trigger_chance) boost += w.stat_boost;
      const power = clamp(a.power * decay + boost, 1, 130);
      const tech = clamp(a.technique * decay + boost, 1, 130);

      // dodge from speed gap + defender battle-IQ
      const dodge = clamp((d.speed - a.speed) / 420 + d.intelligence / 1100, 0, 0.32);
      if (Math.random() < dodge) {
        const counter = clamp(d.technique / 600 + d.intelligence / 1200, 0, 0.25);
        if (Math.random() < counter) return -clamp(d.power * 0.10, 1, 12);
        return 0;
      }

      const offense = power * 0.55 + tech * 0.45;
      let dmg = offense * 0.165;
      if (Math.random() < clamp(tech / 420 + 0.03, 0, 0.30)) dmg *= 1.7;              // crit
      // exploit: out-thinking / out-teching the opponent lands a big read
      const exploit = clamp((a.intelligence - d.intelligence) / 640 + (a.technique - d.technique) / 900, 0, 0.12);
      if (Math.random() < exploit) dmg *= 1.8;
      const sigma = 0.24 + (100 - a.intelligence) * 0.0018;                            // upset variance
      dmg *= clamp(1 + gaussian(0, sigma), 0.25, 2.2);
      return clamp(dmg, 1, 75);
    }

    function apply(atk, def, defSide, turn, haxAtk) {
      let dmg = strike(atk, def, turn, haxAtk);
      if (dmg < 0) { if (atk === A) hpA += dmg; else hpB += dmg; }
      else if (defSide === "B") hpB -= dmg; else hpA -= dmg;
      if (dmg >= 0) {
        const extra = clamp((atk.stats.speed - def.stats.speed) / 300, 0, 0.22);
        if (Math.random() < extra) {
          const d2 = strike(atk, def, turn, haxAtk);
          if (d2 > 0) { if (defSide === "B") hpB -= d2; else hpA -= d2; }
        }
      }
    }

    let turns = 0;
    for (let turn = 0; turn < 60; turn++) {
      turns = turn + 1;
      const aFirst = Math.random() < initA / (initA + initB);
      const order = aFirst
        ? [[A, B, "B", haxA], [B, A, "A", haxB]]
        : [[B, A, "A", haxB], [A, B, "B", haxA]];
      for (const [atk, def, side, hax] of order) {
        apply(atk, def, side, turn, hax);
        if (hpA <= 0 || hpB <= 0) break;
      }
      if (hpA <= 0 || hpB <= 0) break;
    }

    let winner;
    if (hpA <= 0 && hpB <= 0) winner = hpA === hpB ? "draw" : (hpA > hpB ? "f1" : "f2");
    else if (hpA <= 0) winner = "f2";
    else if (hpB <= 0) winner = "f1";
    else { const pa = hpA / maxA, pb = hpB / maxB; winner = Math.abs(pa - pb) < 0.02 ? "draw" : (pa > pb ? "f1" : "f2"); }
    return { winner, turns, hpA, hpB, gambits };
  }

  function simulateBattle(A, B) { return simulateDetailed(A, B).winner; }
  function runMonteCarlo(A, B, n = 100) {
    const seq = [];
    for (let i = 0; i < n; i++) seq.push(simulateBattle(A, B));
    return seq;
  }

  const api = { gaussian, simulateBattle, simulateDetailed, runMonteCarlo, computeHax };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.gaussian = gaussian;
  root.simulateBattle = simulateBattle;
  root.simulateDetailed = simulateDetailed;
  root.runMonteCarlo = runMonteCarlo;
  root.computeHax = computeHax;
})(typeof globalThis !== "undefined" ? globalThis : this);
