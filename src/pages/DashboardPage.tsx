import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import MatchCard from '../components/MatchCard';
import LeaderboardTable from '../components/LeaderboardTable';
import GroupStandings from '../components/GroupStandings';
import KnockoutBracket from '../components/KnockoutBracket';
import ActivityFeed from '../components/ActivityFeed';
import type { Match, LeaderboardEntry, PredictionWithMatch, TabType } from '../types';

const FLAG_MAP: Record<string, string> = {
  'México': '🇲🇽', 'Canadá': '🇨🇦', 'Estados Unidos': '🇺🇸', 'Bolivia': '🇧🇴',
  'Argentina': '🇦🇷', 'Perú': '🇵🇪', 'Colombia': '🇨🇴', 'Senegal': '🇸🇳',
  'Francia': '🇫🇷', 'Australia': '🇦🇺', 'Brasil': '🇧🇷', 'Nigeria': '🇳🇬',
  'Alemania': '🇩🇪', 'Japón': '🇯🇵', 'España': '🇪🇸', 'Corea del Sur': '🇰🇷',
  'Inglaterra': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Arabia Saudita': '🇸🇦', 'Portugal': '🇵🇹', 'Ghana': '🇬🇭',
  'Países Bajos': '🇳🇱', 'Ecuador': '🇪🇨', 'Italia': '🇮🇹', 'Costa Rica': '🇨🇷',
  'Bélgica': '🇧🇪', 'Marruecos': '🇲🇦', 'Uruguay': '🇺🇾', 'Camerún': '🇨🇲',
  'Croacia': '🇭🇷', 'Panamá': '🇵🇦', 'Dinamarca': '🇩🇰', 'Túnez': '🇹🇳',
  'Serbia': '🇷🇸', 'Paraguay': '🇵🇾', 'Suiza': '🇨🇭', 'Irán': '🇮🇷',
  'Polonia': '🇵🇱', 'Chile': '🇨🇱', 'Gales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'Costa de Marfil': '🇨🇮',
  'Egipto': '🇪🇬', 'Honduras': '🇭🇳', 'Suecia': '🇸🇪', 'Rep. Checa': '🇨🇿',
  'Ucrania': '🇺🇦', 'Jamaica': '🇯🇲', 'Qatar': '🇶🇦', 'Nueva Zelanda': '🇳🇿',
  'Sudáfrica': '🇿🇦', 'Bosnia': '🇧🇦', 'Haití': '🇭🇹', 'Escocia': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Turquía': '🇹🇷', 'Jordania': '🇯🇴', 'Austria': '🇦🇹', 'Uzbekistán': '🇺🇿',
  'Curazao': '🇨🇼', 'Cabo Verde': '🇨🇻', 'Argelia': '🇩🇿', 'RD Congo': '🇨🇩',
  'Irak': '🇮🇶', 'Noruega': '🇳🇴', 'Democratic Republic of the Congo': '🇨🇩'
};

