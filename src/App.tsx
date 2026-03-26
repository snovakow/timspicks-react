import { useState, useEffect } from 'react';
import './App.css';
import * as Picks from './components/Table';
import Popup from './components/Popup';
import { roundToPercent } from './utility';
import logo1 from './images/sb-logo-16-draftkings.svg';
import logo2 from './images/sb-logo-16-fanduel.svg';
import logo3 from './images/sb-logo-16-mgm.svg';
import logo4 from './images/sb-logo-16-betrivers.svg';

const precision = Picks.precision;

type Sportsbook = {
	key: "bet1" | "bet2" | "bet3" | "bet4";
	title: string;
	logo: string;
};

const sportsbooks: Sportsbook[] = [
	{ key: "bet1", title: "DraftKings", logo: logo1 },
	{ key: "bet2", title: "FanDuel", logo: logo2 },
	{ key: "bet3", title: "BetMGM", logo: logo3 },
	{ key: "bet4", title: "BetRivers", logo: logo4 },
];

const fetchData = async (src: string) => {
	const response = await fetch(src + "?t=" + new Date().getTime());
	if (!response.ok) throw new Error(`Failed to load ${src}: ${response.status} ${response.statusText}`);
	return response;
}
const loadData = async (src: string) => {
	try {
		const response = await fetchData(src);
		const json = await response.json();
		return json;
	} catch (error) {
		console.log(error);
		return [];
	}
}
const playerData = await loadData('./data/helper.json');
const gamesListing = await loadData('./data/games.json');
const playerOddsDraftKings = await loadData('./data/bet1.json');
const playerOddsFanDuel = await loadData('./data/bet2.json');
const playerOddsBetMGM = await loadData('./data/bet3.json');
const playerOddsBetRivers = await loadData('./data/bet4.json');

const oddsNameMap = new Map<string, string>();
oddsNameMap.set("Aatu Räty", "Aatu Raty");
oddsNameMap.set("Alex DeBrincat", "Alex Debrincat"); // BetMGM
oddsNameMap.set("Alexander Wennberg", "Alex Wennberg"); // FanDuel
oddsNameMap.set("Alexis Lafrenière", "Alexis Lafreniere"); // DraftKings FanDuel
oddsNameMap.set("Aliaksei Protas", "Alexei Protas"); // BetRivers (lang)
oddsNameMap.set("Arseny Gritsyuk", "Arseni Gritsyuk"); // BetRivers
oddsNameMap.set("Artem Zub", "Artyom Zub"); // BetRivers
oddsNameMap.set("Axel Sandin-Pellikka", "Axel Sandin Pellikka"); // DraftKings
oddsNameMap.set("Ben Kindel", "Benjamin Kindel"); // BetRivers
oddsNameMap.set("Bo Groulx", "Benoit-Olivier Groulx"); // BetMGM
oddsNameMap.set("Carl Grundstrom", "Carl Grundström"); // BetRivers (lang)
oddsNameMap.set("Charle-Edouard D'Astous", "Charles-Edouard D'Astous"); // BetRivers
oddsNameMap.set("Dmitry Orlov", "Dimitri Orlov"); // BetRivers
oddsNameMap.set("Egor Chinakhov", "Yegor Chinakhov"); // DraftKings BetRivers
oddsNameMap.set("Ethan Del Mastro", "Ethan del Mastro"); // FanDuel
oddsNameMap.set("Gabe Perreault", "Gabriel Perreault"); // BetMGM
oddsNameMap.set("J.J. Moser", "Janis Jérôme Moser"); // BetRivers
oddsNameMap.set("J.T. Compher", "JT Compher"); // BetRivers
oddsNameMap.set("Jake Middleton", "Jacob Middleton"); // BetRivers (lang)
oddsNameMap.set("James van Riemsdyk", "James Van Riemsdyk"); // BetMGM
oddsNameMap.set("JJ Peterka", "John-Jason Peterka"); // BetRivers
oddsNameMap.set("Josh Morrissey", "Joshua Morrissey"); // BetRivers
oddsNameMap.set("Lenni Hameenaho", "Lenni Hämeenaho"); // BetRivers
oddsNameMap.set("Liam Ohgren", "Liam Öhgren"); // BetRivers (lang)
oddsNameMap.set("Martin Fehérváry", "Martin Fehervary");
oddsNameMap.set("Martin Pospisil", "Martin Pospíšil"); // BetRivers (lang)
oddsNameMap.set("Matt Boldy", "Matthew Boldy"); // BetRivers
oddsNameMap.set("Matt Coronato", "Matthew Coronato"); // BetRivers
oddsNameMap.set("Matt Savoie", "Matthew Savoie"); // BetRivers
oddsNameMap.set("Mike Matheson", "Michael Matheson"); // BetRivers
oddsNameMap.set("Mitch Marner", "Mitchell Marner"); // FanDuel BetRivers (lang)
oddsNameMap.set("Nick Paul", "Nicholas Paul"); // FanDuel
oddsNameMap.set("Oliver Bjorkstrand", "Oliver Björkstrand"); // BetRivers
oddsNameMap.set("Olli Määttä", "Olli Maatta"); // DraftKings FanDuel (lang)
oddsNameMap.set("Ondrej Palat", "Ondrej Palát"); // BetRivers (lang mix and match)
oddsNameMap.set("Oskar Bäck", "Oskar Back"); // DraftKings FanDuel
oddsNameMap.set("Sebastian Aho", "Sebastian Aho (CAR)"); // FanDuel, BetRivers
oddsNameMap.set("Shea Theodore", "Shea Théodore"); // BetRivers
oddsNameMap.set("Simon Holmstrom", "Simon Holmström"); // BetRivers (lang)
oddsNameMap.set("Teuvo Teravainen", "Teuvo Teräväinen"); // BetRivers (lang)
oddsNameMap.set("Tim Stützle", "Tim Stuetzle"); // DraftKings
oddsNameMap.set("Tommy Novak", "Thomas Novak"); // BetRivers (lang)
oddsNameMap.set("Trevor van Riemsdyk", "Trevor Van Riemsdyk"); // BetRivers
oddsNameMap.set("Vasily Podkolzin", "Vasili Podkolzin"); // BetRivers (lang)
oddsNameMap.set("Zachary Bolduc", "Zack Bolduc"); // DraftKings

