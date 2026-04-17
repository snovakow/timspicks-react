import * as Picks from './components/Table';
import { roundToPercent } from './utility';
import type { Team } from './components/logo';

const precision = Picks.precision;

type LogStatAlign = 'left' | 'center';
export interface LogStat {
	isTitle: boolean;
	align: LogStatAlign;
	lines: string[];
	break: boolean;
}

export type LogStatsKey = 'bet1' | 'bet2' | 'bet3' | 'bet4' | 'betAvg';
export type PickIndex = 1 | 2 | 3;

export interface LogStatsCacheItem {
	stats: LogStat[];
}

export const cloneLogStats = (stats: LogStat[]): LogStat[] => {
	return stats.map((stat) => ({
		...stat,
		lines: [...stat.lines],
	}));
};

export const allStrategies = [
	'iii', 'sss',
	'iss', 'sis', 'ssi',
	'ioo', 'oio', 'ooi',
	'oso', 'soo', 'sos', 'oss'
] as const;
export type strategyPattern = typeof allStrategies[number];

export const calculateStats = (
	betKey: LogStatsKey,
	minSportsbooks: number,
	table1Rows: Picks.PickOdds[],
	table2Rows: Picks.PickOdds[],
	table3Rows: Picks.PickOdds[],
	stats: LogStat[]
): void => {
	let logSection = 0;
	let dataStatsPrev: LogStat | null = null;

	const addLog = (line: string, align: LogStatAlign = "left", isTitle: boolean = false) => {
		if (dataStatsPrev) {
			const current = stats[logSection];
			if (current) {
				if (current.align === align && current.isTitle === isTitle) {
					current.lines.push(line);
				} else {
					dataStatsPrev = { align, lines: [line], break: false, isTitle };
					logSection++;
					stats[logSection] = dataStatsPrev;
				}
			} else {
				dataStatsPrev.break = true;
				dataStatsPrev = { align, lines: [line], break: false, isTitle };
				stats[logSection] = dataStatsPrev;
			}
		} else {
			dataStatsPrev = { align, lines: [line], break: false, isTitle };
			stats[logSection] = dataStatsPrev;
		}
	}

	const addLogTitle = (title: string) => {
		addLog(title, 'center', true);
	}

	const addPlayersToHighlight = (players: Set<Picks.PickOdds>) => {
		for (const pick of players) {
			if (betKey === 'bet1') pick.highlight1 = true;
			else if (betKey === 'bet2') pick.highlight2 = true;
			else if (betKey === 'bet3') pick.highlight3 = true;
			else if (betKey === 'bet4') pick.highlight4 = true;
			else pick.highlightAvg = true;
		}
	};

	const printName = (player: Picks.Player) => `${player.fullName} (${player.team.code})`;
	const names = (players: Set<Picks.PickOdds>, shortTab: boolean = false) => {
		const names: string[] = [];
		for (const pick of players) names.push(printName(pick.player));
		return names.join(shortTab ? "\n   " : "\n           ");
	}

	const calcAny = (max1: number, max2: number, max3: number): number => {
		return 1 - (1 - max1) * (1 - max2) * (1 - max3);
	}
	const calcAvg = (max1: number, max2: number, max3: number): number => {
		return (max1 + max2 + max3) / 3;
	}
	const calcAll = (max1: number, max2: number, max3: number): number => {
		return max1 * max2 * max3;
	}

	class Choice {
		avg: number;
		pick: Picks.PickOdds;
		constructor(pick: Picks.PickOdds, avg: number) {
			this.avg = avg;
			this.pick = pick;
		}
	}

	const makeChoices = (list: Picks.PickOdds[]): Choice[] => {
		const choices: Choice[] = [];
		for (const row of list) {
			const avg = row.player[betKey];
			if (avg === null) continue;
			if (betKey === 'betAvg' && row.player.betCount < minSportsbooks) continue;
			choices.push(new Choice(row, avg));
		}
		return choices;
	};

	const choices1: Choice[] = makeChoices(table1Rows);
	const choices2: Choice[] = makeChoices(table2Rows);
	const choices3: Choice[] = makeChoices(table3Rows);

	interface BestCombo {
		pick1: Choice;
		pick2: Choice;
		pick3: Choice;
	}

	class Result {
		players1: Set<Picks.PickOdds>;
		players2: Set<Picks.PickOdds>;
		players3: Set<Picks.PickOdds>;
		avg1: number;
		avg2: number;
		avg3: number;
		constructor(combo: BestCombo) {
			this.players1 = new Set([combo.pick1.pick]);
			this.players2 = new Set([combo.pick2.pick]);
			this.players3 = new Set([combo.pick3.pick]);
			this.avg1 = combo.pick1.avg;
			this.avg2 = combo.pick2.avg;
			this.avg3 = combo.pick3.avg;
		}
		merge(combo: BestCombo): boolean {
			if (this.avg1 !== combo.pick1.avg || this.avg2 !== combo.pick2.avg || this.avg3 !== combo.pick3.avg) return false;
			this.players1.add(combo.pick1.pick);
			this.players2.add(combo.pick2.pick);
			this.players3.add(combo.pick3.pick);
			return true;
		}
	}

	class ComboGroup {
		combos: BestCombo[] = [];
		total: number = 0;
		add(pick1: Choice, pick2: Choice, pick3: Choice) {
			const total = pick1.avg + pick2.avg + pick3.avg;
			if (total > this.total) {
				this.combos.splice(0, this.combos.length, { pick1, pick2, pick3 });
				this.total = total;
			} else if (total === this.total) {
				this.combos.push({ pick1, pick2, pick3 });
			}
		}
		merge(): Result[] {
			const avgResults: Result[] = [];
			if (this.combos.length === 0) return avgResults;
			let prev: Result | null = null;
			for (const combo of this.combos) {
				if (prev && prev.merge(combo)) continue;
				prev = new Result(combo);
				avgResults.push(prev);
			}
			return avgResults;
		}
	}

	// 1000000 iterations per night
	/*
		1 Game Night
		aa71 nights simulated
	*/
	const historical1Night = {
		all3: {
			"sss": 0.3540804309550738,
			"iii": null,
			"ssi": null,
			"sis": null,
			"iss": null,
			"oso": -0.19852383895152925,
			"soo": -0.201339738581906,
			"sos": -0.4216911721838089,
			"oss": 0.34408194676025783,
			"ooi": null,
			"oio": null,
			"ioo": null
		},
		least1: {
			"sss": -0.004014311640537005,
			"iii": null,
			"ssi": null,
			"sis": null,
			"iss": null,
			"oso": 0.0006240918487641078,
			"soo": 0.00044823245447056514,
			"sos": 0.0032392539068162307,
			"oss": -0.012501356173756362,
			"ooi": null,
			"oio": null,
			"ioo": null
		},
		points: {
			"sss": 0.0002046458851772126,
			"iii": null,
			"ssi": null,
			"sis": null,
			"iss": null,
			"oso": -0.001494086335342537,
			"soo": -0.0016537224129409278,
			"sos": -0.007361560971168135,
			"oss": -0.0016649101955718004,
			"ooi": null,
			"oio": null,
			"ioo": null
		},
		avg: {
			"sss": -0.0017689767998229078,
			"iii": null,
			"ssi": null,
			"sis": null,
			"iss": null,
			"oso": -0.00039521942839537694,
			"soo": -0.000540041093066046,
			"sos": -0.005050777486519498,
			"oss": -0.003593196529209308,
			"ooi": null,
			"oio": null,
			"ioo": null
		}
	};

	/*
		2 Game Nights
		66 nights simulated
	*/
	const historical2Night = {
		all3: {
			"sss": -0.03643002717391297,
			"iii": null,
			"ssi": 0.2025220788043478,
			"sis": -0.021849524456521774,
			"iss": 0.10036514945652186,
			"oso": 0.10313349184782616,
			"soo": 0.1059103260869565,
			"sos": 0.02137398097826093,
			"oss": 0.1704313858695652,
			"ooi": -0.23429008152173914,
			"oio": -0.3779976222826087,
			"ioo": -0.04595788043478266
		},
		least1: {
			"sss": 0.0016397614909724467,
			"iii": null,
			"ssi": 0.0013562708324488248,
			"sis": -0.0021483034211132734,
			"iss": -0.005404490402980411,
			"oso": -0.004019675706722903,
			"soo": -0.0037126105200119275,
			"sos": 0.0018256941525787163,
			"oss": -0.00005374833407989499,
			"ooi": 0.0017901137095304165,
			"oio": -0.00834558175177258,
			"ioo": -0.01120867440865303
		},
		points: {
			"sss": 0.004839322553280123,
			"iii": null,
			"ssi": 0.0024313139969136532,
			"sis": -0.004613398916930134,
			"iss": -0.006105781933706034,
			"oso": -0.002110325033674698,
			"soo": -0.0017824835752299206,
			"sos": 0.001245449699693646,
			"oss": -0.005322684347078277,
			"ooi": -0.003089953574170967,
			"oio": -0.013505676718338022,
			"ioo": -0.012041538504135696
		},
		avg: {
			"sss": 0.005009065033670712,
			"iii": null,
			"ssi": 0.0016083327058060704,
			"sis": -0.004542506045567829,
			"iss": -0.006543701118358447,
			"oso": -0.0025431970474408816,
			"soo": -0.0022254283939180386,
			"sos": 0.0011626602482381898,
			"oss": -0.0060455678432931315,
			"ooi": -0.002139018232474199,
			"oio": -0.012006506817880513,
			"ioo": -0.011902039237897233
		}
	};

	/*
		3+ Game Nights
		485 nights simulated
	*/
	const historical3PlusNight = {
		all3: {
			"sss": -0.042778741322703095,
			"iii": 0,
			"ssi": -0.024463727323760676,
			"sis": 0.009448673264365492,
			"iss": 0.014592796009131659,
			"oso": -0.13929147748737547,
			"soo": -0.14124097649865808,
			"sos": -0.14448844247218962,
			"oss": -0.09945674200013654,
			"ooi": -0.014805137860949391,
			"oio": -0.05420164062392663,
			"ioo": -0.08925221000885031
		},
		least1: {
			"sss": -0.004487664487160314,
			"iii": 0,
			"ssi": -0.0011402301686510574,
			"sis": -0.0027711255369844423,
			"iss": -0.0038676938477631984,
			"oso": -0.0007725094821269263,
			"soo": -0.0008237897360976465,
			"sos": 0.007887930616157668,
			"oss": 0.0030079576305068745,
			"ooi": 0.00831744099696663,
			"oio": -0.0036962289353361655,
			"ioo": 0.0009114296235401831
		},
		points: {
			"sss": -0.008335966295803243,
			"iii": 0,
			"ssi": -0.0041025072419969,
			"sis": -0.003243947202320685,
			"iss": -0.004081121056163983,
			"oso": -0.00782972486973732,
			"soo": -0.007899117334319472,
			"sos": 0.0006387309014401765,
			"oss": -0.0028583877077610342,
			"ooi": 0.004594460748213791,
			"oio": -0.0057273489073904615,
			"ioo": -0.0017902885106692024
		},
		avg: {
			"sss": -0.008111914990911684,
			"iii": 0,
			"ssi": -0.003970056882670714,
			"sis": -0.0033265130866270143,
			"iss": -0.004202595457766356,
			"oso": -0.006974562148547747,
			"soo": -0.00703172446254563,
			"sos": 0.0015827876025682475,
			"oss": -0.0022300124588825465,
			"ooi": 0.004720655730451995,
			"oio": -0.005412022157315843,
			"ioo": -0.0012213460365309015
		}
	};

	/*	
		iii = independent
		sss = stacked
		iss = stacked + independent
		sis = stacked + independent
		ssi = stacked + independent
		ioo = opposing + independent
		oio = opposing + independent
		ooi = opposing + independent
		oso = ss + o to 1
		soo = ss + o to 2
		sos = oo + s as 1
		oss = oo + s as 2
	*/

	const strategyTitle = (strategy: strategyPattern): string => {
		if (strategy === 'iii') return "Independent";
		if (strategy === 'sss') return "Stacked";
		if (strategy === 'iss') return "Stacked + Pick 1 Independent";
		if (strategy === 'sis') return "Stacked + Pick 2 Independent";
		if (strategy === 'ssi') return "Stacked + Pick 3 Independent";
		if (strategy === 'ioo') return "Opposing + Pick 1 Independent";
		if (strategy === 'oio') return "Opposing + Pick 2 Independent";
		if (strategy === 'ooi') return "Opposing + Pick 3 Independent";
		if (strategy === 'oso') return "Stacked + Pick 3 Opposing Pick 1";
		if (strategy === 'soo') return "Stacked + Pick 3 Opposing Pick 2";
		if (strategy === 'sos') return "Opposing + Pick 3 Stacked Pick 1";
		if (strategy === 'oss') return "Opposing + Pick 3 Stacked Pick 2";
		return strategy;
	}

	const getStrategy = (pick1: Choice, pick2: Choice, pick3: Choice): strategyPattern | null => {
		const p1 = pick1.pick.player;
		const p2 = pick2.pick.player;
		const p3 = pick3.pick.player;

		if (!p1.sameGame(p2) && !p2.sameGame(p3) && !p1.sameGame(p3)) return 'iii';
		if (p1.sameGame(p2) && p2.sameGame(p3)) return 'sss';

		if (p2.sameTeam(p3) && !p1.sameGame(p2)) return 'iss';
		if (p1.sameTeam(p3) && !p2.sameGame(p1)) return 'sis';
		if (p1.sameTeam(p2) && !p3.sameGame(p1)) return 'ssi';

		if (p2.opponentTeam(p3) && !p1.sameGame(p2)) return 'ioo';
		if (p1.opponentTeam(p3) && !p2.sameGame(p1)) return 'oio';
		if (p1.opponentTeam(p2) && !p3.sameGame(p1)) return 'ooi';

		if (p1.sameTeam(p2) && p3.opponentTeam(p1)) return 'oso';
		if (p1.sameTeam(p2) && p3.opponentTeam(p2)) return 'soo';
		if (p1.sameTeam(p3) && p1.opponentTeam(p2)) return 'sos';
		if (p2.sameTeam(p3) && p1.opponentTeam(p2)) return 'oss';

		return null;
	}
	type strategyMap = Map<strategyPattern, ComboGroup>;
	const addStrategy = (strategies: strategyMap, pick1: Choice, pick2: Choice, pick3: Choice) => {
		let strategy = getStrategy(pick1, pick2, pick3);
		if (!strategy) return;
		const combo = strategies.get(strategy);
		if (combo) combo.add(pick1, pick2, pick3);
	}
	const calcCombos = (): {
		top: ComboGroup,
		strategies: strategyMap
	} => {
		const top = new ComboGroup();
		const strategies = new Map<strategyPattern, ComboGroup>();
		for (const strategy of allStrategies) strategies.set(strategy, new ComboGroup());

		for (const pick1 of choices1) {
			for (const pick2 of choices2) {
				for (const pick3 of choices3) {
					top.add(pick1, pick2, pick3);
					addStrategy(strategies, pick1, pick2, pick3);
				}
			}
		}
		return {
			top,
			strategies
		};
	}

	const comboPrecision = 2;
	const logCalcStats = (avgResult: Result) => {
		const any = roundToPercent(calcAny(avgResult.avg1, avgResult.avg2, avgResult.avg3), precision);
		const avg = roundToPercent(calcAvg(avgResult.avg1, avgResult.avg2, avgResult.avg3), precision);
		const all = roundToPercent(calcAll(avgResult.avg1, avgResult.avg2, avgResult.avg3), precision);
		addLog(`Any: ${any} - Avg: ${avg} - All: ${all}`, 'center');
		logSection++;
	}

	const logHighlights = (avgResult: Result) => {
		addPlayersToHighlight(avgResult.players1);
		addPlayersToHighlight(avgResult.players2);
		addPlayersToHighlight(avgResult.players3);
	}

	const logTopPicks = (avgResult: Result) => {
		addLog(`1: ${roundToPercent(avgResult.avg1, precision)} - ${names(avgResult.players1)}`);
		addLog(`2: ${roundToPercent(avgResult.avg2, precision)} - ${names(avgResult.players2)}`);
		addLog(`3: ${roundToPercent(avgResult.avg3, precision)} - ${names(avgResult.players3)}`);
		logCalcStats(avgResult);
	}

	const logReduced = (avgResult: Result, topResult: Result, totalMax: number): void => {
		let line1 = `1: ${names(avgResult.players1, true)}`;
		let reducedCount = 0;
		if (avgResult.avg1 !== topResult.avg1) {
			reducedCount++;
			line1 += " " + roundToPercent(avgResult.avg1 - topResult.avg1, comboPrecision);
		}
		let line2 = `2: ${names(avgResult.players2, true)}`;
		if (avgResult.avg2 !== topResult.avg2) {
			reducedCount++;
			line2 += " " + roundToPercent(avgResult.avg2 - topResult.avg2, comboPrecision);
		}
		let line3 = `3: ${names(avgResult.players3, true)}`;
		if (avgResult.avg3 !== topResult.avg3) {
			reducedCount++;
			line3 += " " + roundToPercent(avgResult.avg3 - topResult.avg3, comboPrecision);
		}

		addLog(line1);
		addLog(line2);
		addLog(line3);

		if (reducedCount > 1) {
			const total = avgResult.avg1 + avgResult.avg2 + avgResult.avg3;
			addLog(`Total: ${roundToPercent(total - totalMax, comboPrecision)}`, 'center');
		}
		if (reducedCount > 0) logCalcStats(avgResult);
		else logSection++;
	}

	const logFooter = () => {
		addLogTitle("Good Ranges");
		addLog("Any: 66-69% - Avg: 30-32% - All: 2-3%", 'center');
	}

	const setStrategy = (pick: Picks.PickOdds, mode: Picks.StrategyMode) => {
		if (betKey === 'bet1') pick.strategy1.add(mode);
		else if (betKey === 'bet2') pick.strategy2.add(mode);
		else if (betKey === 'bet3') pick.strategy3.add(mode);
		else if (betKey === 'bet4') pick.strategy4.add(mode);
		else pick.strategyAvg.add(mode);
	};
	const addStrategyHighlights = (result: Result, strategy: Picks.StrategyMode) => {
		for (const pick of result.players1) setStrategy(pick, strategy);
		for (const pick of result.players2) setStrategy(pick, strategy);
		for (const pick of result.players3) setStrategy(pick, strategy);
	}

	// calculate available games from players, rather than use the gamesList.
	// Some games may have started, or players may not be available from a game.
	const gamesSet = new Set<Team>();
	let gameCount = 0;
	for (const pick of [...table1Rows, ...table2Rows, ...table3Rows]) {
		if (gamesSet.has(pick.player.team.code)) continue;
		gamesSet.add(pick.player.team.code);
		gamesSet.add(pick.player.opponent.code);
		gameCount++;
	}

	if (gameCount === 0) return;

	const ref = gameCount === 1 ? historical1Night : gameCount === 2 ? historical2Night : historical3PlusNight;

	const { top, strategies } = calcCombos();
	if (top.combos.length === 0) return;

	const topResult: Result[] = top.merge();
	const maxResult: Result = topResult[0];
	const strategyResults: Map<strategyPattern, Result[]> = new Map();
	for (const [strategy, combo] of strategies) {
		if (combo.total > 0) strategyResults.set(strategy, combo.merge());
	}

	addLogTitle("Top Picks");
	for (const avgResult of topResult) {
		logTopPicks(avgResult);
		logHighlights(avgResult);
		addStrategyHighlights(avgResult, 'top');
	}

	for (const [strategy, result] of strategyResults.entries()) {
		addLogTitle(strategyTitle(strategy));
		for (const avgResult of result) {
			logReduced(avgResult, maxResult, top.total);
			// logHighlights(avgResult);
			// addStrategyHighlights(avgResult, 'streak');
		}
	}
	console.log(ref);

	logFooter();
};

export const precalculateLogStats = (
	minSportsbooks: number,
	table1Rows: Picks.PickOdds[],
	table2Rows: Picks.PickOdds[],
	table3Rows: Picks.PickOdds[]
): Record<LogStatsKey, LogStatsCacheItem> => {
	const keys: LogStatsKey[] = ['bet1', 'bet2', 'bet3', 'bet4', 'betAvg'];
	const cache = {} as Record<LogStatsKey, LogStatsCacheItem>;

	for (const key of keys) {
		const stats: LogStat[] = [];
		calculateStats(key, minSportsbooks, table1Rows, table2Rows, table3Rows, stats);
		cache[key] = {
			stats: cloneLogStats(stats),
		};
	}

	return cache;
};
