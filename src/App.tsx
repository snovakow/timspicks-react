import { useState, useEffect } from 'react';
import './App.css';
import { getLogo } from './components/logo';
import Table from './components/Table';
import type { RowData, KeyType, RowKey, ColumnData, RequestSort, SortConfig } from './components/Table';
import type { DataDraftKings, DataTimsHelper } from './data/Data';
import playerData from './data/helper.json';
import playerOdds from './data/fanduel.json';



async function loadAndParseJSON(url: string, complete: (data: any) => void) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();
    complete(json);
  } catch (error) {
    console.error("Error loading or parsing JSON:", error);
  }
}

const columns: ColumnData[] = [
  { key: "name", title: "Player" },
  { key: "gg", title: "GG" },
  { key: "bet1", title: "DraftKings" },
  { key: "bet2", title: "FanDuel" },
  { key: "bet3", title: "BetRivers" },
  { key: "bet4", title: "Hard Rock" },
];

const rountdToPercent = (num: number, places: number): string => {
  return (num * 100).toFixed(places) + "%";
}

// Poisson distribution chance of 0 goals: e^(−μ)
// Chance of at least one goal: 1 − e^(−μ)
const ggChance = (x: number): string => {
  const chance = 1 - Math.exp(-x);
  return rountdToPercent(chance, 2);
}

// Implied Odds
const betChance = (x: number): number => {
  if (x === undefined) return 0;
  if (x < 0) return -x / (100 - x);
  else return 100 / (x + 100);
}

const betChanceRounded = (x: number): string => {
  const chance = betChance(x);
  if (chance === 0) return "-";
  return rountdToPercent(chance, 2);
}

const trueOddsToAmerican = (x: number): number => {
  if (x >= 2) {
    return Math.round(100 * (x - 1));
  } else {
    return Math.round(100 / (1 - x));
  }
}

const makeRows = (data: RowData[]): RowKey[] => {
  return data.map((item: RowData): RowKey => {
    const gg = item.goals / item.gamesPlayed;
    return {
      name: `${item.firstName} ${item.lastName}`,
      logoLight: getLogo(item.team, false),
      logoDark: getLogo(item.team, true),
      gg: gg,
      ggChance: ggChance(gg),
      bet1: item.bet1,
      betChance1: betChanceRounded(item.bet1),
      bet2: item.bet2,
      betChance2: betChanceRounded(item.bet2),
      bet3: item.bet3,
      betChance3: betChanceRounded(item.bet3),
      bet4: item.bet4,
      betChance4: betChanceRounded(item.bet4),
    }
  });
}

const sortFunction = (sortConfig: SortConfig) => {
  return (a: RowKey, b: RowKey): number => {
    for (const key of sortConfig.keyOrder) {
      const aVal = a[key];
      const bVal = b[key];

      if (aVal === undefined) {
        if (bVal === undefined) continue;
        return 1;
      }
      if (bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        if (aVal !== bVal) {
          if (key === 'gg') return bVal - aVal;
          else return aVal - bVal;
        }
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const comparison = aVal.localeCompare(bVal, undefined, { sensitivity: 'base' });
        if (comparison !== 0) return comparison;
      }
    }
    return 0;
  }
}

const makeSort = (sortConfig: SortConfig, setSortConfig: (config: SortConfig) => void) => {
  return (keyPrimary: KeyType) => {
    if (sortConfig.keyOrder[0] === keyPrimary) return;
    const keyOrder = [keyPrimary];
    for (const key of sortConfig.keyOrder) {
      if (key === keyPrimary) continue;
      keyOrder.push(key);
    }
    setSortConfig({ keyOrder });
  };
}

const table1Data: DataTimsHelper[] = playerData.playerLists[0].players;
const table2Data: DataTimsHelper[] = playerData.playerLists[1].players;
const table3Data: DataTimsHelper[] = playerData.playerLists[2].players;

const table1Rows = makeRows(table1Data);
const table2Rows = makeRows(table2Data);
const table3Rows = makeRows(table3Data);

const nameMapDraftKings = new Map<string, string>();
nameMapDraftKings.set("Alex Kerfoot", "Alexander Kerfoot");
nameMapDraftKings.set("Joshua Norris", "Josh Norris");
nameMapDraftKings.set("Jake Middleton", "Jacob Middleton");
nameMapDraftKings.set("Martin Fehérváry", "Martin Fehervary");
nameMapDraftKings.set("Cam York", "Cameron York");
nameMapDraftKings.set("Freddy Gaudreau", "Frederick Gaudreau");
nameMapDraftKings.set("Elias Pettersson", "Elias Pettersson (F)");

