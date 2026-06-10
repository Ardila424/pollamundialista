import type { LeaderboardEntry } from '../types';
import { useAuth } from '../context/AuthContext';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  isLoading: boolean;
}

export default function LeaderboardTable({ entries, isLoading }: LeaderboardTableProps) {
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-card rounded-2xl animate-shimmer" style={{ height: '72px' }} />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🏆</div>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
          Aún no hay jugadores en el ranking
        </p>
      </div>
    );
  }

  const getMedal = (index: number) => {
    if (index === 0) return { icon: '🥇', bg: 'linear-gradient(135deg, rgba(255, 215, 0, 0.12) 0%, rgba(255, 165, 0, 0.06) 100%)' };
    if (index === 1) return { icon: '🥈', bg: 'linear-gradient(135deg, rgba(192, 192, 192, 0.1) 0%, rgba(169, 169, 169, 0.05) 100%)' };
    if (index === 2) return { icon: '🥉', bg: 'linear-gradient(135deg, rgba(205, 127, 50, 0.1) 0%, rgba(205, 127, 50, 0.05) 100%)' };
    return { icon: `${index + 1}`, bg: 'var(--color-bg-secondary)' };
  };

  return (
    <div className="space-y-2.5 stagger">
      {entries.map((entry, index) => {
        const isCurrentUser = user?.id === entry.id;
        const medal = getMedal(index);

        return (
          <div
            key={entry.id}
            id={`leaderboard-row-${entry.id}`}
            className={`glass-card rounded-2xl p-4 flex items-center gap-4 ${isCurrentUser ? 'glow-gold' : ''}`}
            style={{
              borderColor: isCurrentUser ? 'var(--color-border-gold)' : undefined,
            }}
          >
            {/* Rank */}
            <div
              className="flex items-center justify-center w-11 h-11 rounded-xl font-bold shrink-0"
              style={{
                background: medal.bg,
                fontSize: index < 3 ? '1.375rem' : '0.875rem',
                color: index >= 3 ? 'var(--color-text-muted)' : undefined,
              }}
            >
              {medal.icon}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm truncate">{entry.username}</span>
                {entry.title && (
                  <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-medium" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    {entry.title}
                  </span>
                )}
                {entry.has_paid ? (
                  <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-bold" style={{ background: 'var(--color-green-dim)', color: 'var(--color-green)' }}>
                    💰 Pagó
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-bold" style={{ background: 'var(--color-red-dim)', color: 'var(--color-red)' }}>
                    ⏳ Pendiente
                  </span>
                )}
                {isCurrentUser && (
                  <span className="pill" style={{ background: 'var(--color-gold-dim)', color: 'var(--color-gold)', fontSize: '0.5625rem' }}>
                    TÚ
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[0.6875rem]" style={{ color: 'var(--color-text-muted)' }}>
                  ✅ {entry.correct_predictions} aciertos
                </span>
                <span className="text-[0.6875rem]" style={{ color: 'var(--color-text-muted)' }}>
                  📋 {entry.total_predictions} apostados
                </span>
              </div>
            </div>

            {/* Points */}
            <div className="text-right shrink-0">
              <div
                className="text-xl font-extrabold leading-none"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: entry.total_points > 0 ? 'var(--color-gold)' : 'var(--color-text-muted)',
                }}
              >
                {entry.total_points}
              </div>
              <div className="text-[0.5625rem] uppercase tracking-wider mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                pts
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