const gamesList: Picks.GameData[] = [];
const playerList: Picks.Player[] = [];

for (const data of gamesListing) {
	const game = new Picks.GameData(data);
	for (const item of data.homeTeam.players) {
		const player = new Picks.Player(item, game.home, game.time);
		playerList.push(player);
	}
	for (const item of data.awayTeam.players) {
		const player = new Picks.Player(item, game.away, game.time);
		playerList.push(player);
	}
	gamesList.push(game);
}
gamesList.sort((a: Picks.GameData, b: Picks.GameData): number => {
	const time = a.time.getTime() - b.time.getTime();
	if (time !== 0) return time;
	return a.away.name.localeCompare(b.away.name);
});

// Implied Odds
const betChance = (x: number | null): number | null => {
	if (x === null) return null;
	if (x < 0) return -x / (100 - x);
	else return 100 / (x + 100);
}

const betChanceRounded = (x: number | null): string => {
	const chance = betChance(x);
	if (chance === null) return "-";
	return roundToPercent(chance, precision);
}

const trueOddsToAmerican = (x: number): number => {
	if (x === 0) return 0;
	if (x >= 2) {
		return Math.round(100 * (x - 1));
	} else {
		return Math.round(100 / (1 - x));
	}
}

const sortFunction = (sortConfig: Picks.SortConfig) => {
	return (a: Picks.PickOdds | Picks.Player, b: Picks.PickOdds | Picks.Player): number => {
		const aPlayer = a instanceof Picks.PickOdds ? a.player : a;
		const bPlayer = b instanceof Picks.PickOdds ? b.player : b;
		for (const key of sortConfig.keyOrder) {
			const aVal = key === 'gg' ? (a as Picks.PickOdds)[key] : aPlayer[key];
			const bVal = key === 'gg' ? (b as Picks.PickOdds)[key] : bPlayer[key];

			if (aVal === null) {
				if (bVal === null) continue;
				return 1;
			}
			if (bVal === null) return -1;

			if (typeof aVal === 'number' && typeof bVal === 'number') {
				if (aVal === 0) {
					if (bVal === 0) continue;
					return 1;
				}
				if (bVal === 0) return -1;

				if (aVal !== bVal) {
					if (key === 'gg' || key === 'betAvg') return bVal - aVal;
					else return aVal - bVal;
				}
			}

			if (aVal instanceof Date && bVal instanceof Date) {
				const diff = aVal.getTime() - bVal.getTime();
				if (diff !== 0) return diff;
			}

			if (typeof aVal === 'string' && typeof bVal === 'string') {
				const comparison = aVal.localeCompare(bVal, undefined, { sensitivity: 'base' });
				if (comparison !== 0) return comparison;
			}
		}
		return 0;
	}
}

