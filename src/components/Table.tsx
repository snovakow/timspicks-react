export type KeyType = "name" | "gg" | "bet1" | "bet2" | "bet3" | "bet5v5";
export interface RowOdds {
    name: string;
    bet1: number | null;
    bet2: number | null;
    bet3: number | null;
    betChance1: string;
    betChance2: string;
    betChance3: string;
}
export interface RowKey extends RowOdds {
    logoLight: string;
    logoDark: string;
    gg: number;
    bet5v5: number | null;
    ggChance: string;
    betChance5v5: string;
}

export interface ColumnData {
    key: KeyType;
    title: string;
}

export type RequestSort = (key: KeyType) => void;

export interface SortConfig {
    keyOrder: KeyType[];
}

export function Table(props: {
    columns: ColumnData[],
    sortedRows: (RowOdds | RowOdds)[],
    requestSort: RequestSort,
    sortConfig: SortConfig,
    darkTheme: boolean,
    chances: boolean
}) {
    const { columns, sortedRows, requestSort, sortConfig, darkTheme, chances } = props;
    return (
        <table>
            <thead>
                <tr>
                    {
                        columns.map(item => (
                            <th key={item.key}
                                onClick={() => requestSort(item.key)}>
                                <span className='cell-container'>
                                    <span className='theader-pad'>▲</span>
                                    <span className='theader-title'>{item.title}</span>
                                    <span className={sortConfig?.keyOrder[0] === item.key ? 'theader-sort' : 'theader-sort-hidden'}>▲</span>
                                </span>
                            </th>
                        ))
                    }
                </tr>
            </thead>
            <tbody>
                {sortedRows.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'row-color' : 'row-color-alt'}>
                        <td>
                            <span className='cell-container'>
                                <img className='td-name-logo' src={darkTheme ? row.logoDark : row.logoLight} />
                                {row.name}
                            </span>
                        </td>
                        <td>{chances ? row.ggChance : row.gg.toFixed(2)}</td>
                        <td>{chances ? row.betChance1 : (row.bet1 === null ? "-" : row.bet1)}</td>
                        <td>{chances ? row.betChance2 : (row.bet2 === null ? "-" : row.bet2)}</td>
                        <td>{chances ? row.betChance3 : (row.bet3 === null ? "-" : row.bet3)}</td>
                        <td>{chances ? row.betChance5v5 : (row.bet5v5 === null ? "-" : row.bet5v5.toFixed(2))}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