const getFlag = (team: string) => FLAG_MAP[team] || '🏳️';

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

  // Admin Panel states
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminSubTab, setAdminSubTab] = useState<'payments' | 'pin' | 'activity' | 'scores'>('payments');
  const [adminScoreFilter, setAdminScoreFilter] = useState<'pending' | 'finished' | 'all'>('pending');
  const [updatingMatchId, setUpdatingMatchId] = useState<number | null>(null);
  const [resetUsername, setResetUsername] = useState('');
  const [resetPin, setResetPin] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const loadAdminUsers = useCallback(async () => {
    setAdminUsersLoading(true);
    try {
      const res = await api.getAdminUsers();
      setAdminUsers(res);
    } catch (err) {
      console.error("Error loading admin users", err);
    } finally {
      setAdminUsersLoading(false);
    }
  }, []);

  const handleTogglePayment = async (userId: number, currentPaid: boolean) => {
    try {
      await api.setPaymentStatus(userId, !currentPaid);
      setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, has_paid: !currentPaid } : u));
      loadLeaderboard();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar pago');
    }
  };

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUsername || !resetPin) return;
    if (!/^\d{4}$/.test(resetPin)) {
      setResetError('El PIN debe tener exactamente 4 dígitos');
      setResetMessage('');
      return;
    }
    setIsResetting(true);
    setResetError('');
    setResetMessage('');
    try {
      const res = await api.resetUserPin(resetUsername, resetPin);
      setResetMessage(res.message || 'PIN reseteado con éxito');
      setResetPin('');
      setResetUsername('');
    } catch (err: any) {
      setResetError(err.message || 'Error al resetear PIN');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSubmitScore = async (e: React.FormEvent<HTMLFormElement>, matchId: number) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const homeGoalsVal = formData.get('home_goals') as string;
    const awayGoalsVal = formData.get('away_goals') as string;
    const statusVal = formData.get('status') as string;

    const home_goals = homeGoalsVal === '' ? 0 : parseInt(homeGoalsVal, 10);
    const away_goals = awayGoalsVal === '' ? 0 : parseInt(awayGoalsVal, 10);

    if (isNaN(home_goals) || isNaN(away_goals)) {
      alert('Los goles deben ser números válidos.');
      return;
    }

    setUpdatingMatchId(matchId);
    try {
      await api.updateMatchResult(matchId, home_goals, away_goals, statusVal);
      alert('Resultado del partido actualizado con éxito.');
      await loadMatches();
      await loadPredictions();
      await loadLeaderboard();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar el partido');
    } finally {
      setUpdatingMatchId(null);
    }
  };

  useEffect(() => { loadPhases(); loadMatches(); loadLeaderboard(); }, [loadPhases, loadMatches, loadLeaderboard]);
  useEffect(() => {
    if (activeTab === 'pronosticos') loadPredictions();
    if (activeTab === 'ranking') loadLeaderboard();
    if (activeTab === 'admin') loadAdminUsers();
  }, [activeTab, loadPredictions, loadLeaderboard, loadAdminUsers]);

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
    ...(isAdmin ? [{ id: 'admin' as TabType, label: 'Admin', icon: '👑' }] : []),
  ];

  const now = new Date();
  const pendingSoonCount = matches.filter(m => {
    const matchDate = new Date(m.match_date);
    const isOpen = m.is_open && m.status === 'Pendiente';
    const hasNoPrediction = !m.user_prediction;
    const isSoon = matchDate.getTime() - now.getTime() < 36 * 60 * 60 * 1000;
    return isOpen && hasNoPrediction && isSoon;
  }).length;

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

          <div className="flex items-center gap-3.5">
            <button
              onClick={() => setShowRules(true)}
              className="h-7 px-3 rounded-full flex items-center justify-center gap-1.5 text-[11px] font-extrabold transition-all hover:scale-105 shrink-0"
              style={{
                background: 'var(--color-gold-dim)',
                border: '1px solid rgba(255, 215, 0, 0.25)',
                color: 'var(--color-gold)',
                cursor: 'pointer',
              }}
              title="Reglas de la Polla"
            >
              <span
                className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[9px] font-black italic"
                style={{ transform: 'skewX(-6deg)', paddingRight: '0.5px' }}
              >
                i
              </span>
              <span>Reglas</span>
            </button>

            <div className="flex items-center gap-1.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold uppercase shrink-0"
                style={{ background: 'var(--color-gold-dim)', color: 'var(--color-gold)' }}
              >
                {user?.username.charAt(0)}
              </div>
              <span className="text-sm font-medium hidden sm:inline" style={{ color: 'var(--color-text-secondary)' }}>
                {user?.username}
              </span>
            </div>

            <div className="w-px h-4 shrink-0" style={{ background: 'var(--color-border)' }} />

            <button id="logout-button" onClick={logout} className="btn btn-ghost text-xs py-1.5 px-3 rounded-lg shrink-0">
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
        {/* Global Pending Predictions Alert */}
        {pendingSoonCount > 0 && (
          <div
            className="glass-card rounded-2xl p-4 mb-5 flex items-center justify-between animate-pulse-soft"
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(255, 165, 0, 0.04) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🚨</span>
              <div>
                <span className="text-xs font-bold text-[var(--color-text-primary)] block">Apuestas Pendientes</span>
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  Ojo manito, tiene {pendingSoonCount} {pendingSoonCount === 1 ? 'partido' : 'partidos'} por apostar en las próximas 36 horas. Si no los hace ya, paila si sabe
                </span>
              </div>
            </div>
            {activeTab !== 'partidos' && (
              <button
                onClick={() => setActiveTab('partidos')}
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:scale-105 shrink-0"
                style={{
                  background: 'var(--color-red-dim)',
                  color: 'var(--color-red)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  cursor: 'pointer'
                }}
              >
                Apostar ya
              </button>
            )}
          </div>
        )}

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

        {/* ══ TAB: ADMIN (Admin Only) ══ */}
        {activeTab === 'admin' && isAdmin && (
          <div className="animate-fade-in">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 animate-pulse-soft" style={{ background: 'var(--color-gold-dim)' }}>
                <span className="text-2xl">👑</span>
              </div>
              <h2
                className="text-xl font-extrabold"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)' }}
              >
                Panel de Administración
              </h2>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Control total de la polla mundialista
              </p>
            </div>

            {/* Sub navigation pills */}
            <div className="flex gap-2 justify-center mb-6 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setAdminSubTab('payments')}
                className={`phase-chip ${adminSubTab === 'payments' ? 'active' : ''}`}
                style={{ fontSize: '0.8125rem' }}
              >
                💰 Control de Pagos
              </button>
              <button
                onClick={() => setAdminSubTab('scores')}
                className={`phase-chip ${adminSubTab === 'scores' ? 'active' : ''}`}
                style={{ fontSize: '0.8125rem' }}
              >
                ⚽ Resultados Manuales
              </button>
              <button
                onClick={() => setAdminSubTab('pin')}
                className={`phase-chip ${adminSubTab === 'pin' ? 'active' : ''}`}
                style={{ fontSize: '0.8125rem' }}
              >
                🔑 Reiniciar PIN
              </button>
              <button
                onClick={() => setAdminSubTab('activity')}
                className={`phase-chip ${adminSubTab === 'activity' ? 'active' : ''}`}
                style={{ fontSize: '0.8125rem' }}
              >
                📜 Actividad
              </button>
            </div>

            {/* Sub-tab: Resultados Manuales */}
            {adminSubTab === 'scores' && (
              <div className="glass-strong rounded-2xl p-5 border border-[var(--color-border)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-text-primary)]">⚽ Resultados Manuales</h3>
                    <p className="text-[11px] text-[var(--color-text-muted)]">Actualiza los marcadores y el estado de los partidos manualmente en caso de falla de la API.</p>
                  </div>
                  
                  {/* Filter pills */}
                  <div className="flex gap-1.5 self-start">
                    <button
                      onClick={() => setAdminScoreFilter('pending')}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                        adminScoreFilter === 'pending'
                          ? 'bg-[var(--color-gold-dim)] text-[var(--color-gold)] border-[var(--color-gold-dim)]'
                          : 'bg-transparent text-[var(--color-text-muted)] border-[var(--color-border)]'
                      }`}
                    >
                      Pendientes / En Vivo
                    </button>
                    <button
                      onClick={() => setAdminScoreFilter('finished')}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                        adminScoreFilter === 'finished'
                          ? 'bg-[var(--color-gold-dim)] text-[var(--color-gold)] border-[var(--color-gold-dim)]'
                          : 'bg-transparent text-[var(--color-text-muted)] border-[var(--color-border)]'
                      }`}
                    >
                      Finalizados
                    </button>
                    <button
                      onClick={() => setAdminScoreFilter('all')}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                        adminScoreFilter === 'all'
                          ? 'bg-[var(--color-gold-dim)] text-[var(--color-gold)] border-[var(--color-gold-dim)]'
                          : 'bg-transparent text-[var(--color-text-muted)] border-[var(--color-border)]'
                      }`}
                    >
                      Todos
                    </button>
                  </div>
                </div>

                {matches.length === 0 ? (
                  <div className="text-center py-8 text-sm text-[var(--color-text-muted)]">
                    No hay partidos cargados
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                    {matches
                      .filter(m => {
                        if (adminScoreFilter === 'pending') return m.status !== 'Finalizado';
                        if (adminScoreFilter === 'finished') return m.status === 'Finalizado';
                        return true;
                      })
                      .map((m) => (
                        <form
                          key={m.id}
                          onSubmit={(e) => handleSubmitScore(e, m.id)}
                          className="glass-card rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all"
                          style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--color-border)' }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-[var(--color-text-muted)] uppercase mb-1">
                              <span>ID: {m.id}</span>
                              <span>•</span>
                              <span>{m.phase}</span>
                              {m.group_name && (
                                <>
                                  <span>•</span>
                                  <span>Grupo {m.group_name}</span>
                                </>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-primary)]">
                              <span className="text-base shrink-0">{getFlag(m.home_team)}</span>
                              <span className="truncate max-w-[100px] sm:max-w-none">{m.home_team}</span>
                              <span className="text-[10px] text-[var(--color-text-muted)]">vs</span>
                              <span className="text-base shrink-0">{getFlag(m.away_team)}</span>
                              <span className="truncate max-w-[100px] sm:max-w-none">{m.away_team}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
                            {/* Score Inputs */}
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                name="home_goals"
                                defaultValue={m.home_goals ?? 0}
                                min="0"
                                max="20"
                                className="w-10 h-8 rounded-lg text-center font-bold text-xs"
                                style={{
                                  background: 'var(--color-bg-secondary)',
                                  border: '1px solid var(--color-border)',
                                  color: 'var(--color-text-primary)'
                                }}
                              />
                              <span className="text-xs text-[var(--color-text-muted)]">-</span>
                              <input
                                type="number"
                                name="away_goals"
                                defaultValue={m.away_goals ?? 0}
                                min="0"
                                max="20"
                                className="w-10 h-8 rounded-lg text-center font-bold text-xs"
                                style={{
                                  background: 'var(--color-bg-secondary)',
                                  border: '1px solid var(--color-border)',
                                  color: 'var(--color-text-primary)'
                                }}
                              />
                            </div>

                            {/* Status Selector */}
                            <select
                              name="status"
                              defaultValue={m.status}
                              className="h-8 rounded-lg px-2 text-xs font-semibold select-custom"
                              style={{
                                background: 'var(--color-bg-secondary)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text-primary)'
                              }}
                            >
                              <option value="Pendiente">Pendiente</option>
                              <option value="En_Progreso">En Progreso</option>
                              <option value="Finalizado">Finalizado</option>
                            </select>

                            {/* Submit Button */}
                            <button
                              type="submit"
                              disabled={updatingMatchId === m.id}
                              className="h-8 px-3 rounded-lg text-[10px] font-bold transition-all shrink-0 bg-[var(--color-gold-dim)] text-[var(--color-gold)] border border-[rgba(255,215,0,0.2)] hover:scale-[1.02] cursor-pointer disabled:opacity-50"
                            >
                              {updatingMatchId === m.id ? '⌛ ...' : 'Guardar'}
                            </button>
                          </div>
                        </form>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Sub-tab: Control de Pagos */}
            {adminSubTab === 'payments' && (
              <div className="glass-strong rounded-2xl p-5 border border-[var(--color-border)]">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">💰 Registro de Pagos</h3>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Marca a los jugadores que ya entregaron los $30.000 COP para actualizar la bolsa de premios y el ranking.</p>
                </div>

                {adminUsersLoading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="glass-card rounded-2xl animate-shimmer" style={{ height: '56px' }} />
                    ))}
                  </div>
                ) : adminUsers.length === 0 ? (
                  <div className="text-center py-8 text-sm text-[var(--color-text-muted)]">
                    No hay usuarios registrados
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {adminUsers.map((u) => (
                      <div
                        key={u.id}
                        className="glass-card rounded-xl p-3 flex items-center justify-between transition-all"
                        style={{ background: 'rgba(255, 255, 255, 0.01)' }}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase"
                            style={{ background: 'var(--color-gold-dim)', color: 'var(--color-gold)' }}
                          >
                            {u.username.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-[var(--color-text-primary)]">{u.username}</span>
                            <div className="text-[10px] text-[var(--color-text-muted)]">
                              Registrado: {new Date(u.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleTogglePayment(u.id, u.has_paid)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shrink-0"
                          style={{
                            background: u.has_paid ? 'var(--color-green-dim)' : 'var(--color-red-dim)',
                            color: u.has_paid ? 'var(--color-green)' : 'var(--color-red)',
                            borderColor: u.has_paid ? 'rgba(74, 222, 128, 0.2)' : 'rgba(248, 113, 113, 0.2)',
                          }}
                        >
                          {u.has_paid ? '💰 PAGÓ' : '⏳ PENDIENTE'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sub-tab: Reiniciar PIN */}
            {adminSubTab === 'pin' && (
              <div className="glass-strong rounded-2xl p-5 border border-[var(--color-border)] max-w-md mx-auto">
                <div className="mb-5 text-center">
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">🔑 Reiniciar PIN de Usuario</h3>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Asigna un PIN temporal de 4 dígitos a un jugador si olvidó su contra.</p>
                </div>

                <form onSubmit={handleResetPin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wider">
                      Usuario a resetear
                    </label>
                    <select
                      value={resetUsername}
                      onChange={(e) => setResetUsername(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm font-medium"
                      style={{
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        outline: 'none',
                      }}
                      required
                    >
                      <option value="">-- Selecciona un jugador --</option>
                      {adminUsers.map((u) => (
                        <option key={u.id} value={u.username}>
                          {u.username}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wider">
                      Nuevo PIN (4 dígitos)
                    </label>
                    <input
                      type="text"
                      pattern="\d{4}"
                      maxLength={4}
                      value={resetPin}
                      onChange={(e) => setResetPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Ej. 1234"
                      className="w-full px-4 py-2.5 rounded-xl text-sm font-mono text-center tracking-widest"
                      style={{
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        outline: 'none',
                      }}
                      required
                    />
                  </div>

                  {resetMessage && (
                    <div className="p-3 rounded-lg text-xs font-semibold text-center" style={{ background: 'var(--color-green-dim)', color: 'var(--color-green)' }}>
                      ✅ {resetMessage}
                    </div>
                  )}

                  {resetError && (
                    <div className="p-3 rounded-lg text-xs font-semibold text-center" style={{ background: 'var(--color-red-dim)', color: 'var(--color-red)' }}>
                      ❌ {resetError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isResetting || !resetUsername || !resetPin}
                    className="btn btn-primary w-full py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                    style={{ background: 'var(--color-gold-gradient)', color: '#000000' }}
                  >
                    {isResetting ? 'Procesando...' : '🔒 Cambiar PIN'}
                  </button>
                </form>
              </div>
            )}

            {/* Sub-tab: Actividad */}
            {adminSubTab === 'activity' && (
              <div className="glass-strong rounded-2xl p-5 border border-[var(--color-border)]">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">📜 Registro de Actividad</h3>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Auditoría completa de movimientos de apuestas del grupo.</p>
                </div>
                <ActivityFeed />
              </div>
            )}
          </div>
        )}
      </main>

      {/* ═══════ MODAL: REGLAS ═══════ */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in animate-duration-200"
            onClick={() => setShowRules(false)}
          />
          {/* Modal Container */}
          <div
            className="glass-strong rounded-2xl w-full max-w-lg overflow-hidden relative z-10 border border-[var(--color-border-gold)] animate-scale-in"
            style={{
              background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
            }}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <span className="text-base font-extrabold flex items-center gap-2" style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-display)' }}>
                ℹ️ Reglas e Información
              </span>
              <button
                onClick={() => setShowRules(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 overflow-y-auto max-h-[60vh] space-y-4 text-xs leading-relaxed text-[var(--color-text-secondary)]">
              {/* Card 1: Puntos */}
              <div className="glass-card rounded-xl p-3.5 border border-[var(--color-border)]">
                <span className="font-bold text-sm text-[var(--color-text-primary)] block mb-1.5">⚽ Puntuación</span>
                <p className="mb-2">El puntaje se asigna de la siguiente manera al finalizar el partido:</p>
                <div className="space-y-1 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 font-bold shrink-0">✅ +3 puntos:</span>
                    <span>Acertar el resultado del partido (Gana Local, Empate o Gana Visitante).</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-400 font-bold shrink-0">❌ 0 puntos:</span>
                    <span>No acertar el resultado.</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Límite */}
              <div className="glass-card rounded-xl p-3.5 border border-[var(--color-border)]">
                <span className="font-bold text-sm text-[var(--color-text-primary)] block mb-1.5">⏱️ Límite de Apuesta</span>
                <p>Las apuestas se cierran automáticamente **5 minutos antes** de la hora programada del partido (kickoff). Una vez cerrado, no se pueden añadir, cambiar ni eliminar apuestas.</p>
              </div>

              {/* Card 3: La K */}
              <div className="glass-card rounded-xl p-3.5 border border-[var(--color-border)]">
                <span className="font-bold text-sm text-[var(--color-text-primary)] block mb-1.5">💰 Inscripción y La K Acumulada</span>
                <p className="mb-2">La cuota de inscripción es de **$30.000 COP** por jugador. Toda la K acumulada se divide entre los 3 primeros lugares del ranking al final del torneo:</p>
                <div className="space-y-1.5 font-semibold text-[var(--color-text-primary)] text-[11px]">
                  <div className="flex justify-between items-center bg-[rgba(255,215,0,0.06)] p-1.5 rounded border border-[rgba(255,215,0,0.1)]">
                    <span>🥇 Primer Lugar</span>
                    <span style={{ color: 'var(--color-gold)' }}>70% de la K</span>
                  </div>
                  <div className="flex justify-between items-center bg-[rgba(255,255,255,0.02)] p-1.5 rounded border border-[var(--color-border)]">
                    <span>🥈 Segundo Lugar</span>
                    <span>20% de la K</span>
                  </div>
                  <div className="flex justify-between items-center bg-[rgba(255,255,255,0.02)] p-1.5 rounded border border-[var(--color-border)]">
                    <span>🥉 Tercer Lugar</span>
                    <span>10% de la K</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Títulos */}
              <div className="glass-card rounded-xl p-3.5 border border-[var(--color-border)]">
                <span className="font-bold text-sm text-[var(--color-text-primary)] block mb-1.5">🏅 Títulos Especiales</span>
                <p className="mb-2">El ranking asigna títulos dinámicos automáticos según las estadísticas:</p>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 rounded bg-[rgba(255,255,255,0.02)] border border-[var(--color-border)]">
                    <span className="font-bold block mb-0.5">🧙‍♂️ El Nostradamus</span>
                    <span className="text-[var(--color-text-muted)]">Va de primer lugar.</span>
                  </div>
                  <div className="p-2 rounded bg-[rgba(255,255,255,0.02)] border border-[var(--color-border)]">
                    <span className="font-bold block mb-0.5">🥈 El Segundón</span>
                    <span className="text-[var(--color-text-muted)]">Va en segundo lugar.</span>
                  </div>
                  <div className="p-2 rounded bg-[rgba(255,255,255,0.02)] border border-[var(--color-border)]">
                    <span className="font-bold block mb-0.5">🏠 El Local</span>
                    <span className="text-[var(--color-text-muted)]">Apuesta más a ganar local.</span>
                  </div>
                  <div className="p-2 rounded bg-[rgba(255,255,255,0.02)] border border-[var(--color-border)]">
                    <span className="font-bold block mb-0.5">🤝 El Tibio</span>
                    <span className="text-[var(--color-text-muted)]">Apuesta más a empates.</span>
                  </div>
                  <div className="p-2 rounded bg-[rgba(255,255,255,0.02)] border border-[var(--color-border)]">
                    <span className="font-bold block mb-0.5">🧂 El Salado</span>
                    <span className="text-[var(--color-text-muted)]">Cero aciertos jugados.</span>
                  </div>
                  <div className="p-2 rounded bg-[rgba(255,255,255,0.02)] border border-[var(--color-border)]">
                    <span className="font-bold block mb-0.5">💀 El Sótano</span>
                    <span className="text-[var(--color-text-muted)]">Último lugar del ranking.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-[var(--color-border)] bg-[rgba(0,0,0,0.1)] flex justify-end">
              <button
                onClick={() => setShowRules(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-102"
                style={{ background: 'var(--color-gold-gradient)', color: '#000000', cursor: 'pointer' }}
              >
                ¡Listo, a jugar!
              </button>
            </div>
          </div>
        </div>
      )}
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
