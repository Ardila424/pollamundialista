import supabase from '../config/supabase';

export interface TeamStats {
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface GroupStandings {
  groupName: string;
  teams: TeamStats[];
}

export async function getGroupStandings(): Promise<GroupStandings[]> {
  const { data: matches, error } = await supabase
    .from('matches')
    .select('home_team, away_team, home_goals, away_goals, status, group_name')
    .eq('phase', 'Grupos');

  if (error || !matches) {
    throw new Error('Error obteniendo partidos para calcular grupos');
  }

  const groupsMap = new Map<string, Map<string, TeamStats>>();

  // Inicializar todos los equipos encontrados
  for (const match of matches) {
    if (!match.group_name) continue;
    // Ignorar grupos falsos (R32, QF, SF, etc) si es que quedaron con phase = Grupos en BD
    if (!/^[A-L]$/.test(match.group_name)) continue;
    
    if (!groupsMap.has(match.group_name)) {
      groupsMap.set(match.group_name, new Map());
    }

    const group = groupsMap.get(match.group_name)!;
    
    [match.home_team, match.away_team].forEach(team => {
      if (team && !group.has(team)) {
        group.set(team, {
          teamName: team,
          played: 0, won: 0, drawn: 0, lost: 0,
          goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0
        });
      }
    });

    // Si el partido está finalizado, actualizar estadísticas
    if (match.status === 'Finalizado' && match.home_goals !== null && match.away_goals !== null) {
      const homeStats = group.get(match.home_team)!;
      const awayStats = group.get(match.away_team)!;

      homeStats.played++;
      awayStats.played++;

      homeStats.goalsFor += match.home_goals;
      homeStats.goalsAgainst += match.away_goals;
      awayStats.goalsFor += match.away_goals;
      awayStats.goalsAgainst += match.home_goals;

      if (match.home_goals > match.away_goals) {
        homeStats.won++;
        homeStats.points += 3;
        awayStats.lost++;
      } else if (match.home_goals < match.away_goals) {
        awayStats.won++;
        awayStats.points += 3;
        homeStats.lost++;
      } else {
        homeStats.drawn++;
        awayStats.drawn++;
        homeStats.points += 1;
        awayStats.points += 1;
      }

      homeStats.goalDifference = homeStats.goalsFor - homeStats.goalsAgainst;
      awayStats.goalDifference = awayStats.goalsFor - awayStats.goalsAgainst;
    }
  }

  // Convertir a array y ordenar
  const result: GroupStandings[] = [];
  
  for (const [groupName, teamsMap] of groupsMap.entries()) {
    const teams = Array.from(teamsMap.values()).sort((a, b) => {
      // 1. Puntos
      if (b.points !== a.points) return b.points - a.points;
      // 2. Diferencia de goles
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      // 3. Goles a favor
      return b.goalsFor - a.goalsFor;
    });

    result.push({ groupName, teams });
  }

  // Ordenar grupos alfabéticamente
  result.sort((a, b) => a.groupName.localeCompare(b.groupName));

  return result;
}
