import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

interface LogEntry {
  id: number;
  username: string;
  action: 'NUEVA' | 'ACTUALIZADA' | 'ELIMINADA';
  match: string;
  home_team: string;
  away_team: string;
  old_prediction: string | null;
  new_prediction: string | null;
  old_prediction_raw: string | null;
  new_prediction_raw: string | null;
  created_at: string;
}

export default function ActivityFeed() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterUser, setFilterUser] = useState('');
  const [appliedFilter, setAppliedFilter] = useState('');

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getLogs({
        limit: 200,
        username: appliedFilter || undefined,
      });
      setLogs(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar logs');
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleFilter = () => {
    setAppliedFilter(filterUser.trim().toLowerCase());
  };

  const handleClearFilter = () => {
    setFilterUser('');
    setAppliedFilter('');
  };

  const timeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMin < 1) return 'Justo ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHrs < 24) return `Hace ${diffHrs}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const getActionConfig = (action: string) => {
    switch (action) {
      case 'NUEVA':
        return {
          icon: '🆕',
          label: 'Nueva apuesta',
          color: 'var(--color-green)',
          bg: 'var(--color-green-dim)',
        };
      case 'ACTUALIZADA':
        return {
          icon: '✏️',
          label: 'Cambió apuesta',
          color: 'var(--color-gold)',
          bg: 'var(--color-gold-dim)',
        };
      case 'ELIMINADA':
        return {
          icon: '🗑️',
          label: 'Eliminó apuesta',
          color: 'var(--color-red)',
          bg: 'var(--color-red-dim)',
        };
      default:
        return {
          icon: '📝',
          label: action,
          color: 'var(--color-text-muted)',
          bg: 'var(--color-bg-secondary)',
        };
    }
  };

  const formatLogPrediction = (pred: string | null) => {
    if (!pred) return '';
    if (pred.startsWith('Local')) {
      return pred.includes('_')
        ? `Local (${pred.split('_')[1] === '120' ? '120 min' : 'Penales'})`
        : 'Local';
    }
    if (pred.startsWith('Visitante')) {
      return pred.includes('_')
        ? `Visitante (${pred.split('_')[1] === '120' ? '120 min' : 'Penales'})`
        : 'Visitante';
    }
    return pred;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="glass-card rounded-2xl animate-shimmer" style={{ height: '80px' }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🔒</div>
        <p className="text-sm font-medium" style={{ color: 'var(--color-red)' }}>
          {error}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Search / Filter */}
      <div className="flex gap-2 mb-5">
        <input
          type="text"
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
          placeholder="Filtrar por usuario..."
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium"
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
            outline: 'none',
          }}
        />
        <button
          onClick={handleFilter}
          className="px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: 'var(--color-gold-dim)', color: 'var(--color-gold)' }}
        >
          🔍
        </button>
        {appliedFilter && (
          <button
            onClick={handleClearFilter}
            className="px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'var(--color-red-dim)', color: 'var(--color-red)' }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
          {logs.length} {logs.length === 1 ? 'movimiento' : 'movimientos'}
          {appliedFilter && ` de "${appliedFilter}"`}
        </span>
        <button
          onClick={loadLogs}
          className="text-xs font-bold px-3 py-1.5 rounded-lg"
          style={{ background: 'var(--color-cyan-dim)', color: 'var(--color-cyan)' }}
        >
          🔄 Recargar
        </button>
      </div>

      {/* Log entries */}
      {logs.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
            No hay movimientos registrados aún
          </p>
        </div>
      ) : (
        <div className="space-y-2 stagger">
          {logs.map((log) => {
            const config = getActionConfig(log.action);

            return (
              <div
                key={log.id}
                className="glass-card rounded-xl p-4"
                style={{ borderLeft: `3px solid ${config.color}` }}
              >
                {/* Top row: user + time */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold uppercase"
                      style={{ background: 'var(--color-gold-dim)', color: 'var(--color-gold)' }}
                    >
                      {log.username.charAt(0)}
                    </div>
                    <span className="font-bold text-sm">{log.username}</span>
                    <span
                      className="px-2 py-0.5 rounded-full text-[0.5625rem] font-bold"
                      style={{ background: config.bg, color: config.color }}
                    >
                      {config.icon} {config.label}
                    </span>
                  </div>
                  <span className="text-[0.625rem] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    {timeAgo(log.created_at)}
                  </span>
                </div>

                {/* Match */}
                <div className="text-sm mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  ⚽ <span className="font-semibold">{log.match}</span>
                </div>

                {/* Prediction detail */}
                <div className="text-[0.8125rem]">
                  {log.action === 'NUEVA' && log.new_prediction && (
                    <span>
                      Apostó → <span className="font-bold" style={{ color: 'var(--color-green)' }}>{formatLogPrediction(log.new_prediction)}</span>
                    </span>
                  )}
                  {log.action === 'ACTUALIZADA' && (
                    <span>
                      <span style={{ color: 'var(--color-red)', textDecoration: 'line-through' }}>{formatLogPrediction(log.old_prediction)}</span>
                      {' → '}
                      <span className="font-bold" style={{ color: 'var(--color-green)' }}>{formatLogPrediction(log.new_prediction)}</span>
                    </span>
                  )}
                  {log.action === 'ELIMINADA' && log.old_prediction && (
                    <span>
                      Quitó → <span style={{ color: 'var(--color-red)', textDecoration: 'line-through' }}>{formatLogPrediction(log.old_prediction)}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
