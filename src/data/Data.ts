
// Tims Hockey Challenge Helper
export interface DataTimsHelper {
    nhlPlayerId: number,
    firstName: string,
    lastName: string,
    homeAway: string,
    position: string,
    gamesPlayed: number,
    goals: number,
    goalsPerGame: number,
    shots: number,
    shotsPerGame: number,
    shootingPercentage: number,
    powerPlayTimeOnIcePerGame: string,
    timeOnIcePerGame: string,
    team: string,
    opponentTeam: string,
    opponentGAA: number,
    seasonType: number,
    playerStatus: number,
    scored: boolean,
    unavailable: boolean,
    fullName: string,
    line: string,
    linemates: string,
    ppLine: string,
    ppLinemates: string,
    gameLogs: never[]
}

// DraftKings
interface DisplayOdds {
    american: string;
    decimal: string;
    fractional: string;
}

interface Participant {
    id: string;
    name: string;
    type: string;
    seoIdentifier: string;
    venueRole: string;
    isNationalTeam: boolean;
}

export interface DataDraftKings {
    id: string;
    marketId: string;
    label: string;
    displayOdds: DisplayOdds;
    trueOdds: number;
    outcomeType: string;
    participants: Participant[];
    sortOrder: number;
    tags: string[];
    metadata: Record<string, unknown>;
}
