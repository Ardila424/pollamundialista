import type { Match } from '../types';

interface Props {
  matches: Match[];
}

export default function KnockoutBracket({ matches }: Props) {
  // Filtrar y agrupar por fase
  const getPhaseMatches = (phaseName: string) => {
    return matches.filter(m => m.phase === phaseName).sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());
  };

  const rounds = [
    { name: 'Treintaidosavos', matches: getPhaseMatches('Treintaidosavos') },
    { name: 'Octavos', matches: getPhaseMatches('Octavos') },
    { name: 'Cuartos', matches: getPhaseMatches('Cuartos') },
    { name: 'Semifinal', matches: getPhaseMatches('Semifinal') },
    { name: 'Final', matches: getPhaseMatches('Final') },
  ];

  // Componente de Partido en la llave
  const BracketMatch = ({ match }: { match?: Match }) => {
    if (!match) return <div className="w-48 h-16 opacity-0" />;
    
    const isFinished = match.status === 'Finalizado';
    
    return (
      <div className="w-48 glass-strong rounded-lg overflow-hidden border border-[var(--color-border)] text-xs">
        {/* Local */}
        <div className="flex justify-between items-center px-3 py-1.5 border-b border-[var(--color-border)] bg-black/20">
          <span className="truncate pr-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {match.home_team || '-'}
          </span>
          <span className="font-bold w-4 text-center" style={{ color: isFinished ? 'var(--color-gold)' : 'var(--color-text-muted)' }}>
            {match.home_goals ?? '-'}
          </span>
        </div>
        {/* Visitante */}
        <div className="flex justify-between items-center px-3 py-1.5 bg-black/10">
          <span className="truncate pr-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {match.away_team || '-'}
          </span>
          <span className="font-bold w-4 text-center" style={{ color: isFinished ? 'var(--color-gold)' : 'var(--color-text-muted)' }}>
            {match.away_goals ?? '-'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="overflow-x-auto pb-8 scrollbar-hide">
      <div className="min-w-max flex items-stretch gap-8 px-4 py-8">
        {rounds.map((round, rIndex) => (
          <div key={round.name} className="flex flex-col justify-around gap-4" style={{ minWidth: '12rem' }}>
            {/* Round Header */}
            <div className="text-center mb-4">
              <h4 className="font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--color-gold)' }}>
                {round.name}
              </h4>
            </div>
            
            {/* Matches Container */}
            <div className="flex-1 flex flex-col justify-around gap-6">
              {round.matches.map((match, mIndex) => (
                <div key={match.id || mIndex} className="relative flex items-center">
                  <BracketMatch match={match} />
                  
                  {/* Connector lines to next round (only if not the last round) */}
                  {rIndex < rounds.length - 1 && (
                    <div className="absolute left-full top-1/2 w-4 border-t-2 border-[var(--color-border)]" />
                  )}
                  {/* Vertical connector line (drawn on every even match) */}
                  {rIndex < rounds.length - 1 && mIndex % 2 === 0 && (
                    <div 
                      className="absolute border-r-2 border-[var(--color-border)]" 
                      style={{ 
                        left: 'calc(100% + 1rem - 1px)', 
                        top: '50%', 
                        height: `calc(100% + 1.5rem)` 
                      }} 
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