const makeSort = (sortConfig: Picks.SortConfig, setSortConfig: (config: Picks.SortConfig) => void) => {
	return (keyPrimary: Picks.ColumnKeys) => {
		if (sortConfig.keyOrder[0] === keyPrimary) return;
		const keyOrder = [keyPrimary];
		for (const key of sortConfig.keyOrder) {
			if (key === keyPrimary) continue;
			keyOrder.push(key);
		}
		setSortConfig({ keyOrder });
	};
}

const mapPlayers = () => {
	const playerMap = new Map<number, Picks.Player>();
	for (const player of playerList) {
		playerMap.set(player.playerId, player);
	}

	const makeRows = (data: Picks.OddsItem[], pick: 1 | 2 | 3): Picks.PickOdds[] => {
		const row: Picks.PickOdds[] = [];
		for (const item of data) {
			const playerId = item.playerId < 0 ? -item.playerId : item.playerId;
			const player = playerMap.get(playerId);
			if (!player) {
				console.warn(`Player not found for odds data:`, item);
				continue;
			}
			player.pick = pick;
			row.push(new Picks.PickOdds(player, item));
		}
		return row;
	}

	const table1Rows = makeRows(playerData["1"], 1);
	const table2Rows = makeRows(playerData["2"], 2);
	const table3Rows = makeRows(playerData["3"], 3);
	return { table1Rows, table2Rows, table3Rows };
}
const { table1Rows, table2Rows, table3Rows } = mapPlayers();

const compilePlayerList = () => {
	const removeAccentsNormalize = (name: string): string => {
		return name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase();
	}

	type betKey = "bet1" | "bet2" | "bet3" | "bet4";
	type betChanceKey = "betChance1" | "betChance2" | "betChance3" | "betChance4";
	const nameFind = (player: Picks.Player, oddsMap: Map<string, number>, betKey: betKey, betChanceKey: betChanceKey) => {
		const process = (name: string | undefined): boolean => {
			if (name === undefined) return false;
			const decimal = oddsMap.get(removeAccentsNormalize(name));
			if (decimal === undefined) return false;

			const odds = trueOddsToAmerican(decimal);
			player[betKey] = odds;
			player[betChanceKey] = betChanceRounded(odds);
			return true;
		};

		if (player.fullName === "Elias Pettersson") {
			if (player.playerId === 8480012) {
				if (betKey === 'bet1' && process("Elias Pettersson")) return; // DraftKings
				if (betKey === 'bet2' && process("Elias Pettersson #40")) return; // FanDuel
				if (betKey === 'bet4' && process("Elias Pettersson (1998)")) return; // BetRivers
			}
			if (player.playerId === 8483678) {
				if (betKey === 'bet1' && process("Elias-Nils Pettersson")) return; // DraftKings
				if (betKey === 'bet2' && process("Elias Pettersson #25")) return; // FanDuel
				if (betKey === 'bet4' && process("Elias Pettersson (2004)")) return; // BetRivers
			}
			return;
		}

		const baseName = player.fullName;
		if (process(baseName)) return;

		const mapped = oddsNameMap.get(player.fullName);
		if (mapped && process(mapped)) return;

		const firstLang: Set<string> = new Set();
		for (const lang in player.firstName) {
			if (lang === "default") continue;

			const first = player.firstName[lang];
			const last = player.lastName[lang] ?? player.lastName.default;
			const name = `${first} ${last}`;

			if (process(name)) return;

			firstLang.add(lang);
		}
		for (const lang in player.lastName) {
			if (lang === "default") continue;
			if (firstLang.has(lang)) continue;

			const first = player.firstName.default;
			const last = player.lastName[lang];
			const name = `${first} ${last}`;
			if (process(name)) return;
		}
	};

	const bet1 = new Map<string, number>();
	const bet2 = new Map<string, number>();
	const bet3 = new Map<string, number>();
	const bet4 = new Map<string, number>();
	const mapNames = (
		item: { name: string; odds: number },
		betMap: Map<string, number>
	): void => {
		betMap.set(removeAccentsNormalize(item.name), item.odds);
	}
	for (const item of playerOddsDraftKings) mapNames(item, bet1);
	for (const item of playerOddsFanDuel) mapNames(item, bet2);
	for (const item of playerOddsBetMGM) mapNames(item, bet3);
	for (const item of playerOddsBetRivers) mapNames(item, bet4);
	for (const player of playerList) {
		nameFind(player, bet1, "bet1", "betChance1");
		nameFind(player, bet2, "bet2", "betChance2");
		nameFind(player, bet3, "bet3", "betChance3");
		nameFind(player, bet4, "bet4", "betChance4");
	}
	for (const player of playerList) {
		let count = 0;
		let avg = 0;
		if (player.bet1 !== null) { avg += player.bet1; count++; }
		if (player.bet2 !== null) { avg += player.bet2; count++; }
		if (player.bet3 !== null) { avg += player.bet3; count++; }
		if (player.bet4 !== null) { avg += player.bet4; count++; }
		if (count > 0) {
			avg /= count;
			player.betAvg = betChance(avg);
			player.betChanceAvg = betChanceRounded(avg);
		}
	}
	playerList.sort((a, b) => a.fullName.localeCompare(b.fullName));
}
compilePlayerList();

