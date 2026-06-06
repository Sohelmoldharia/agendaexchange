/* ============================================================
   Battle engine — shared by the game (browser) and the Node test
   harness (data/sim-test.js). Single source of truth.

   Models the things that make power-scaling debates fun — a weaker,
   cleverer fighter (Loki) CAN steal a win from a stronger one (Goku)
   "in some instances":

     power power+technique -> damage      durability/stamina -> effective HP
     speed -> turn order, dodge, double   intelligence -> dodge, variance, EXPLOITS
     range -> opening poke                wildcards -> per-turn boosts
     hax (reflection/illusion/soul/time/reality) -> "gambit" blows that
         bypass raw power (the underdog's real path to an upset)

   Also records per-fight COUNTERS and an optional event TRACE so the
   UI can justify the result ("why X won") and narrate a play-by-play.
   ============================================================ */
(function (root) {
  function gaussian(mean, std) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

  const HAX_WORDS = [
    "reflect","illusion","mind control","mind-control","soul","time stop","stop time",
    "time manip","rewind","seal","erase","reality","one-shot","one shot","oneshot",
    "instant death","insta-kill","instakill","instant kill","curse","negate","nullify",
    "intangib","phas","possess","hypno","paraly","petrif","probability","shapeshift",
    "deceiv","trick","void","dimension","banish","absorb","copy ability","steal ability"
  ];
  function haxText(C) {
    return [
      (C.powers || []).join(" "), (C.pros || []).join(" "), C.signature_move || "",
      ...((C.wildcards || []).map(w => (w.name || "") + " " + (w.effect_desc || "")))
    ].join(" ").toLowerCase();
  }
  function computeHax(C) {
    const t = haxText(C); let h = 0;
    for (const k of HAX_WORDS) if (t.includes(k)) h++;
    return clamp(h * 0.16, 0, 0.85);
  }

  // a single attack -> { dmg, type }  (negative dmg = a counter that hits the attacker). Pure: reads stats only.
  function oneStrike(atk, def, turn, haxAtk) {
    const a = atk.stats, d = def.stats;
    const gambitChance = haxAtk * clamp(0.07 + a.intelligence / 1300, 0, 0.18);
    if (haxAtk > 0 && Math.random() < gambitChance)
      return { dmg: clamp(26 + a.technique * 0.22 + a.intelligence * 0.10 + gaussian(0, 6), 14, 75), type: "gambit" };
    const decay = clamp(1 - turn * (1 - a.stamina / 100) * 0.010, 0.5, 1);
    let boost = 0;
    for (const w of (atk.wildcards || [])) if (Math.random() < w.trigger_chance) boost += w.stat_boost;
    const power = clamp(a.power * decay + boost, 1, 130);
    const tech = clamp(a.technique * decay + boost, 1, 130);
    const dodge = clamp((d.speed - a.speed) / 420 + d.intelligence / 1100, 0, 0.32);
    if (Math.random() < dodge) {
      const counter = clamp(d.technique / 600 + d.intelligence / 1200, 0, 0.25);
      if (Math.random() < counter) return { dmg: -clamp(d.power * 0.10, 1, 12), type: "counter" };
      return { dmg: 0, type: "dodge" };
    }
    const offense = power * 0.55 + tech * 0.45;
    let dmg = offense * 0.165, type = "hit";
    if (Math.random() < clamp(tech / 420 + 0.03, 0, 0.30)) { dmg *= 1.7; type = "crit"; }
    const exploit = clamp((a.intelligence - d.intelligence) / 640 + (a.technique - d.technique) / 900, 0, 0.12);
    if (Math.random() < exploit) { dmg *= 1.8; if (type !== "crit") type = "exploit"; }
    dmg *= clamp(1 + gaussian(0, 0.24 + (100 - a.intelligence) * 0.0018), 0.25, 2.2);
    return { dmg: clamp(dmg, 1, 75), type };
  }
  const CONTROL = /time stop|stop time|time manip|rewind|seal|paraly|petrif|freeze|stasis|hypno|mind control|possess/;
  const controlHax = C => CONTROL.test(haxText(C));
  const ehp = c => 90 + c.stats.durability * 0.7 + c.stats.stamina * 0.1;

  const newCounts = () => ({ dmg: 0, hits: 0, crit: 0, gambit: 0, dodge: 0, counter: 0, first: 0 });

  // opts.trace -> include an `events` array. Always returns `counts` per side.
  function simulateDetailed(A, B, opts = {}) {
    const sA = A.stats, sB = B.stats;
    const haxA = computeHax(A), haxB = computeHax(B);
    let hpA = 90 + sA.durability * 0.7 + sA.stamina * 0.1;
    let hpB = 90 + sB.durability * 0.7 + sB.stamina * 0.1;
    const maxA = hpA, maxB = hpB;
    const counts = { f1: newCounts(), f2: newCounts() };
    const events = opts.trace ? [] : null;
    let gambits = 0;

    const rGap = sA.range - sB.range;
    if (rGap > 10) { const p = clamp((rGap - 10) * 0.25, 0, 18); hpB -= p; if (events) events.push({ t: 0, atk: "f1", def: "f2", type: "poke", dmg: Math.round(p), hpA, hpB }); }
    else if (rGap < -10) { const p = clamp((-rGap - 10) * 0.25, 0, 18); hpA -= p; if (events) events.push({ t: 0, atk: "f2", def: "f1", type: "poke", dmg: Math.round(p), hpA, hpB }); }

    const initA = sA.speed * 0.8 + sA.range * 0.2 + 5;
    const initB = sB.speed * 0.8 + sB.range * 0.2 + 5;

    const hurt = (side, dmg) => { if (side === "f1") hpA -= dmg; else hpB -= dmg; };

    function apply(atk, def, atkSide, defSide, turn, haxAtk) {
      const r = oneStrike(atk, def, turn, haxAtk);
      if (r.type === "gambit") gambits++;
      if (r.type === "dodge") counts[defSide].dodge++;
      if (r.dmg < 0) {                        // counter hits the attacker
        hurt(atkSide, -r.dmg);
        counts[defSide].counter++; counts[defSide].dmg += -r.dmg;
      } else if (r.dmg > 0) {
        hurt(defSide, r.dmg);
        counts[atkSide].dmg += r.dmg; counts[atkSide].hits++;
        if (r.type === "crit") counts[atkSide].crit++;
        if (r.type === "gambit") counts[atkSide].gambit++;
      }
      if (events) events.push({ t: turn + 1, atk: atkSide, def: defSide, type: r.type, dmg: Math.round(Math.abs(r.dmg)), hpA: Math.max(0, Math.round(hpA)), hpB: Math.max(0, Math.round(hpB)) });
      if (hpA <= 0 || hpB <= 0) return true;
      // faster attacker may follow up
      if (r.dmg >= 0 && Math.random() < clamp((atk.stats.speed - def.stats.speed) / 300, 0, 0.22)) {
        const r2 = oneStrike(atk, def, turn, haxAtk);
        if (r2.type === "gambit") gambits++;
        if (r2.dmg > 0) {
          hurt(defSide, r2.dmg);
          counts[atkSide].dmg += r2.dmg; counts[atkSide].hits++;
          if (r2.type === "crit") counts[atkSide].crit++;
          if (r2.type === "gambit") counts[atkSide].gambit++;
          if (events) events.push({ t: turn + 1, atk: atkSide, def: defSide, type: "double", dmg: Math.round(r2.dmg), hpA: Math.max(0, Math.round(hpA)), hpB: Math.max(0, Math.round(hpB)) });
          if (hpA <= 0 || hpB <= 0) return true;
        }
      }
      return false;
    }

    let turns = 0;
    for (let turn = 0; turn < 60; turn++) {
      turns = turn + 1;
      const aFirst = Math.random() < initA / (initA + initB);
      counts[aFirst ? "f1" : "f2"].first++;
      const order = aFirst
        ? [[A, B, "f1", "f2", haxA], [B, A, "f2", "f1", haxB]]
        : [[B, A, "f2", "f1", haxB], [A, B, "f1", "f2", haxA]];
      let done = false;
      for (const [atk, def, as, ds, hax] of order) { if (apply(atk, def, as, ds, turn, hax)) { done = true; break; } }
      if (done) break;
    }

    let winner;
    if (hpA <= 0 && hpB <= 0) winner = hpA === hpB ? "draw" : (hpA > hpB ? "f1" : "f2");
    else if (hpA <= 0) winner = "f2";
    else if (hpB <= 0) winner = "f1";
    else { const pa = hpA / maxA, pb = hpB / maxB; winner = Math.abs(pa - pb) < 0.02 ? "draw" : (pa > pb ? "f1" : "f2"); }
    if (events) events.push({ type: "ko", winner });
    return { winner, turns, hpA, hpB, gambits, counts, events };
  }

  function simulateBattle(A, B) { return simulateDetailed(A, B).winner; }
  function runMonteCarlo(A, B, n = 100) {
    const seq = [];
    for (let i = 0; i < n; i++) seq.push(simulateBattle(A, B));
    return seq;
  }

  // run n fights, return the win sequence + aggregate factors (per-fight averages)
  function analyze(A, B, n = 100) {
    const seq = [];
    const agg = { f1: newCounts(), f2: newCounts() }, turnsArr = [];
    let w1 = 0, w2 = 0, d = 0;
    for (let i = 0; i < n; i++) {
      const r = simulateDetailed(A, B);
      seq.push(r.winner);
      if (r.winner === "f1") w1++; else if (r.winner === "f2") w2++; else d++;
      turnsArr.push(r.turns);
      for (const s of ["f1", "f2"]) for (const k in agg[s]) agg[s][k] += r.counts[s][k];
    }
    for (const s of ["f1", "f2"]) for (const k in agg[s]) agg[s][k] = agg[s][k] / n;
    const avgTurns = turnsArr.reduce((a, b) => a + b, 0) / n;
    return { seq, w1, w2, draws: d, avgTurns, agg };
  }

  // produce one representative traced fight whose winner matches `prefer`
  function narrate(A, B, prefer, tries = 60) {
    let fallback = null;
    for (let i = 0; i < tries; i++) {
      const r = simulateDetailed(A, B, { trace: true });
      if (!fallback) fallback = r;
      if (r.winner === prefer) return r;
    }
    return fallback;
  }

  /* ============================================================
     TEAM (tag-team / 2v2) battles.
     Front fighter fights; KO'd fighters are replaced by a teammate.
     A living "controller" (Guldo-type: time-stop / freeze / seal /
     paralyze) can set up a teammate for a free heavy blow — but only
     a few times per fight ("can't stop time for long").
     ============================================================ */
  function simulateTeamDetailed(TA, TB, opts = {}) {
    const mk = arr => arr.map(c => ({ c, hp: ehp(c), max: ehp(c), hax: computeHax(c), ctrl: controlHax(c) }));
    const A = mk(TA), B = mk(TB);
    const events = opts.trace ? [] : null;
    const alive = t => t.filter(f => f.hp > 0);
    const front = t => alive(t)[0];
    const totalHp = t => t.reduce((s, f) => s + Math.max(0, f.hp), 0);
    const initOf = t => { const f = front(t); return f ? f.c.stats.speed * 0.8 + f.c.stats.range * 0.2 + 5 : 1; };
    const assist = { A: A.some(f => f.ctrl) ? 2 : 0, B: B.some(f => f.ctrl) ? 2 : 0 }; // limited time-stops
    const counts = { f1: { dmg: 0, assist: 0, down: 0 }, f2: { dmg: 0, assist: 0, down: 0 } };

    function act(side, team, foe, turn) {
      const atk = front(team), def = front(foe);
      if (!atk || !def) return;
      const me = side === "A" ? "f1" : "f2", foeSide = side === "A" ? "f2" : "f1";
      // controller assist: freezes the foe; the team's STRONGEST member lands a
      // free heavy blow during the freeze. Limited uses ("can't stop time long").
      const ctrlF = alive(team).find(f => f.ctrl);
      if (assist[side] > 0 && alive(team).length >= 2 && ctrlF &&
          Math.random() < (0.17 + ctrlF.c.stats.intelligence / 1600)) {
        const hitter = alive(team).slice().sort((x, y) =>
          (y.c.stats.power + y.c.stats.technique) - (x.c.stats.power + x.c.stats.technique))[0];
        const off = hitter.c.stats.power * 0.55 + hitter.c.stats.technique * 0.45;
        const dmg = clamp(22 + off * 0.22 + ctrlF.c.stats.intelligence * 0.10 + gaussian(0, 6), 14, 50);
        def.hp -= dmg; assist[side]--; counts[me].assist++; counts[me].dmg += dmg;
        if (events) events.push({ t: turn + 1, type: "assist", side: me, ctrl: ctrlF.c.name, hitter: hitter.c.name, def: def.c.name, dmg: Math.round(dmg), hp: Math.max(0, Math.round(def.hp)) });
        if (def.hp <= 0) { counts[foeSide].down++; if (events) events.push({ t: turn + 1, type: "down", side: foeSide, name: def.c.name }); }
        return; // the time-stop is this team's action for the turn
      }
      const r = oneStrike(atk.c, def.c, turn, atk.hax);
      if (r.dmg < 0) atk.hp += r.dmg;
      else if (r.dmg > 0) { def.hp -= r.dmg; counts[me].dmg += r.dmg; }
      if (events) events.push({ t: turn + 1, type: r.type, side: me, atk: atk.c.name, def: def.c.name, dmg: Math.round(Math.abs(r.dmg)), hp: Math.max(0, Math.round(def.hp)) });
      if (def.hp <= 0 && r.dmg > 0) { counts[foeSide].down++; if (events) events.push({ t: turn + 1, type: "down", side: foeSide, name: def.c.name }); }
    }

    let turns = 0;
    for (let turn = 0; turn < 80; turn++) {
      turns = turn + 1;
      if (!alive(A).length || !alive(B).length) break;
      const aFirst = Math.random() < initOf(A) / (initOf(A) + initOf(B));
      const order = aFirst ? [["A", A, B], ["B", B, A]] : [["B", B, A], ["A", A, B]];
      for (const [side, team, foe] of order) { if (!alive(A).length || !alive(B).length) break; act(side, team, foe, turn); }
    }
    const aA = alive(A).length, bA = alive(B).length;
    const winner = aA && !bA ? "f1" : bA && !aA ? "f2" : (totalHp(A) > totalHp(B) ? "f1" : totalHp(B) > totalHp(A) ? "f2" : "draw");
    if (events) events.push({ type: "ko", winner });
    return { winner, turns, counts, events, aAlive: aA, bAlive: bA };
  }
  function analyzeTeam(TA, TB, n = 100) {
    const agg = { f1: { dmg: 0, assist: 0 }, f2: { dmg: 0, assist: 0 } };
    let w1 = 0, w2 = 0, d = 0, tt = 0; const seq = [];
    for (let i = 0; i < n; i++) {
      const r = simulateTeamDetailed(TA, TB); seq.push(r.winner);
      if (r.winner === "f1") w1++; else if (r.winner === "f2") w2++; else d++; tt += r.turns;
      for (const s of ["f1", "f2"]) { agg[s].dmg += r.counts[s].dmg; agg[s].assist += r.counts[s].assist; }
    }
    for (const s of ["f1", "f2"]) { agg[s].dmg /= n; agg[s].assist /= n; }
    return { seq, w1, w2, draws: d, avgTurns: tt / n, agg };
  }
  function narrateTeam(TA, TB, prefer, tries = 60) {
    let fb = null;
    for (let i = 0; i < tries; i++) { const r = simulateTeamDetailed(TA, TB, { trace: true }); if (!fb) fb = r; if (r.winner === prefer) return r; }
    return fb;
  }

  const api = { gaussian, simulateBattle, simulateDetailed, runMonteCarlo, analyze, narrate, computeHax, controlHax, simulateTeamDetailed, analyzeTeam, narrateTeam };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.gaussian = gaussian;
  root.simulateBattle = simulateBattle;
  root.simulateDetailed = simulateDetailed;
  root.runMonteCarlo = runMonteCarlo;
  root.analyze = analyze;
  root.narrate = narrate;
  root.computeHax = computeHax;
  root.controlHax = controlHax;
  root.simulateTeamDetailed = simulateTeamDetailed;
  root.analyzeTeam = analyzeTeam;
  root.narrateTeam = narrateTeam;
})(typeof globalThis !== "undefined" ? globalThis : this);
