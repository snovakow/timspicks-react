import { useState, useEffect } from 'react';
import './App.css';
import { getLogo } from './components/logo';
import Table from './components/Table';
import type { RowData, KeyType, RowKey, ColumnData, RequestSort, SortConfig } from './components/Table';
import playerData from './data/picks.json';
console.log(playerData);

const chances = true;

type OrderKeyType = KeyType | "rawOrder" | "gg";

const columns: ColumnData[] = [
  { key: "name", title: "Player" },
  { key: "gg", title: "GG" },
  { key: "bet1", title: "DraftKings" },
  { key: "bet2", title: "FanDuel" },
  { key: "bet3", title: "BetRivers" },
  { key: "bet4", title: "Hard Rock" },
];

const rountdTo = (num: number, places: number): string => {
  const factor = Math.pow(10, places);
  return num.toFixed(places);
}

// Poisson distribution chance of 0 goals: e^(−μ)
// Chance of at least one goal: 1 − e^(−μ)
const ggChance = (x: number): string => {
  const chance = 1 - Math.exp(-x);
  return rountdTo(chance * 100, 2) + "%";
}

// Implied Odds
const betChance = (x: number): string => {
  if (x === 0) {
    return "-";
  }
  let chance;
  if (x < 0) {
    chance = -x / (100 - x);
  } else {
    chance = 100 / (x + 100);
  }
  return rountdTo(chance * 100, 2) + "%";
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
      betChance1: betChance(item.bet1),
      bet2: item.bet2,
      betChance2: betChance(item.bet2),
      bet3: item.bet3,
      betChance3: betChance(item.bet3),
      bet4: item.bet4,
      betChance4: betChance(item.bet4),
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

  const [sortConfig1, setSortConfig1] = useState<SortConfig | null>(null);
  const [sortConfig2, setSortConfig2] = useState<SortConfig | null>(null);
  const [sortConfig3, setSortConfig3] = useState<SortConfig | null>(null);

  if (sortConfig1 !== null) {
    sortedRows1.sort(sortFunction(sortConfig1));
  }
  if (sortConfig2 !== null) {
    sortedRows2.sort(sortFunction(sortConfig2));
  }
  if (sortConfig3 !== null) {
    sortedRows3.sort(sortFunction(sortConfig3));
  }

  const requestSort1: RequestSort = (keyPrimary: KeyType) => {
    if (!sortConfig1) {
      setSortConfig1({ keyOrder: [keyPrimary] });
      return;
    }
    if (sortConfig1.keyOrder[0] === keyPrimary) {
      setSortConfig1(null);
      return;
    }
    const keyOrder = [keyPrimary];
    for (const key of sortConfig1.keyOrder) {
      if (key === keyPrimary) continue;
      keyOrder.push(key);
    }
    setSortConfig1({ keyOrder });
  };
  const requestSort2: RequestSort = (keyPrimary: KeyType) => {
    if (!sortConfig2) {
      setSortConfig2({ keyOrder: [keyPrimary] });
      return;
    }
    if (sortConfig2.keyOrder[0] === keyPrimary) {
      setSortConfig2(null);
      return;
    }
    const keyOrder = [keyPrimary];
    for (const key of sortConfig2.keyOrder) {
      if (key === keyPrimary) continue;
      keyOrder.push(key);
    }
    setSortConfig2({ keyOrder });
  };
  const requestSort3: RequestSort = (keyPrimary: KeyType) => {
    if (!sortConfig3) {
      setSortConfig3({ keyOrder: [keyPrimary] });
      return;
    }
    if (sortConfig3.keyOrder[0] === keyPrimary) {
      setSortConfig3(null);
      return;
    }
    const keyOrder = [keyPrimary];
    for (const key of sortConfig3.keyOrder) {
      if (key === keyPrimary) continue;
      keyOrder.push(key);
    }
    setSortConfig3({ keyOrder });
  };

  return (
    <>
      <header className='header satisfy-regular'>
        Tims Hockey Challenge Picks
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