const betOddsFromMap = (row: RowKey, map: Map<string, number>): number | undefined => {
  const trueOdds = map.get(row.name);
  if (trueOdds === undefined) {
    const name = nameMapDraftKings.get(row.name);
    if (name !== undefined) return map.get(name);
  }
  return trueOdds;
}
type betKeys = "bet1" | "bet2" | "bet3" | "bet4";
type betChanceKey = "betChance1" | "betChance2" | "betChance3" | "betChance4";
const assignOdds = (row: RowKey, trueOdds: number, betKey: betKeys, betChanceKey: betChanceKey): void => {
  const odds = trueOddsToAmerican(trueOdds);
  row[betKey] = odds;
  row[betChanceKey] = betChanceRounded(odds);
}

const url = "https://sportsbook-nash.draftkings.com/sites/CA-ON-SB/api/sportscontent/controldata/league/leagueSubcategory/v1/markets?isBatchable=false&templateVars=42133%2C13809&eventsQuery=%24filter%3DleagueId%20eq%20%2742133%27%20AND%20clientMetadata%2FSubcategories%2Fany%28s%3A%20s%2FId%20eq%20%2713809%27%29&marketsQuery=%24filter%3DclientMetadata%2FsubCategoryId%20eq%20%2713809%27%20AND%20tags%2Fall%28t%3A%20t%20ne%20%27SportcastBetBuilder%27%29&include=Events&entity=events";
loadAndParseJSON(url, (json: any) => {
  const data: DataDraftKings[] = json.selections;
  const map = new Map<string, number>();

  // const arr = [];
  for (const selection of data) {
    const label = selection.label;
    const trueOdds = selection.trueOdds;

    // const participant = selection.participants[0];
    // arr.push({ label, trueOdds, seoIdentifier: participant.seoIdentifier });
    const has = map.has(label);
    if (has) console.error("ALREADY HAS", label);
    map.set(label, trueOdds);
  }
  // arr.sort((a, b) => { return a.label.localeCompare(b.label); });
  // console.log(arr);

  const err: string[] = [];
  for (const row of table1Rows) {
    const odds = betOddsFromMap(row, map);
    if (odds === undefined) err.push(row.name);
    else assignOdds(row, odds, "bet1", "betChance1");
  }
  for (const row of table2Rows) {
    const odds = betOddsFromMap(row, map);
    if (odds === undefined) err.push(row.name);
    else assignOdds(row, odds, "bet1", "betChance1");
  }
  for (const row of table3Rows) {
    const odds = betOddsFromMap(row, map);
    if (odds === undefined) err.push(row.name);
    else assignOdds(row, odds, "bet1", "betChance1");
  }
  console.log("DraftKings", err);

  const myCustomEvent = new Event("DraftKings", {
    bubbles: false,
    cancelable: true,
  });
  window.dispatchEvent(myCustomEvent);
});

const processOdds = () => {
  const map = new Map<string, number>();

  for (const market of Object.values(playerOdds.attachments.markets)) {
    if (market.marketType !== 'ANY_TIME_GOAL_SCORER') continue;
    for (const runner of market.runners) {
      const num = runner.winRunnerOdds.trueOdds.fractionalOdds.numerator;
      const den = runner.winRunnerOdds.trueOdds.fractionalOdds.denominator;
      const trueOdds = num / den + 1;
      map.set(runner.runnerName, trueOdds);
    }
  }

  const err: string[] = [];
  for (const row of table1Rows) {
    const odds = betOddsFromMap(row, map);
    if (odds === undefined) err.push(row.name);
    else assignOdds(row, odds, "bet2", "betChance2");
  }
  for (const row of table2Rows) {
    const odds = betOddsFromMap(row, map);
    if (odds === undefined) err.push(row.name);
    else assignOdds(row, odds, "bet2", "betChance2");
  }
  for (const row of table3Rows) {
    const odds = betOddsFromMap(row, map);
    if (odds === undefined) err.push(row.name);
    else assignOdds(row, odds, "bet2", "betChance2");
  }
  console.log("FanDuel", err);
}
processOdds();