const dataStats: string[][] = [];
const logStats = () => {
	const processRow = (rows: Picks.PickOdds[]): Picks.Player[] | null => {
		let max: Picks.Player[] | null = null;
		for (const row of rows) {
			const player = row.player;
			const val = player.betAvg;
			if (val === null) continue;
			if (!max) {
				max = [player];
				continue;
			}
			const maxrow = max[0];
			const maxval = maxrow.betAvg!;
			if (val < maxval) continue;
			if (val > maxval) max = [player];
			else max.push(player);
		}
		return max;
	};

	const max1row = processRow(table1Rows);
	const max2row = processRow(table2Rows);
	const max3row = processRow(table3Rows);

	const logs1: string[] = ["Any:"];
	const logs2: string[] = ["Avg:"];
	const logs3: string[] = ["All:"];

	if (max1row && max2row && max3row) {
		const max1 = max1row[0].betAvg;
		const max2 = max2row[0].betAvg;
		const max3 = max3row[0].betAvg;
		if (max1 !== null && max2 !== null && max3 !== null) {
			logs1.push(roundToPercent(1 - (1 - max1) * (1 - max2) * (1 - max3), precision));
			logs2.push(roundToPercent((max1 + max2 + max3) / 3, precision));
			logs3.push(roundToPercent(max1 * max2 * max3, precision));
		}
	}

	logs1.push("(70-74)  79.1 80.8 81.8");
	logs2.push("(33-36) 38-40 42.1 43.1");
	logs3.push(" (3-4)     5.5  7.3  7.8");

	console.log(...logs1);
	console.log(...logs2);
	console.log(...logs3);
	dataStats.push([logs1.join(" "), logs2.join(" "), logs3.join(" ")]);

	const addLogout = (log: string, section: number) => {
		console.log(log);
		if (!dataStats[section]) dataStats[section] = [];
		dataStats[section].push(log);
	}

	const printName = (player: Picks.Player) => `${player.fullName} (${player.team.code})`;

	if (max1row) {
		const names = max1row.map(player => printName(player)).join(", ");
		addLogout(`Top 1: ${roundToPercent(max1row[0].betAvg!, precision)} - ${names}`, 2);
	}
	if (max2row) {
		const names = max2row.map(player => printName(player)).join(", ");
		addLogout(`Top 2: ${roundToPercent(max2row[0].betAvg!, precision)} - ${names}`, 2);
	}
	if (max3row) {
		const names = max3row.map(player => printName(player)).join(", ");
		addLogout(`Top 3: ${roundToPercent(max3row[0].betAvg!, precision)} - ${names}`, 2);
	}

	let totalMax = 0;
	interface AvgResult {
		avg: number;
		players: Picks.Player[];
	}
	interface Avg {
		avg: number;
		player: Picks.Player;
	}
	const calulateAvg = (rows: Picks.PickOdds[]): AvgResult[] => {
		const avgs: Avg[] = [];
		for (const row of rows) {
			const player = row.player;
			let avg = 0;
			let count = 0;
			const bet1 = betChance(player.bet1);
			if (bet1 !== null) { avg += bet1; count++; }
			const bet2 = betChance(player.bet2);
			if (bet2 !== null) { avg += bet2; count++; }
			const bet3 = betChance(player.bet3);
			if (bet3 !== null) { avg += bet3; count++; }
			const bet4 = betChance(player.bet4);
			if (bet4 !== null) { avg += bet4; count++; }
			if (count > 0) avg /= count;
			avgs.push({ avg, player });
		}

		avgs.sort((a, b) => b.avg - a.avg);

		const results: AvgResult[] = [];
		if (avgs.length === 0) return results;

		const range = 0.04;
		let prev: AvgResult | null = null;
		let topAvg = 0;

		for (const avg of avgs) {
			if (prev === null) {
				topAvg = avg.avg;
				totalMax += topAvg;
				const result: AvgResult = { avg: topAvg, players: [avg.player] };
				prev = result;
				results.push(result);
				continue;
			}
			if (avg.avg < topAvg - range) break;
			if (avg.avg === prev.avg) {
				prev.players.push(avg.player);
			} else {
				const result: AvgResult = { avg: avg.avg, players: [avg.player] };
				prev = result;
				results.push(result);
			}
		}
		return results;
	}

	for (const avg of calulateAvg(table1Rows)) {
		addLogout(`Avg 1: ${roundToPercent(avg.avg, precision)} - ${avg.playerNames.join(", ")}`, 2);
	}
	for (const avg of calulateAvg(table2Rows)) {
		addLogout(`Avg 2: ${roundToPercent(avg.avg, precision)} - ${avg.playerNames.join(", ")}`, 2);
	}
	for (const avg of calulateAvg(table3Rows)) {
		addLogout(`Avg 3: ${roundToPercent(avg.avg, precision)} - ${avg.playerNames.join(", ")}`, 2);
	}
}
logStats();

