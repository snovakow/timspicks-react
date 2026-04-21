const teams = [
    "CAR", "CBJ", "NJD", "NYI", "NYR", "PHI", "PIT", "WSH",
    "BOS", "BUF", "DET", "FLA", "MTL", "OTT", "TBL", "TOR",
    "CHI", "COL", "DAL", "MIN", "NSH", "STL", "UTA", "WPG",
    "ANA", "CGY", "EDM", "LAK", "SJS", "SEA", "VAN", "VGK"
] as const;

// Type guard for Team
export function isTeam(value: unknown): value is Team {
    return typeof value === "string" && (teams as readonly string[]).includes(value);
}
export type Team = typeof teams[number];
