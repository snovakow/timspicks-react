import { useState, useEffect } from 'react';
import './App.css';
import { getLogo } from './components/logo';
import Table from './components/Table';
import type { RowData, KeyType, RowKey, ColumnData, RequestSort, SortConfig } from './components/Table';
import playerData from './data/picks.json';
console.log(playerData);


type OrderKeyType = KeyType | "rawOrder" | "gg";

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
  return data.map((item: RowData, index: number): RowKey => {
    const gg = item.goals / item.gamesPlayed;
    return {
      rawOrder: index,
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
    const keyOrder: OrderKeyType[] = [...sortConfig.keyOrder, "rawOrder"];
    for (const key of keyOrder) {
      const aVal = a[key];
      const bVal = b[key];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        if (key === 'gg') {
          if (aVal !== bVal) return bVal - aVal;
        } else {
          if (aVal !== bVal) {
            if (aVal === 0) return 1;
            if (bVal === 0) return -1;
            return aVal - bVal;
          }
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

const table1Data: RowData[] = playerData.playerLists[0].players as RowData[];
const table2Data: RowData[] = playerData.playerLists[1].players as RowData[];
const table3Data: RowData[] = playerData.playerLists[2].players as RowData[];

function App() {
  // Theme state
  const [darkTheme, setDarkTheme] = useState(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Table data and sorting - regenerate when theme changes
  const table1Rows = makeRows(table1Data);
  const table2Rows = makeRows(table2Data);
  const table3Rows = makeRows(table3Data);

  const [rows1, _setRows1] = useState(table1Rows);
  const sortedRows1 = [...rows1];

  const [rows2, _setRows2] = useState(table2Rows);
  const sortedRows2 = [...rows2];

  const [rows3, _setRows3] = useState(table3Rows);
  const sortedRows3 = [...rows3];

  // Update theme when system preference changes
  useEffect(() => {
    const darkModeMql = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      setDarkTheme(event.matches);
    };
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