const oddsColumns: Picks.ColumnData[] = sportsbooks.map((book) => ({
	key: book.key,
	title: book.title,
	sort: true,
	logo: book.logo,
}));

const columns: Picks.ColumnData[] = [
	{ key: "fullName", title: "Player", sort: true },
	{ key: "gg", title: "G/GP", sort: true },
	...oddsColumns,
	{ key: "betAvg", title: "Avg", sort: true },
];

const columnsPlayer: Picks.ColumnData[] = [
	{ key: "fullName", title: "Player", sort: true },
	...oddsColumns,
	{ key: "betAvg", title: "Avg", sort: true },
	{ key: "pick", title: "Pick", sort: false },
	{ key: "gameTime", title: "Start", sort: true },
];

type processKeys = 'bet1' | 'bet2' | 'bet3' | 'bet4' | 'betAvg';
const processMax = (row: Picks.PickOdds, max: Picks.PickOdds[], key: processKeys, reverse?: boolean) => {
	const rowVal = row.player[key];
	if (rowVal === null) return;

	if (max.length === 0) {
		max.push(row);
		return;
	}

	const topBet = max[0].player[key]!;
	if (rowVal === topBet) {
		max.push(row);
	} else {
		if (reverse) {
			if (rowVal > topBet) max.splice(0, max.length, row);
		} else {
			if (rowVal < topBet) max.splice(0, max.length, row);
		}
	}
}
const processMaxArray = (array: Picks.PickOdds[]) => {
	const max1: Picks.PickOdds[] = [];
	const max2: Picks.PickOdds[] = [];
	const max3: Picks.PickOdds[] = [];
	const max4: Picks.PickOdds[] = [];
	const maxAvg: Picks.PickOdds[] = [];
	for (const row of array) {
		row.highlight1 = false;
		row.highlight2 = false;
		row.highlight3 = false;
		row.highlight4 = false;
		row.highlightAvg = false;
		processMax(row, max1, 'bet1');
		processMax(row, max2, 'bet2');
		processMax(row, max3, 'bet3');
		processMax(row, max4, 'bet4');
		processMax(row, maxAvg, 'betAvg', true);
	}
	for (const row of max1) row.highlight1 = true;
	for (const row of max2) row.highlight2 = true;
	for (const row of max3) row.highlight3 = true;
	for (const row of max4) row.highlight4 = true;
	for (const row of maxAvg) row.highlightAvg = true;
}

for (const i in dataStats) {
	const stat = dataStats[i];
	for (const j in stat) stat[j] = stat[j].replaceAll(' ', '\u00A0');
}

