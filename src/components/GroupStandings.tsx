import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function GroupStandings() {
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getGroupStandings();
        setStandings(data);
      } catch (err: any) {
        setError(err.message || 'Error al cargar grupos');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-card rounded-2xl h-64" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
      {standings.map((group) => (
        <div key={group.groupName} className="glass-strong rounded-2xl overflow-hidden border border-[var(--color-border)]">
          <div className="px-4 py-3 border-b border-[var(--color-border)]" style={{ background: 'rgba(0,0,0,0.2)' }}>
            <h3 className="font-bold text-lg" style={{ color: 'var(--color-gold)' }}>Grupo {group.groupName}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase" style={{ color: 'var(--color-text-muted)', background: 'rgba(0,0,0,0.1)' }}>
                <tr>
                  <th className="px-4 py-2 font-medium">Equipo</th>
                  <th className="px-2 py-2 text-center font-medium" title="Partidos Jugados">PJ</th>
                  <th className="px-2 py-2 text-center font-medium hidden sm:table-cell" title="Ganados">G</th>
                  <th className="px-2 py-2 text-center font-medium hidden sm:table-cell" title="Empatados">E</th>
                  <th className="px-2 py-2 text-center font-medium hidden sm:table-cell" title="Perdidos">P</th>
                  <th className="px-2 py-2 text-center font-medium" title="Diferencia de Gol">DG</th>
                  <th className="px-4 py-2 text-center font-bold" title="Puntos">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {group.teams.map((team: any, index: number) => (
                  <tr key={team.teamName} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      <span className="text-[10px] w-4 text-center" style={{ color: index < 2 ? 'var(--color-green)' : 'var(--color-text-muted)' }}>
                        {index + 1}
                      </span>
                      <span className="truncate max-w-[100px] sm:max-w-[120px] block" title={team.teamName}>{team.teamName}</span>
                    </td>
                    <td className="px-2 py-3 text-center">{team.played}</td>
                    <td className="px-2 py-3 text-center hidden sm:table-cell" style={{ color: 'var(--color-text-muted)' }}>{team.won}</td>
                    <td className="px-2 py-3 text-center hidden sm:table-cell" style={{ color: 'var(--color-text-muted)' }}>{team.drawn}</td>
                    <td className="px-2 py-3 text-center hidden sm:table-cell" style={{ color: 'var(--color-text-muted)' }}>{team.lost}</td>
                    <td className="px-2 py-3 text-center">{team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}</td>
                    <td className="px-4 py-3 text-center font-bold" style={{ color: 'var(--color-gold-light)' }}>{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