function App() {

  const [chances, setChances] = useState(false);
  const toggleHandler = () => {
    setChances(prev => !prev); // Flips the state to the opposite value
  };

  // Theme state
  const [darkTheme, setDarkTheme] = useState(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Table data and sorting - regenerate when theme changes
  const [rows1, setRows1] = useState(table1Rows);
  const sortedRows1 = [...rows1];

  const [rows2, setRows2] = useState(table2Rows);
  const sortedRows2 = [...rows2];

  const [rows3, setRows3] = useState(table3Rows);
  const sortedRows3 = [...rows3];

  useEffect(() => {
    const handleChange = (event: Event) => {

      setRows1([...table1Rows]);
      setRows2([...table2Rows]);
      setRows3([...table3Rows]);

      let max1row = null;
      let max2row = null;
      let max3row = null;
      for (const row of table1Rows) {
        if (row.bet1 === undefined) continue;
        if (!max1row) max1row = row;
        else if (row.bet1 < max1row.bet1) max1row = row;
      }
      for (const row of table2Rows) {
        if (row.bet1 === undefined) continue;
        if (!max2row) max2row = row;
        else if (row.bet1 < max2row.bet1) max2row = row;
      }
      for (const row of table3Rows) {
        if (row.bet1 === undefined) continue;
        if (!max3row) max3row = row;
        else if (row.bet1 < max3row.bet1) max3row = row;
      }
      if (!max1row || !max2row || !max3row) return;
      const max1 = betChance(max1row.bet1);
      const max2 = betChance(max2row.bet1);
      const max3 = betChance(max3row.bet1);
      const winningChance = 1 - (1 - max1) * (1 - max2) * (1 - max3);
      console.log("Any (70-74):", rountdToPercent(winningChance, 3));
      console.log("Avg (33-38):", rountdToPercent((max1 + max2 + max3) / 3, 3));
      console.log("All (03-04):", rountdToPercent(max1 * max2 * max3, 3));
      console.log("Two (21-22):", rountdToPercent(max1 * max2 * (1 - max3) + max1 * (1 - max2) * max3 + (1 - max1) * max2 * max3, 3));
      console.log("One (46-46):", rountdToPercent(max1 * (1 - max2) * (1 - max3) + (1 - max1) * max2 * (1 - max3) + (1 - max1) * (1 - max2) * max3, 3));
      console.log(max1row.name);
      console.log(max2row.name);
      console.log(max3row.name);
    };
    window.addEventListener("DraftKings", handleChange);
    return () => window.removeEventListener('DraftKings', handleChange);
  }, []);

  // Update theme when system preference changes
  useEffect(() => {
    const handleChange = (event: MediaQueryListEvent) => {
      setDarkTheme(event.matches);
    };
    const darkModeMql = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeMql.addEventListener('change', handleChange);
    return () => darkModeMql.removeEventListener('change', handleChange);
  }, []);

  const [sortConfig1, setSortConfig1] = useState<SortConfig>({ keyOrder: ['gg'] });
  const [sortConfig2, setSortConfig2] = useState<SortConfig>({ keyOrder: ['gg'] });
  const [sortConfig3, setSortConfig3] = useState<SortConfig>({ keyOrder: ['gg'] });

  sortedRows1.sort(sortFunction(sortConfig1));
  sortedRows2.sort(sortFunction(sortConfig2));
  sortedRows3.sort(sortFunction(sortConfig3));

  const requestSort1: RequestSort = makeSort(sortConfig1, setSortConfig1);
  const requestSort2: RequestSort = makeSort(sortConfig2, setSortConfig2);
  const requestSort3: RequestSort = makeSort(sortConfig3, setSortConfig3);

  return (
    <>
      <header className='header satisfy-regular'>
        <span></span>
        Tims Hockey Challenge Picks
        <button className={chances ? 'chances-on' : 'chances-off'} onClick={toggleHandler}>%</button>
      </header>
      <main className='content'>
        <div className="table-container">
          <h2>Pick #1</h2>
          <Table columns={columns} sortedRows={sortedRows1} requestSort={requestSort1} sortConfig={sortConfig1} darkTheme={darkTheme} chances={chances} />
        </div>
        <div className="table-container">
          <h2>Pick #2</h2>
          <Table columns={columns} sortedRows={sortedRows2} requestSort={requestSort2} sortConfig={sortConfig2} darkTheme={darkTheme} chances={chances} />
        </div>
        <div className="table-container">
          <h2>Pick #3</h2>
          <Table columns={columns} sortedRows={sortedRows3} requestSort={requestSort3} sortConfig={sortConfig3} darkTheme={darkTheme} chances={chances} />
        </div>
      </main>
    </>
  )
}

export default App
