import type { Team } from './components/logo';

export interface Pick {
    name: string;
    prob: number;
    team: Team;
    gameId: string;
}

// NHL Picks Optimizer
// Inputs:
// picks1, picks2, picks3 = arrays of Pick
//
// Output:
// optimal picks for:
// - streak
// - EV (expected value)
// - leaderboard (stack)
// - hybrid optimization (2+1 with correlation adjustment)
// + threshold diagnostics

export function optimizePicks(picks1: Pick[], picks2: Pick[], picks3: Pick[]) {

    const sameTeam = (a: Pick, b: Pick) => a.team === b.team;
    const sameGame = (a: Pick, b: Pick) => a.gameId === b.gameId;

    function pairCorr(a: Pick, b: Pick) {
        if (sameTeam(a, b)) return 1.15;
        if (sameGame(a, b)) return 0.85;
        return 1.0;
    }

    function evaluate(p1: Pick, p2: Pick, p3: Pick) {
        const pA = p1.prob;
        const pB = p2.prob;
        const pC = p3.prob;

        const cAB = pairCorr(p1, p2);
        const cAC = pairCorr(p1, p3);
        const cBC = pairCorr(p2, p3);

        const pAB = pA * pB * cAB;
        const pAC = pA * pC * cAC;
        const pBC = pB * pC * cBC;

        const pABC = pA * pB * pC * cAB * cAC * cBC;

        const p3hit = Math.min(pABC, Math.min(pAB, pAC, pBC));

        const pAtLeast1 = pA + pB + pC - pAB - pAC - pBC + p3hit;

        const p2hit = (pAB + pAC + pBC) - 3 * p3hit;
        const p1hit = pAtLeast1 - p2hit - p3hit;

        const ev = 25 * p1hit + 50 * p2hit + 100 * p3hit;

        return {
            pAtLeast1,
            p1hit,
            p2hit,
            p3hit,
            ev
        };
    }

    // --- Baseline ---
    const top1 = picks1.reduce((a, b) => a.prob > b.prob ? a : b);
    const top2 = picks2.reduce((a, b) => a.prob > b.prob ? a : b);
    const top3 = picks3.reduce((a, b) => a.prob > b.prob ? a : b);

    const baselineEval = evaluate(top1, top2, top3);

    const baseline = [{ p1: top1, p2: top2, p3: top3, ...baselineEval }];

    const baseMiss = (1 - top1.prob) * (1 - top2.prob) * (1 - top3.prob);

    function isHybrid(p1: Pick, p2: Pick, p3: Pick) {
        const pairs = [[p1, p2], [p1, p3], [p2, p3]];
        const sameTeamCount = pairs.filter(([a, b]) => sameTeam(a, b)).length;
        return sameTeamCount === 1;
    }

    let bestStreak: { p1: Pick, p2: Pick, p3: Pick, pAtLeast1: number, p1hit: number, p2hit: number, p3hit: number, ev: number }[] = [];
    let bestEV: { p1: Pick, p2: Pick, p3: Pick, pAtLeast1: number, p1hit: number, p2hit: number, p3hit: number, ev: number }[] = [];
    let bestStack: { p1: Pick, p2: Pick, p3: Pick, pAtLeast1: number, p1hit: number, p2hit: number, p3hit: number, ev: number }[] = [];
    let bestHybrid: { p1: Pick, p2: Pick, p3: Pick, pAtLeast1: number, p1hit: number, p2hit: number, p3hit: number, ev: number }[] = [];

    let bestStreakVal = -Infinity;
    let bestEVVal = -Infinity;
    let bestStackVal = -Infinity;
    let bestHybridVal = -Infinity;

    const EPS = 1e-6;

    for (let p1 of picks1) {
        for (let p2 of picks2) {
            for (let p3 of picks3) {

                const res = evaluate(p1, p2, p3);

                // Streak
                if (res.pAtLeast1 > bestStreakVal + EPS) {
                    bestStreakVal = res.pAtLeast1;
                    bestStreak = [{ p1, p2, p3, ...res }];
                } else if (Math.abs(res.pAtLeast1 - bestStreakVal) <= EPS) {
                    bestStreak.push({ p1, p2, p3, ...res });
                }

                // EV
                if (res.ev > bestEVVal + EPS) {
                    bestEVVal = res.ev;
                    bestEV = [{ p1, p2, p3, ...res }];
                } else if (Math.abs(res.ev - bestEVVal) <= EPS) {
                    bestEV.push({ p1, p2, p3, ...res });
                }

                // Stack
                if (res.p3hit > bestStackVal + EPS) {
                    bestStackVal = res.p3hit;
                    bestStack = [{ p1, p2, p3, ...res }];
                } else if (Math.abs(res.p3hit - bestStackVal) <= EPS) {
                    bestStack.push({ p1, p2, p3, ...res });
                }

                // Hybrid
                if (isHybrid(p1, p2, p3)) {
                    if (res.ev > bestHybridVal + EPS) {
                        bestHybridVal = res.ev;
                        bestHybrid = [{ p1, p2, p3, ...res }];
                    } else if (Math.abs(res.ev - bestHybridVal) <= EPS) {
                        bestHybrid.push({ p1, p2, p3, ...res });
                    }
                }
            }
        }
    }

    // --- Unified Threshold Function ---
    function computeThreshold(p1: Pick, p2: Pick, p3: Pick) {
        const r1 = p1.prob / top1.prob;
        const r2 = p2.prob / top2.prob;
        const r3 = p3.prob / top3.prob;

        const productRatio = r1 * r2 * r3;

        const altMiss = (1 - p1.prob) * (1 - p2.prob) * (1 - p3.prob);
        const cutoffRatio = baseMiss === 0 ? 0 : altMiss / baseMiss;

        return {
            r1, r2, r3,
            productRatio,
            cutoffRatio
        };
    }

    return {
        baseline,

        bestStreak,
        bestEV,
        bestHybrid,
        bestStack,

        thresholds: {
            streak: bestStreak.map(x => computeThreshold(x.p1, x.p2, x.p3)),
            EV: bestEV.map(x => computeThreshold(x.p1, x.p2, x.p3)),
            hybrid: bestHybrid.map(x => computeThreshold(x.p1, x.p2, x.p3)),
            stack: bestStack.map(x => computeThreshold(x.p1, x.p2, x.p3))
        }
    };
}
