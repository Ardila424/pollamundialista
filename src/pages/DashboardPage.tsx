import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import MatchCard from '../components/MatchCard';
import LeaderboardTable from '../components/LeaderboardTable';
import GroupStandings from '../components/GroupStandings';
import KnockoutBracket from '../components/KnockoutBracket';
import ActivityFeed from '../components/ActivityFeed';
import type { Match, LeaderboardEntry, PredictionWithMatch, TabType } from '../types';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('partidos');

  // Matches
  const [matches, setMatches] = useState<Match[]>([]);
  const [phases, setPhases] = useState<string[]>([]);
  const [selectedPhase, setSelectedPhase] = useState('');
  const [matchesLoading, setMatchesLoading] = useState(true);

  // Predictions
  const [predictions, setPredictions] = useState<PredictionWithMatch[]>([]);
  const [predStats, setPredStats] = useState({ total: 0, finished: 0, correct: 0, points: 0, accuracy: 0 });
  const [predsLoading, setPredsLoading] = useState(false);

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(false);

  const loadMatches = useCallback(async () => {
    setMatchesLoading(true);
    try {
      const data = await api.getMatches(selectedPhase ? { phase: selectedPhase } : undefined);
      setMatches(data);
    } catch (err) {
      console.error('Error cargando partidos:', err);
    } finally {
      setMatchesLoading(false);
    }
  }, [selectedPhase]);

  const loadPhases = useCallback(async () => {
    try { setPhases(await api.getPhases()); } catch { }
  }, []);

  const loadPredictions = useCallback(async () => {
    setPredsLoading(true);
    try {
      const data = await api.getMyPredictions();
      setPredictions(data.predictions);
      setPredStats(data.stats);
    } catch { } finally { setPredsLoading(false); }
  }, []);

  const loadLeaderboard = useCallback(async () => {
    setLbLoading(true);
    try { setLeaderboard(await api.getLeaderboard()); } catch { } finally { setLbLoading(false); }
  }, []);

  useEffect(() => { loadPhases(); loadMatches(); loadLeaderboard(); }, [loadPhases, loadMatches, loadLeaderboard]);
  useEffect(() => {
    if (activeTab === 'pronosticos') loadPredictions();
    if (activeTab === 'ranking') loadLeaderboard();
  }, [activeTab, loadPredictions, loadLeaderboard]);

  // Group matches by date
  const groupedMatches = matches.reduce<Record<string, Match[]>>((groups, match) => {
    const dateObj = new Date(match.match_date);
    const dateStr = dateObj.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }); // YYYY-MM-DD
    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(match);
    return groups;
  }, {});

  const pendingPredictions = predictions.filter((p) => p.matches?.status !== 'Finalizado');
  const finishedPredictions = predictions.filter((p) => p.matches?.status === 'Finalizado');

  // Admin check
  const isAdmin = user?.username?.toLowerCase() === 'tupi';

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'partidos', label: 'Partidos', icon: '⚽' },
    { id: 'pronosticos', label: 'Pronósticos', icon: '📋' },
    { id: 'grupos', label: 'Grupos', icon: '📊' },
    { id: 'eliminatorias', label: 'Llaves', icon: '🌳' },
    { id: 'ranking', label: 'Ranking', icon: '🏆' },
    ...(isAdmin ? [{ id: 'actividad' as TabType, label: 'Actividad', icon: '📜' }] : []),
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: 'var(--color-bg-primary)' }}>
      {/* ═══════ HEADER ═══════ */}
      <header className="glass-strong sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--color-gold-dim)' }}
            >
              <span className="text-lg">🏆</span>
            </div>
            <h1
              className="text-base font-bold hidden sm:block"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)' }}
            >
              Polla Mundialista
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold uppercase"
                style={{ background: 'var(--color-gold-dim)', color: 'var(--color-gold)' }}
              >
                {user?.username.charAt(0)}
              </div>
              <span className="text-sm font-medium hidden sm:inline" style={{ color: 'var(--color-text-secondary)' }}>
                {user?.username}
              </span>
            </div>
            <button id="logout-button" onClick={logout} className="btn btn-ghost text-xs py-1.5 px-3 rounded-lg">
              Salir
            </button>
          </div>
        </div>

        {/* Desktop tabs */}
        <div className="hidden sm:flex justify-center gap-1.5 px-4 pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`tab-desktop-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-desktop ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* ═══════ MOBILE BOTTOM NAV ═══════ */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 glass-strong flex safe-area-bottom"
        style={{ borderTop: '1px solid var(--color-border)', paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-mobile-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* ═══════ CONTENT ═══════ */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 pt-4 pb-28 sm:pb-6">

        {/* ══ TAB: PARTIDOS ══ */}
        {activeTab === 'partidos' && (
          <div className="animate-fade-in">
            {/* Prize pool banner */}
            {leaderboard.length > 0 && (
              <div
                className="glass-strong rounded-2xl p-5 mb-5 text-center"
                style={{
                  border: '1px solid var(--color-border-gold)',
                  background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.06) 0%, rgba(255, 165, 0, 0.03) 100%)',
                }}
              >
                <div className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  💰 La K acumulada
                </div>
                <div
                  className="text-3xl font-extrabold tracking-tight"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)' }}
                >
                  ${(leaderboard.length * 30000).toLocaleString('es-CO')} COP
                </div>
                <div className="text-xs mt-1.5 mb-3" style={{ color: 'var(--color-text-muted)' }}>
                  {leaderboard.length} {leaderboard.length === 1 ? 'jugador inscrito' : 'jugadores inscritos'} × $30.000
                </div>

                {/* Prize distribution */}
                <div className="flex justify-center gap-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <div className="flex-1 max-w-[110px]">
                    <div className="text-lg mb-0.5">🥇</div>
                    <div className="text-sm font-extrabold" style={{ color: 'var(--color-gold)' }}>
                      ${Math.round(leaderboard.length * 30000 * 0.7).toLocaleString('es-CO')}
                    </div>
                    <div className="text-[0.5625rem] font-medium" style={{ color: 'var(--color-text-muted)' }}>70%</div>
                  </div>
                  <div className="flex-1 max-w-[110px]">
                    <div className="text-lg mb-0.5">🥈</div>
                    <div className="text-sm font-extrabold" style={{ color: 'var(--color-text-secondary)' }}>
                      ${Math.round(leaderboard.length * 30000 * 0.2).toLocaleString('es-CO')}
                    </div>
                    <div className="text-[0.5625rem] font-medium" style={{ color: 'var(--color-text-muted)' }}>20%</div>
                  </div>
                  <div className="flex-1 max-w-[110px]">
                    <div className="text-lg mb-0.5">🥉</div>
                    <div className="text-sm font-extrabold" style={{ color: 'var(--color-text-secondary)' }}>
                      ${Math.round(leaderboard.length * 30000 * 0.1).toLocaleString('es-CO')}
                    </div>
                    <div className="text-[0.5625rem] font-medium" style={{ color: 'var(--color-text-muted)' }}>10%</div>
                  </div>
                </div>
              </div>
            )}

            {/* Phase filter chips */}
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
              <button
                id="filter-all"
                onClick={() => setSelectedPhase('')}
                className={`phase-chip ${selectedPhase === '' ? 'active' : ''}`}
              >
                Todos
              </button>
              {phases.map((phase) => (
                <button
                  key={phase}
                  id={`filter-${phase}`}
                  onClick={() => setSelectedPhase(phase)}
                  className={`phase-chip ${selectedPhase === phase ? 'active' : ''}`}
                >
                  {phase}
                </button>
              ))}
            </div>

            {/* Matches */}
            {matchesLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="glass-card rounded-2xl animate-shimmer" style={{ height: '160px' }} />
                ))}
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📅</div>
                <p className="font-medium" style={{ color: 'var(--color-text-muted)' }}>No hay partidos para este filtro</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedMatches).map(([dateStr, dateMatches]) => {
                  const [year, month, day] = dateStr.split('-');
                  const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                  const formattedDate = dateObj.toLocaleDateString('es-CO', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  });
                  return (
                    <div key={dateStr} className="glass-strong rounded-2xl p-5 border border-[var(--color-border)]">
                      <div className="flex items-center gap-3 mb-5">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-lg"
                          style={{ background: 'var(--color-cyan-dim)', border: '1px solid var(--color-cyan)' }}
                        >
                          📅
                        </div>
                        <h3
                          className="text-lg font-bold capitalize tracking-wide"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {formattedDate}
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger">
                        {dateMatches.map((match) => (
                          <MatchCard key={match.id} match={match} onPredictionSaved={loadMatches} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: MIS PRONÓSTICOS ══ */}
        {activeTab === 'pronosticos' && (
          <div className="animate-fade-in">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Apostados', value: predStats.total, icon: '📋', color: 'var(--color-cyan)' },
                { label: 'Aciertos', value: predStats.correct, icon: '✅', color: 'var(--color-green)' },
                { label: 'Puntos', value: predStats.points, icon: '⭐', color: 'var(--color-gold)' },
                { label: 'Precisión', value: `${predStats.accuracy}%`, icon: '🎯', color: 'var(--color-gold-light)' },
              ].map((stat) => (
                <div key={stat.label} className="stat-card">
                  <div className="text-2xl mb-2">{stat.icon}</div>
                  <div className="text-2xl font-extrabold leading-none" style={{ fontFamily: 'var(--font-display)', color: stat.color }}>
                    {stat.value}
                  </div>
                  <div className="text-[0.625rem] uppercase tracking-wider mt-1.5 font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {predsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="glass-card rounded-2xl animate-shimmer" style={{ height: '72px' }} />
                ))}
              </div>
            ) : predictions.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📝</div>
                <p className="font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  Aún no has hecho pronósticos
                </p>
                <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
                  Ve a <button onClick={() => setActiveTab('partidos')} className="underline" style={{ color: 'var(--color-gold)' }}>Partidos</button> para empezar
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingPredictions.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm">⏳</span>
                      <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-cyan)' }}>
                        Pendientes ({pendingPredictions.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 stagger">
                      {pendingPredictions.map((pred) => (
                        <PredictionRow key={pred.id} prediction={pred} />
                      ))}
                    </div>
                  </div>
                )}

                {finishedPredictions.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl">✅</span>
                      <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                        Finalizados ({finishedPredictions.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 stagger">
                      {finishedPredictions.map((pred) => (
                        <PredictionRow key={pred.id} prediction={pred} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: RANKING ══ */}
        {activeTab === 'ranking' && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3" style={{ background: 'var(--color-gold-dim)' }}>
                <span className="text-2xl">🏆</span>
              </div>
              <h2
                className="text-xl font-extrabold"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)' }}
              >
                Tabla de Posiciones
              </h2>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {leaderboard.length} {leaderboard.length === 1 ? 'jugador' : 'jugadores'} participando
              </p>
            </div>
            <LeaderboardTable entries={leaderboard} isLoading={lbLoading} />
          </div>
        )}

        {/* ══ TAB: GRUPOS ══ */}
        {activeTab === 'grupos' && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3" style={{ background: 'var(--color-cyan-dim)' }}>
                <span className="text-2xl">📊</span>
              </div>
              <h2
                className="text-xl font-extrabold"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-cyan)' }}
              >
                Fase de Grupos
              </h2>
            </div>
            <GroupStandings />
          </div>
        )}

        {/* ══ TAB: ELIMINATORIAS ══ */}
        {activeTab === 'eliminatorias' && (
          <div className="animate-fade-in">
            <div className="text-center mb-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3" style={{ background: 'var(--color-gold-dim)' }}>
                <span className="text-2xl">🌳</span>
              </div>
              <h2
                className="text-xl font-extrabold"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)' }}
              >
                Fase Final
              </h2>
            </div>
            <KnockoutBracket matches={matches} />
          </div>
        )}

        {/* ══ TAB: ACTIVIDAD (Admin Only) ══ */}
        {activeTab === 'actividad' && isAdmin && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3" style={{ background: 'var(--color-cyan-dim)' }}>
                <span className="text-2xl">📜</span>
              </div>
              <h2
                className="text-xl font-extrabold"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-cyan)' }}
              >
                Registro de Actividad
              </h2>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Historial completo de todas las apuestas
              </p>
            </div>
            <ActivityFeed />
          </div>
        )}
      </main>
    </div>
  );
}