function App() {
	const [showPopup, setShowPopup] = useState(false);

	const [chances, setChances] = useState(true);
	const toggleHandler = () => {
		setChances(prev => !prev); // Flips the state to the opposite value
	};

	// Table data and sorting - regenerate when theme changes
	const [rows1] = useState(table1Rows);
	const sortedRows1 = [...rows1];

	const [rows2] = useState(table2Rows);
	const sortedRows2 = [...rows2];

	const [rows3] = useState(table3Rows);
	const sortedRows3 = [...rows3];

	const [rowsPlayer] = useState(playerList);
	const sortedRowsPlayer = [...rowsPlayer];

	// Theme state
	const [darkTheme, setDarkTheme] = useState(() => {
		return window.matchMedia('(prefers-color-scheme: dark)').matches;
	});
	// Update theme when system preference changes
	useEffect(() => {
		const handleChange = (event: MediaQueryListEvent) => {
			setDarkTheme(event.matches);
		};
		const darkModeMql = window.matchMedia('(prefers-color-scheme: dark)');
		darkModeMql.addEventListener('change', handleChange);
		return () => darkModeMql.removeEventListener('change', handleChange);
	}, []);

	const [sortConfig1, setSortConfig1] = useState<Picks.SortConfig>({ keyOrder: ['gg'] });
	const [sortConfig2, setSortConfig2] = useState<Picks.SortConfig>({ keyOrder: ['gg'] });
	const [sortConfig3, setSortConfig3] = useState<Picks.SortConfig>({ keyOrder: ['gg'] });
	const [sortConfigPlayer, setSortConfigPlayer] = useState<Picks.SortConfig>({ keyOrder: ['bet1'] });

	sortedRows1.sort(sortFunction(sortConfig1));
	sortedRows2.sort(sortFunction(sortConfig2));
	sortedRows3.sort(sortFunction(sortConfig3));
	sortedRowsPlayer.sort(sortFunction(sortConfigPlayer));

	const requestSort1: Picks.RequestSort = makeSort(sortConfig1, setSortConfig1);
	const requestSort2: Picks.RequestSort = makeSort(sortConfig2, setSortConfig2);
	const requestSort3: Picks.RequestSort = makeSort(sortConfig3, setSortConfig3);
	const requestSortPlayer: Picks.RequestSort = makeSort(sortConfigPlayer, setSortConfigPlayer);

	processMaxArray(sortedRows1);
	processMaxArray(sortedRows2);
	processMaxArray(sortedRows3);

	return (
		<>
			<header className='header'>
				<button className="button" onClick={() => setShowPopup(!showPopup)}>?</button>
				<span className="header-title">Tims Hockey Picks</span>
				<button className={chances ? 'button chances-on' : 'button chances-off'} onClick={toggleHandler}>%</button>
			</header>
			<main className='content'>
				<Popup showPopUp={showPopup} closePopUp={() => setShowPopup(false)}>
					<h2>Stats</h2>
					{
						dataStats.map((stat, i) => (
							<div key={i} className='popup-section'>
								{stat.map((title, j) => (
									<div key={j}>{title}</div>
								))}
							</div>
						))
					}
				</Popup>

				<div className="table-container">
					<h2>Sportsbooks</h2>
					<div className="sportsbook-list">
						{sportsbooks.map((book) => (
							<div key={book.key} className="sportsbook-item">
								<img className="sportsbook-logo logo-rounded" src={book.logo} alt={`${book.title} logo`} />
								<span>{book.title}</span>
							</div>
						))}
					</div>
				</div>
				<div className="table-container">
					<h2>Games</h2>
					<Picks.Basic games={gamesList} darkTheme={darkTheme} />
				</div>
				<div className="table-container">
					<h2>Pick #1</h2>
					<Picks.Table columns={columns} sortedRows={sortedRows1} requestSort={requestSort1} sortConfig={sortConfig1} darkTheme={darkTheme} chances={chances} />
				</div>
				<div className="table-container">
					<h2>Pick #2</h2>
					<Picks.Table columns={columns} sortedRows={sortedRows2} requestSort={requestSort2} sortConfig={sortConfig2} darkTheme={darkTheme} chances={chances} />
				</div>
				<div className="table-container">
					<h2>Pick #3</h2>
					<Picks.Table columns={columns} sortedRows={sortedRows3} requestSort={requestSort3} sortConfig={sortConfig3} darkTheme={darkTheme} chances={chances} />
				</div>
				<div className="table-container">
					<h2>Players</h2>
					<Picks.Table columns={columnsPlayer} sortedRows={sortedRowsPlayer} requestSort={requestSortPlayer} sortConfig={sortConfigPlayer} darkTheme={darkTheme} chances={chances} />
				</div>
			</main>
		</>
	)
}

export default App
