import { type Team, isTeam } from "./components/logo";

// Given data.selections (team total goals market), calculate the expected (mean) number of goals as a decimal
type DataSelection = {
    points: number;
    label: string;
    displayOdds: { decimal: string };
    participants: { seoIdentifier: string }[];
};
export function expectedGoals(selections: Array<DataSelection>): number | null {
    // Group selections by points
    const grouped: Record<number, { over?: number; under?: number }> = {};
    for (const sel of selections) {
        const pts = sel.points;
        const dec = Number(sel.displayOdds.decimal);
        if (!grouped[pts]) grouped[pts] = {};
        if (sel.label === 'Over') grouped[pts].over = dec;
        if (sel.label === 'Under') grouped[pts].under = dec;
    }
    // For each interval, calculate implied probability for that goal total
    // Use de-vig: always normalize both Over and Under
    const probs: Record<number, number> = {};
    const sortedPoints = Object.keys(grouped).map(Number).sort((a, b) => a - b);
    for (let i = 0; i < sortedPoints.length - 1; ++i) {
        const lower = sortedPoints[i];
        const upper = sortedPoints[i + 1];
        // For lower line
        let pOverLower: number | undefined = undefined;
        const overLower = grouped[lower].over;
        const underLower = grouped[lower].under;
        if (overLower && underLower) {
            const invOver = 1 / overLower;
            const invUnder = 1 / underLower;
            const sum = invOver + invUnder;
            pOverLower = invOver / sum;
        } else if (overLower) {
            pOverLower = 1 / overLower;
        }
        // For upper line
        let pOverUpper: number | undefined = undefined;
        const overUpper = grouped[upper].over;
        const underUpper = grouped[upper].under;
        if (overUpper && underUpper) {
            const invOver = 1 / overUpper;
            const invUnder = 1 / underUpper;
            const sum = invOver + invUnder;
            pOverUpper = invOver / sum;
        } else if (overUpper) {
            pOverUpper = 1 / overUpper;
        }
        if (pOverLower !== undefined && pOverUpper !== undefined) {
            const norm = pOverLower - pOverUpper;
            probs[lower + 0.5] = norm;
        }
    }
    // Normalize probabilities to sum to 1
    const totalProb = Object.values(probs).reduce((a, b) => a + b, 0);
    if (totalProb === 0) return null;
    // Compute expected value (mean)
    let mean = 0;
    for (const k in probs) {
        mean += Number(k) * (probs[k] / totalProb);
    }
    return mean;
}

const NAV_URL = "https://sportsbook-nash.draftkings.com/sites/CA-ON-SB/api/sportscontent/controldata/league/leagueSubcategory/v1/markets?isBatchable=false&templateVars=42133&eventsQuery=%24filter%3DleagueId%20eq%20%2742133%27%20AND%20clientMetadata%2FSubcategories%2Fany%28s%3A%20s%2FId%20eq%20%2716716%27%29&marketsQuery=%24filter%3DclientMetadata%2FsubCategoryId%20eq%20%2716716%27%20AND%20tags%2Fall%28t%3A%20t%20ne%20%27SportcastBetBuilder%27%29&include=Events&entity=events";

async function getEventIds() {
    const res = await fetch(NAV_URL);
    const data = await res.json();
    console.log(data);
    return data;
}

export async function getTeamTotalsForAllGames() {
    const json = await getEventIds();
    const today = new Date().toDateString();
    const events = new Set<string>();
    const markets = new Set<string>();

    for (const event of json.events) {
        const startDate = new Date(event.startEventDate);
        if (startDate.toDateString() !== today) continue;
        events.add(event.id);
    }

    for (const market of json.markets) {
        if (events.has(market.eventId)) markets.add(market.id);
    }

    const results: Map<Team, number> = new Map();
    const selections: Map<string, DataSelection[]> = new Map();
    for (const selection of json.selections) {
        if (!markets.has(selection.marketId)) continue;

        const name = selection.participants[0].name;
        let selectionList = selections.get(name);
        if (!selectionList) {
            selectionList = [];
            selections.set(name, selectionList);
        }
        selectionList.push(selection);
    }

    for (const [name, selection] of selections) {
        const xG = expectedGoals(selection);
        if (xG === null) continue;

        const parse = name.split(" ");
        if (parse.length < 1) continue;

        const team = parse[0];
        if (team.length === 2 && parse.length > 1) {
            const initial = parse[1];
            if (initial && initial.length > 0) {
                const name = (team + initial[0]);
                if (isTeam(name)) results.set(name, xG);
            }
            continue;
        }
        if (team.length === 3) {
            if (isTeam(team)) results.set(team, xG);
        }
    }

    return results;
}
