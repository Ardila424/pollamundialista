// ============================================
// Datos del Mundial 2026 — Fase de Grupos
// 48 selecciones, 12 grupos, 104 partidos
// ============================================

interface MatchSeed {
  id: number;
  home_team: string;
  away_team: string;
  match_date: string;
  phase: string;
  group_name: string | null;
}

export const worldCup2026Matches: MatchSeed[] = [
  // FASE DE GRUPOS — Jornada 1
  { id: 1, home_team: 'México', away_team: 'A2', match_date: '2026-06-11T18:00:00Z', phase: 'Grupos', group_name: 'A' },
  { id: 2, home_team: 'A3', away_team: 'A4', match_date: '2026-06-11T21:00:00Z', phase: 'Grupos', group_name: 'A' },
  { id: 3, home_team: 'B1', away_team: 'B2', match_date: '2026-06-11T22:00:00Z', phase: 'Grupos', group_name: 'B' },
  { id: 4, home_team: 'B3', away_team: 'B4', match_date: '2026-06-12T16:00:00Z', phase: 'Grupos', group_name: 'B' },
  { id: 5, home_team: 'C1', away_team: 'C2', match_date: '2026-06-12T18:00:00Z', phase: 'Grupos', group_name: 'C' },
  { id: 6, home_team: 'C3', away_team: 'C4', match_date: '2026-06-12T21:00:00Z', phase: 'Grupos', group_name: 'C' },
  { id: 7, home_team: 'Estados Unidos', away_team: 'D2', match_date: '2026-06-13T16:00:00Z', phase: 'Grupos', group_name: 'D' },
  { id: 8, home_team: 'D3', away_team: 'D4', match_date: '2026-06-13T18:00:00Z', phase: 'Grupos', group_name: 'D' },
  { id: 9, home_team: 'E1', away_team: 'E2', match_date: '2026-06-13T21:00:00Z', phase: 'Grupos', group_name: 'E' },
  { id: 10, home_team: 'E3', away_team: 'E4', match_date: '2026-06-13T22:00:00Z', phase: 'Grupos', group_name: 'E' },
  { id: 11, home_team: 'F1', away_team: 'F2', match_date: '2026-06-14T16:00:00Z', phase: 'Grupos', group_name: 'F' },
  { id: 12, home_team: 'F3', away_team: 'F4', match_date: '2026-06-14T18:00:00Z', phase: 'Grupos', group_name: 'F' },
  { id: 13, home_team: 'G1', away_team: 'G2', match_date: '2026-06-14T21:00:00Z', phase: 'Grupos', group_name: 'G' },
  { id: 14, home_team: 'G3', away_team: 'G4', match_date: '2026-06-14T22:00:00Z', phase: 'Grupos', group_name: 'G' },
  { id: 15, home_team: 'Canadá', away_team: 'H2', match_date: '2026-06-15T16:00:00Z', phase: 'Grupos', group_name: 'H' },
  { id: 16, home_team: 'H3', away_team: 'H4', match_date: '2026-06-15T18:00:00Z', phase: 'Grupos', group_name: 'H' },
  { id: 17, home_team: 'I1', away_team: 'I2', match_date: '2026-06-15T21:00:00Z', phase: 'Grupos', group_name: 'I' },
  { id: 18, home_team: 'I3', away_team: 'I4', match_date: '2026-06-15T22:00:00Z', phase: 'Grupos', group_name: 'I' },
  { id: 19, home_team: 'J1', away_team: 'J2', match_date: '2026-06-16T16:00:00Z', phase: 'Grupos', group_name: 'J' },
  { id: 20, home_team: 'J3', away_team: 'J4', match_date: '2026-06-16T18:00:00Z', phase: 'Grupos', group_name: 'J' },
  { id: 21, home_team: 'K1', away_team: 'K2', match_date: '2026-06-16T21:00:00Z', phase: 'Grupos', group_name: 'K' },
  { id: 22, home_team: 'K3', away_team: 'K4', match_date: '2026-06-16T22:00:00Z', phase: 'Grupos', group_name: 'K' },
  { id: 23, home_team: 'L1', away_team: 'L2', match_date: '2026-06-17T16:00:00Z', phase: 'Grupos', group_name: 'L' },
  { id: 24, home_team: 'L3', away_team: 'L4', match_date: '2026-06-17T18:00:00Z', phase: 'Grupos', group_name: 'L' },

  // FASE DE GRUPOS — Jornada 2
  { id: 25, home_team: 'A4', away_team: 'México', match_date: '2026-06-18T18:00:00Z', phase: 'Grupos', group_name: 'A' },
  { id: 26, home_team: 'A2', away_team: 'A3', match_date: '2026-06-18T21:00:00Z', phase: 'Grupos', group_name: 'A' },
  { id: 27, home_team: 'B4', away_team: 'B1', match_date: '2026-06-19T16:00:00Z', phase: 'Grupos', group_name: 'B' },
  { id: 28, home_team: 'B2', away_team: 'B3', match_date: '2026-06-19T21:00:00Z', phase: 'Grupos', group_name: 'B' },
  { id: 29, home_team: 'C4', away_team: 'C1', match_date: '2026-06-19T18:00:00Z', phase: 'Grupos', group_name: 'C' },
  { id: 30, home_team: 'C2', away_team: 'C3', match_date: '2026-06-19T22:00:00Z', phase: 'Grupos', group_name: 'C' },
  { id: 31, home_team: 'D4', away_team: 'Estados Unidos', match_date: '2026-06-20T16:00:00Z', phase: 'Grupos', group_name: 'D' },
  { id: 32, home_team: 'D2', away_team: 'D3', match_date: '2026-06-20T21:00:00Z', phase: 'Grupos', group_name: 'D' },
  { id: 33, home_team: 'E4', away_team: 'E1', match_date: '2026-06-20T18:00:00Z', phase: 'Grupos', group_name: 'E' },
  { id: 34, home_team: 'E2', away_team: 'E3', match_date: '2026-06-20T22:00:00Z', phase: 'Grupos', group_name: 'E' },
  { id: 35, home_team: 'F4', away_team: 'F1', match_date: '2026-06-21T16:00:00Z', phase: 'Grupos', group_name: 'F' },
  { id: 36, home_team: 'F2', away_team: 'F3', match_date: '2026-06-21T21:00:00Z', phase: 'Grupos', group_name: 'F' },
  { id: 37, home_team: 'G4', away_team: 'G1', match_date: '2026-06-21T18:00:00Z', phase: 'Grupos', group_name: 'G' },
  { id: 38, home_team: 'G2', away_team: 'G3', match_date: '2026-06-21T22:00:00Z', phase: 'Grupos', group_name: 'G' },
  { id: 39, home_team: 'H4', away_team: 'Canadá', match_date: '2026-06-22T16:00:00Z', phase: 'Grupos', group_name: 'H' },
  { id: 40, home_team: 'H2', away_team: 'H3', match_date: '2026-06-22T21:00:00Z', phase: 'Grupos', group_name: 'H' },
  { id: 41, home_team: 'I4', away_team: 'I1', match_date: '2026-06-22T18:00:00Z', phase: 'Grupos', group_name: 'I' },
  { id: 42, home_team: 'I2', away_team: 'I3', match_date: '2026-06-22T22:00:00Z', phase: 'Grupos', group_name: 'I' },
  { id: 43, home_team: 'J4', away_team: 'J1', match_date: '2026-06-23T16:00:00Z', phase: 'Grupos', group_name: 'J' },
  { id: 44, home_team: 'J2', away_team: 'J3', match_date: '2026-06-23T21:00:00Z', phase: 'Grupos', group_name: 'J' },
  { id: 45, home_team: 'K4', away_team: 'K1', match_date: '2026-06-23T18:00:00Z', phase: 'Grupos', group_name: 'K' },
  { id: 46, home_team: 'K2', away_team: 'K3', match_date: '2026-06-23T22:00:00Z', phase: 'Grupos', group_name: 'K' },
  { id: 47, home_team: 'L4', away_team: 'L1', match_date: '2026-06-24T16:00:00Z', phase: 'Grupos', group_name: 'L' },
  { id: 48, home_team: 'L2', away_team: 'L3', match_date: '2026-06-24T21:00:00Z', phase: 'Grupos', group_name: 'L' },

  // FASE DE GRUPOS — Jornada 3
  { id: 49, home_team: 'A3', away_team: 'México', match_date: '2026-06-25T20:00:00Z', phase: 'Grupos', group_name: 'A' },
  { id: 50, home_team: 'A4', away_team: 'A2', match_date: '2026-06-25T20:00:00Z', phase: 'Grupos', group_name: 'A' },
  { id: 51, home_team: 'B3', away_team: 'B1', match_date: '2026-06-25T22:00:00Z', phase: 'Grupos', group_name: 'B' },
  { id: 52, home_team: 'B4', away_team: 'B2', match_date: '2026-06-25T22:00:00Z', phase: 'Grupos', group_name: 'B' },
  { id: 53, home_team: 'C3', away_team: 'C1', match_date: '2026-06-26T20:00:00Z', phase: 'Grupos', group_name: 'C' },
  { id: 54, home_team: 'C4', away_team: 'C2', match_date: '2026-06-26T20:00:00Z', phase: 'Grupos', group_name: 'C' },
  { id: 55, home_team: 'D3', away_team: 'Estados Unidos', match_date: '2026-06-26T22:00:00Z', phase: 'Grupos', group_name: 'D' },
  { id: 56, home_team: 'D4', away_team: 'D2', match_date: '2026-06-26T22:00:00Z', phase: 'Grupos', group_name: 'D' },
  { id: 57, home_team: 'E3', away_team: 'E1', match_date: '2026-06-27T20:00:00Z', phase: 'Grupos', group_name: 'E' },
  { id: 58, home_team: 'E4', away_team: 'E2', match_date: '2026-06-27T20:00:00Z', phase: 'Grupos', group_name: 'E' },
  { id: 59, home_team: 'F3', away_team: 'F1', match_date: '2026-06-27T22:00:00Z', phase: 'Grupos', group_name: 'F' },
  { id: 60, home_team: 'F4', away_team: 'F2', match_date: '2026-06-27T22:00:00Z', phase: 'Grupos', group_name: 'F' },
  { id: 61, home_team: 'G3', away_team: 'G1', match_date: '2026-06-28T20:00:00Z', phase: 'Grupos', group_name: 'G' },
  { id: 62, home_team: 'G4', away_team: 'G2', match_date: '2026-06-28T20:00:00Z', phase: 'Grupos', group_name: 'G' },
  { id: 63, home_team: 'H3', away_team: 'Canadá', match_date: '2026-06-28T22:00:00Z', phase: 'Grupos', group_name: 'H' },
  { id: 64, home_team: 'H4', away_team: 'H2', match_date: '2026-06-28T22:00:00Z', phase: 'Grupos', group_name: 'H' },
  { id: 65, home_team: 'I3', away_team: 'I1', match_date: '2026-06-29T20:00:00Z', phase: 'Grupos', group_name: 'I' },
  { id: 66, home_team: 'I4', away_team: 'I2', match_date: '2026-06-29T20:00:00Z', phase: 'Grupos', group_name: 'I' },
  { id: 67, home_team: 'J3', away_team: 'J1', match_date: '2026-06-29T22:00:00Z', phase: 'Grupos', group_name: 'J' },
  { id: 68, home_team: 'J4', away_team: 'J2', match_date: '2026-06-29T22:00:00Z', phase: 'Grupos', group_name: 'J' },
  { id: 69, home_team: 'K3', away_team: 'K1', match_date: '2026-06-30T20:00:00Z', phase: 'Grupos', group_name: 'K' },
  { id: 70, home_team: 'K4', away_team: 'K2', match_date: '2026-06-30T20:00:00Z', phase: 'Grupos', group_name: 'K' },
  { id: 71, home_team: 'L3', away_team: 'L1', match_date: '2026-06-30T22:00:00Z', phase: 'Grupos', group_name: 'L' },
  { id: 72, home_team: 'L4', away_team: 'L2', match_date: '2026-06-30T22:00:00Z', phase: 'Grupos', group_name: 'L' },

  // TREINTAIDOSAVOS — Ronda de 32
  { id: 73, home_team: '1ro Grupo A', away_team: '3ro Grupo C/D/E', match_date: '2026-07-02T18:00:00Z', phase: 'Treintaidosavos', group_name: null },
  { id: 74, home_team: '2do Grupo A', away_team: '2do Grupo B', match_date: '2026-07-02T21:00:00Z', phase: 'Treintaidosavos', group_name: null },
  { id: 75, home_team: '1ro Grupo B', away_team: '3ro Grupo E/F/G', match_date: '2026-07-02T22:00:00Z', phase: 'Treintaidosavos', group_name: null },
  { id: 76, home_team: '1ro Grupo C', away_team: '3ro Grupo A/B/F', match_date: '2026-07-03T16:00:00Z', phase: 'Treintaidosavos', group_name: null },
  { id: 77, home_team: '2do Grupo C', away_team: '2do Grupo D', match_date: '2026-07-03T18:00:00Z', phase: 'Treintaidosavos', group_name: null },
  { id: 78, home_team: '1ro Grupo D', away_team: '3ro Grupo G/H/I', match_date: '2026-07-03T21:00:00Z', phase: 'Treintaidosavos', group_name: null },
  { id: 79, home_team: '1ro Grupo E', away_team: '3ro Grupo I/J/K', match_date: '2026-07-03T22:00:00Z', phase: 'Treintaidosavos', group_name: null },
  { id: 80, home_team: '2do Grupo E', away_team: '2do Grupo F', match_date: '2026-07-04T16:00:00Z', phase: 'Treintaidosavos', group_name: null },
  { id: 81, home_team: '1ro Grupo F', away_team: '3ro Grupo K/L/A', match_date: '2026-07-04T18:00:00Z', phase: 'Treintaidosavos', group_name: null },
  { id: 82, home_team: '1ro Grupo G', away_team: '2do Grupo H', match_date: '2026-07-04T21:00:00Z', phase: 'Treintaidosavos', group_name: null },
  { id: 83, home_team: '1ro Grupo H', away_team: '3ro Grupo G/I/J', match_date: '2026-07-04T22:00:00Z', phase: 'Treintaidosavos', group_name: null },
  { id: 84, home_team: '2do Grupo G', away_team: '2do Grupo I', match_date: '2026-07-05T16:00:00Z', phase: 'Treintaidosavos', group_name: null },
  { id: 85, home_team: '1ro Grupo I', away_team: '2do Grupo J', match_date: '2026-07-05T18:00:00Z', phase: 'Treintaidosavos', group_name: null },
  { id: 86, home_team: '1ro Grupo J', away_team: '3ro Grupo K/L/B', match_date: '2026-07-05T21:00:00Z', phase: 'Treintaidosavos', group_name: null },
  { id: 87, home_team: '1ro Grupo K', away_team: '2do Grupo L', match_date: '2026-07-05T22:00:00Z', phase: 'Treintaidosavos', group_name: null },
  { id: 88, home_team: '1ro Grupo L', away_team: '2do Grupo K', match_date: '2026-07-05T23:00:00Z', phase: 'Treintaidosavos', group_name: null },

  // OCTAVOS DE FINAL
  { id: 89, home_team: 'Ganador P73', away_team: 'Ganador P74', match_date: '2026-07-07T18:00:00Z', phase: 'Octavos', group_name: null },
  { id: 90, home_team: 'Ganador P75', away_team: 'Ganador P76', match_date: '2026-07-07T21:00:00Z', phase: 'Octavos', group_name: null },
  { id: 91, home_team: 'Ganador P77', away_team: 'Ganador P78', match_date: '2026-07-07T22:00:00Z', phase: 'Octavos', group_name: null },
  { id: 92, home_team: 'Ganador P79', away_team: 'Ganador P80', match_date: '2026-07-08T18:00:00Z', phase: 'Octavos', group_name: null },
  { id: 93, home_team: 'Ganador P81', away_team: 'Ganador P82', match_date: '2026-07-08T21:00:00Z', phase: 'Octavos', group_name: null },
  { id: 94, home_team: 'Ganador P83', away_team: 'Ganador P84', match_date: '2026-07-08T22:00:00Z', phase: 'Octavos', group_name: null },
  { id: 95, home_team: 'Ganador P85', away_team: 'Ganador P86', match_date: '2026-07-09T18:00:00Z', phase: 'Octavos', group_name: null },
  { id: 96, home_team: 'Ganador P87', away_team: 'Ganador P88', match_date: '2026-07-09T21:00:00Z', phase: 'Octavos', group_name: null },

  // CUARTOS DE FINAL
  { id: 97, home_team: 'Ganador P89', away_team: 'Ganador P90', match_date: '2026-07-11T18:00:00Z', phase: 'Cuartos', group_name: null },
  { id: 98, home_team: 'Ganador P91', away_team: 'Ganador P92', match_date: '2026-07-11T21:00:00Z', phase: 'Cuartos', group_name: null },
  { id: 99, home_team: 'Ganador P93', away_team: 'Ganador P94', match_date: '2026-07-12T18:00:00Z', phase: 'Cuartos', group_name: null },
  { id: 100, home_team: 'Ganador P95', away_team: 'Ganador P96', match_date: '2026-07-12T21:00:00Z', phase: 'Cuartos', group_name: null },

  // SEMIFINALES
  { id: 101, home_team: 'Ganador P97', away_team: 'Ganador P98', match_date: '2026-07-15T21:00:00Z', phase: 'Semifinal', group_name: null },
  { id: 102, home_team: 'Ganador P99', away_team: 'Ganador P100', match_date: '2026-07-16T21:00:00Z', phase: 'Semifinal', group_name: null },

  // TERCER PUESTO Y FINAL
  { id: 103, home_team: 'Perdedor SF1', away_team: 'Perdedor SF2', match_date: '2026-07-18T20:00:00Z', phase: 'Tercer Puesto', group_name: null },
  { id: 104, home_team: 'Ganador SF1', away_team: 'Ganador SF2', match_date: '2026-07-19T20:00:00Z', phase: 'Final', group_name: null },
];