/* ═══ Sub-component: PredictionRow ═══ */
function PredictionRow({ prediction }: { prediction: PredictionWithMatch }) {
  const match = prediction.matches;
  if (!match) return null;

  const isFinished = match.status === 'Finalizado';
  const isCorrect = prediction.points === 3;

  const choiceLabel =
    prediction.prediction === 'Local' ? match.home_team :
      prediction.prediction === 'Visitante' ? match.away_team :
        'Empate';

  const choiceIcon =
    prediction.prediction === 'Local' ? '🏠' :
      prediction.prediction === 'Visitante' ? '✈️' : '🤝';

  const matchDate = new Date(match.match_date);
  const day = matchDate.getDate();
  const month = matchDate.toLocaleDateString('es-CO', { month: 'short' });

  return (
    <div className="glass-card rounded-xl p-3.5 flex items-center gap-3">
      {/* Date */}
      <div className="shrink-0 text-center" style={{ minWidth: '36px' }}>
        <div className="text-[0.5625rem] uppercase font-medium" style={{ color: 'var(--color-text-muted)' }}>{month}</div>
        <div className="text-base font-bold leading-none mt-0.5">{day}</div>
      </div>

      {/* Divider */}
      <div className="w-px h-8 shrink-0" style={{ background: 'var(--color-border)' }} />

      {/* Match info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {match.home_team} vs {match.away_team}
        </div>
        <div className="text-[0.6875rem] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          {choiceIcon} <span style={{ color: 'var(--color-gold)' }}>{choiceLabel}</span>
        </div>
      </div>

      {/* Result */}
      {isFinished ? (
        <div className="shrink-0 text-right">
          <div className="text-xs font-mono font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {match.home_goals}-{match.away_goals}
          </div>
          <div
            className="text-xs font-bold mt-0.5"
            style={{ color: isCorrect ? 'var(--color-green)' : 'var(--color-red)' }}
          >
            {isCorrect ? '+3 pts' : '0 pts'}
          </div>
        </div>
      ) : (
        <span className="pill shrink-0" style={{ background: 'var(--color-cyan-dim)', color: 'var(--color-cyan)', fontSize: '0.5625rem' }}>
          PENDIENTE
        </span>
      )}
    </div>
  );
}
