import { useState } from 'react';
import type { Match, PredictionChoice } from '../types';
import api from '../lib/api';
import Countdown from './Countdown';

interface MatchCardProps {
  match: Match;
  onPredictionSaved: () => void;
}

// Country flag emoji mapping
const FLAG_MAP: Record<string, string> = {
  // Español
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
  'Irak': '🇮🇶', 'Noruega': '🇳🇴',
  // English (from API)
  'Mexico': '🇲🇽', 'Canada': '🇨🇦', 'United States': '🇺🇸', 'South Africa': '🇿🇦',
  'Bosnia and Herzegovina': '🇧🇦', 'Haiti': '🇭🇹', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Turkey': '🇹🇷', 'Brazil': '🇧🇷', 'Morocco': '🇲🇦',
  'Ivory Coast': '🇨🇮', 'Cameroon': '🇨🇲',
  'Japan': '🇯🇵', 'Spain': '🇪🇸',
  'South Korea': '🇰🇷', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Saudi Arabia': '🇸🇦',
  'Netherlands': '🇳🇱', 'Italy': '🇮🇹',
  'Belgium': '🇧🇪', 'Croatia': '🇭🇷', 'Panama': '🇵🇦',
  'Denmark': '🇩🇰', 'Tunisia': '🇹🇳', 'Switzerland': '🇨🇭',
  'Iran': '🇮🇷', 'Poland': '🇵🇱', 'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  'Egypt': '🇪🇬', 'Sweden': '🇸🇪', 'Czech Republic': '🇨🇿',
  'Ukraine': '🇺🇦', 'New Zealand': '🇳🇿',
  'Peru': '🇵🇪', 'Germany': '🇩🇪', 'France': '🇫🇷',
  'Jordan': '🇯🇴', 'Uzbekistan': '🇺🇿', 'Curaçao': '🇨🇼',
  'Cape Verde': '🇨🇻', 'Algeria': '🇩🇿', 'Democratic Republic of Congo': '🇨🇩', 'Democratic Republic of the Congo': '🇨🇩', 'Iraq': '🇮🇶',
  'Norway': '🇳🇴', 'Czechia': '🇨🇿', 'Türkiye': '🇹🇷',
};

const getFlag = (team: string) => FLAG_MAP[team] || '🏳️';

export default function MatchCard({ match, onPredictionSaved }: MatchCardProps) {
  const [selectedPrediction, setSelectedPrediction] = useState<PredictionChoice | null>(
    (match.user_prediction as PredictionChoice) || null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showGroup, setShowGroup] = useState(false);
  const [groupBets, setGroupBets] = useState<any[]>([]);
  const [loadingGroup, setLoadingGroup] = useState(false);

  const toggleGroupBets = async () => {
    if (showGroup) {
      setShowGroup(false);
      return;
    }
    setShowGroup(true);
    setLoadingGroup(true);
    try {
      const res = await api.getMatchPredictions(match.id);
      setGroupBets(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGroup(false);
    }
  };

  const isFinished = match.status === 'Finalizado';
  const isInProgress = match.status === 'En_Progreso';
  const isOpen = match.is_open && match.status === 'Pendiente';
  const isGroupStage = match.phase === 'Grupos';

  const matchDate = new Date(match.match_date);
  const formattedTime = matchDate.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Bogota'
  }) + ' COT';

  // Parsear la predicción actual en fase eliminatoria
  let currentWinner: 'Local' | 'Visitante' | null = null;
  let currentMethod: '120' | 'Penales' | null = null;

  if (selectedPrediction) {
    if (selectedPrediction.includes('_')) {
      const parts = selectedPrediction.split('_');
      currentWinner = parts[0] as 'Local' | 'Visitante';
      currentMethod = parts[1] as '120' | 'Penales';
    } else {
      if (selectedPrediction === 'Local') {
        currentWinner = 'Local';
        currentMethod = '120';
      } else if (selectedPrediction === 'Visitante') {
        currentWinner = 'Visitante';
        currentMethod = '120';
      }
    }
  }

  const handlePredict = async (choice: PredictionChoice) => {
    if (!isOpen || isSaving) return;

    const isRemoving = selectedPrediction === choice;
    setSelectedPrediction(isRemoving ? null : choice);
    setIsSaving(true);

    try {
      if (isRemoving) {
        await api.deletePrediction(match.id);
      } else {
        await api.savePrediction(match.id, choice);
      }
      onPredictionSaved();
    } catch (err: any) {
      setSelectedPrediction((match.user_prediction as PredictionChoice) || null);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePredictKnockout = async (winner: 'Local' | 'Visitante') => {
    if (!isOpen || isSaving) return;

    if (currentWinner === winner) {
      // Toggle off / deseleccionar
      setSelectedPrediction(null);
      setIsSaving(true);
      try {
        await api.deletePrediction(match.id);
        onPredictionSaved();
      } catch (err) {
        setSelectedPrediction((match.user_prediction as PredictionChoice) || null);
      } finally {
        setIsSaving(false);
      }
    } else {
      // Seleccionar ganador, por defecto método '120'
      const method = currentMethod || '120';
      const choice = `${winner}_${method}` as PredictionChoice;
      setSelectedPrediction(choice);
      setIsSaving(true);
      try {
        await api.savePrediction(match.id, choice);
        onPredictionSaved();
      } catch (err) {
        setSelectedPrediction((match.user_prediction as PredictionChoice) || null);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleMethodPredict = async (method: '120' | 'Penales') => {
    if (!isOpen || isSaving || !currentWinner) return;

    const choice = `${currentWinner}_${method}` as PredictionChoice;
    setSelectedPrediction(choice);
    setIsSaving(true);
    try {
      await api.savePrediction(match.id, choice);
      onPredictionSaved();
    } catch (err) {
      setSelectedPrediction((match.user_prediction as PredictionChoice) || null);
    } finally {
      setIsSaving(false);
    }
  };

  const getPredBtnClass = (choice: PredictionChoice) => {
    const isSelected = selectedPrediction === choice;
    const isCorrect = isFinished && match.user_prediction === choice && match.user_points === 3;
    const isWrong = isFinished && match.user_prediction === choice && match.user_points === 0;

    if (isCorrect) return 'pred-btn correct';
    if (isWrong) return 'pred-btn wrong';
    if (isSelected) return 'pred-btn selected';
    return 'pred-btn';
  };

  const getKnockoutWinnerBtnClass = (winner: 'Local' | 'Visitante') => {
    const isSelected = currentWinner === winner;
    const isCorrect = isFinished && currentWinner === winner && (match.user_points !== null && match.user_points >= 2);
    const isWrong = isFinished && currentWinner === winner && match.user_points === 0;

    if (isCorrect) return 'pred-btn correct';
    if (isWrong) return 'pred-btn wrong';
    if (isSelected) return 'pred-btn selected';
    return 'pred-btn';
  };

  const getKnockoutMethodBtnClass = (method: '120' | 'Penales') => {
    const isSelected = currentMethod === method;
    const isCorrect = isFinished && currentMethod === method && match.user_points === 3;
    const isWrong = isFinished && currentMethod === method && match.user_points === 2;

    if (isCorrect) return 'pred-btn correct';
    if (isWrong) return 'pred-btn wrong';
    if (isSelected) return 'pred-btn selected';
    return 'pred-btn';
  };

  const shortName = (name: string) => {
    if (!name) return '-';
    if (name.length <= 8) return name;
    return name.split(' ')[0].slice(0, 7);
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Top bar: phase + time */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          {match.group_name && (
            <span className="pill" style={{ background: 'rgba(226, 232, 240, 0.1)', color: '#E2E8F0' }}>
              Grupo {match.group_name}
            </span>
          )}
          {!match.group_name && (
            <span className="pill" style={{ background: 'rgba(226, 232, 240, 0.1)', color: '#E2E8F0' }}>
              {match.phase}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isInProgress && (
            <span className="pill animate-pulse-soft" style={{ background: 'var(--color-red-dim)', color: 'var(--color-red)' }}>
              ● EN VIVO
            </span>
          )}
          {isFinished && (
            <span className="pill" style={{ background: 'rgba(148, 163, 184, 0.08)', color: 'var(--color-text-muted)' }}>
              Finalizado
            </span>
          )}
          <span className="text-[0.6875rem] font-medium tracking-wide" style={{ color: '#E2E8F0' }}>
            {formattedTime}
          </span>
        </div>
      </div>

      {/* Match content */}
      <div className="px-4 py-4">
        {/* Teams row */}
        <div className="flex items-center justify-between mb-1">
          {/* Home team */}
          <div className="flex flex-col items-center justify-center flex-1 min-w-0 text-center">
            <span className="text-3xl mb-1 shrink-0">{getFlag(match.home_team)}</span>
            <span className="font-semibold text-sm truncate w-full">{match.home_team}</span>
          </div>

          {/* Score / VS */}
          <div className="shrink-0 mx-3">
            {isFinished || isInProgress ? (
              <div
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg"
                style={{
                  background: isInProgress ? 'rgba(239, 68, 68, 0.12)' : 'var(--color-bg-secondary)',
                  border: isInProgress ? '1px solid rgba(239, 68, 68, 0.35)' : 'none',
                  fontFamily: 'var(--font-display)',
                  boxShadow: isInProgress ? '0 0 10px rgba(239, 68, 68, 0.25)' : 'none',
                }}
              >
                <span className="text-xl font-bold">{match.home_goals ?? '-'}</span>
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>-</span>
                <span className="text-xl font-bold">{match.away_goals ?? '-'}</span>
              </div>
            ) : (
              <span
                className="text-[0.625rem] font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest"
                style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-muted)' }}
              >
                VS
              </span>
            )}
          </div>

          {/* Away team */}
          <div className="flex flex-col items-center justify-center flex-1 min-w-0 text-center">
            <span className="text-3xl mb-1 shrink-0">{getFlag(match.away_team)}</span>
            <span className="font-semibold text-sm truncate w-full">{match.away_team}</span>
          </div>
        </div>

        {/* Prediction area */}
        {!isFinished && !isInProgress && match.time_remaining_ms !== null && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#E2E8F0' }}>
                Tu Pronóstico
              </span>
              {!isOpen ? (
                <span className="text-xs font-bold" style={{ color: '#EF4444' }}>
                  🔒 CERRADO
                </span>
              ) : (
                <Countdown 
                  targetDate={matchDate} 
                  cutoffMs={30 * 1000} 
                  className={!isOpen ? "text-[#EF4444]" : ""}
                />
              )}
            </div>

            {isGroupStage ? (
              <div className="flex gap-2 justify-center">
                <button
                  disabled={!isOpen || isSaving}
                  onClick={() => handlePredict('Local')}
                  className={`${getPredBtnClass('Local')} flex-1 max-w-[100px] ${!isOpen ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {shortName(match.home_team)}
                </button>
                <button
                  disabled={!isOpen || isSaving}
                  onClick={() => handlePredict('Empate')}
                  className={`${getPredBtnClass('Empate')} flex-1 max-w-[80px] ${!isOpen ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Empate
                </button>
                <button
                  disabled={!isOpen || isSaving}
                  onClick={() => handlePredict('Visitante')}
                  className={`${getPredBtnClass('Visitante')} flex-1 max-w-[100px] ${!isOpen ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {shortName(match.away_team)}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex gap-2 justify-center">
                  <button
                    disabled={!isOpen || isSaving}
                    onClick={() => handlePredictKnockout('Local')}
                    className={`${getKnockoutWinnerBtnClass('Local')} flex-1 max-w-[140px] ${!isOpen ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    🏆 {shortName(match.home_team)}
                  </button>
                  <button
                    disabled={!isOpen || isSaving}
                    onClick={() => handlePredictKnockout('Visitante')}
                    className={`${getKnockoutWinnerBtnClass('Visitante')} flex-1 max-w-[140px] ${!isOpen ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    🏆 {shortName(match.away_team)}
                  </button>
                </div>
                
                {/* Selector de método de victoria */}
                {currentWinner && (
                  <div className="flex flex-col gap-1.5 mt-1">
                    <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider text-center">
                      Método de Victoria:
                    </div>
                    <div className="flex gap-2 justify-center">
                      <button
                        disabled={!isOpen || isSaving}
                        onClick={() => handleMethodPredict('120')}
                        className={`${getKnockoutMethodBtnClass('120')} flex-1 py-1.5 px-3 max-w-[140px] ${!isOpen ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={{ fontSize: '10px' }}
                      >
                        ⏱️ En 120 mins
                      </button>
                      <button
                        disabled={!isOpen || isSaving}
                        onClick={() => handleMethodPredict('Penales')}
                        className={`${getKnockoutMethodBtnClass('Penales')} flex-1 py-1.5 px-3 max-w-[140px] ${!isOpen ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={{ fontSize: '10px' }}
                      >
                        ⚽ Por penales
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Points badge for finished */}
        {isFinished && match.user_prediction && (
          <div className="flex flex-col items-center mt-3 gap-1">
            <span
              className="pill text-xs font-bold"
              style={{
                background: (match.user_points !== null && match.user_points > 0) ? 'var(--color-green-dim)' : 'var(--color-red-dim)',
                color: (match.user_points !== null && match.user_points > 0) ? 'var(--color-green)' : 'var(--color-red)',
              }}
            >
              {(match.user_points !== null && match.user_points > 0) ? `✅ +${match.user_points} puntos` : '❌ 0 puntos'}
            </span>
            
            {/* Detalle para fases de eliminación */}
            {!isGroupStage && match.user_points !== null && match.user_points > 0 && (
              <span className="text-[9px] text-[var(--color-text-muted)] font-medium">
                {match.user_points === 3 ? '🎯 Acertó ganador y método' : '👍 Acertó solo ganador (2 pts)'}
              </span>
            )}
          </div>
        )}

        {/* No bet for finished/closed */}
        {(isFinished || (!isOpen && match.status !== 'Pendiente')) && !match.user_prediction && (
          <div className="text-center mt-3">
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>— No apostó —</span>
          </div>
        )}

        {/* Voting Trends (Tendencias) */}
        {match.prediction_trends && match.prediction_trends.total_bets > 0 && (
          <div className="mt-3.5 pt-3 border-t border-[var(--color-border)]">
            <div className="text-[10px] font-medium text-[var(--color-text-muted)] mb-1">
              📊 Tendencia de apuestas
            </div>
            {/* Visual stacked bar */}
            <div className="flex h-2 w-full rounded-full overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] mb-1.5">
              {match.prediction_trends.Local > 0 && (
                <div 
                  style={{ width: `${match.prediction_trends.Local}%`, background: 'var(--color-gold)' }} 
                  title={`Local: ${match.prediction_trends.Local}%`}
                />
              )}
              {match.prediction_trends.Empate > 0 && (
                <div 
                  style={{ width: `${match.prediction_trends.Empate}%`, background: '#94A3B8' }} 
                  title={`Empate: ${match.prediction_trends.Empate}%`}
                />
              )}
              {match.prediction_trends.Visitante > 0 && (
                <div 
                  style={{ width: `${match.prediction_trends.Visitante}%`, background: 'var(--color-cyan)' }} 
                  title={`Visitante: ${match.prediction_trends.Visitante}%`}
                />
              )}
            </div>
            {/* Labels */}
            <div className="flex justify-between text-[9px] text-[var(--color-text-secondary)] font-semibold">
              <span className="flex items-center gap-0.5">🏠 {match.prediction_trends.Local}%</span>
              <span className="flex items-center gap-0.5">🤝 {match.prediction_trends.Empate}%</span>
              <span className="flex items-center gap-0.5">✈️ {match.prediction_trends.Visitante}%</span>
            </div>
          </div>
        )}

        {/* Toggle show group bets (Only when closed) */}
        {!isOpen && (
          <div className="mt-3.5 text-center">
            <button
              onClick={toggleGroupBets}
              className="text-[11px] font-bold py-1 px-3 rounded-lg flex items-center justify-center gap-1 mx-auto transition-all"
              style={{
                background: showGroup ? 'var(--color-surface)' : 'rgba(255, 215, 0, 0.06)',
                color: 'var(--color-gold)',
                border: '1px solid var(--color-border-gold)',
              }}
            >
              {showGroup ? '🙈 Ocultar apuestas' : '👥 Ver apuestas del grupo'}
            </button>
            
            {showGroup && (
              <div className="mt-3 text-left">
                <div className="text-[10px] font-bold text-[var(--color-text-muted)] mb-2 flex items-center justify-between uppercase tracking-wider">
                  <span>👥 Apuestas</span>
                  <span>{groupBets.length} {groupBets.length === 1 ? 'voto' : 'votos'}</span>
                </div>
                {loadingGroup ? (
                  <div className="text-center py-3 text-[10px] text-[var(--color-text-muted)] flex items-center justify-center gap-1.5">
                    <span className="animate-spin text-sm">🔄</span> Cargando...
                  </div>
                ) : groupBets.length === 0 ? (
                  <div className="text-center py-2 text-[10px] text-[var(--color-text-muted)] italic">
                    Nadie apostó
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {groupBets.map((bet) => {
                      let displayPred = bet.prediction;
                      let choiceEmoji = '🤝';
                      if (bet.prediction.startsWith('Local')) {
                        choiceEmoji = '🏠';
                        displayPred = bet.prediction.includes('_')
                          ? `Local (${bet.prediction.split('_')[1] === '120' ? '120 min' : 'Penales'})`
                          : 'Local';
                      } else if (bet.prediction.startsWith('Visitante')) {
                        choiceEmoji = '✈️';
                        displayPred = bet.prediction.includes('_')
                          ? `Visitante (${bet.prediction.split('_')[1] === '120' ? '120 min' : 'Penales'})`
                          : 'Visitante';
                      }
                      const ptsText = bet.points !== null ? ` (+${bet.points} pts)` : '';
                      return (
                        <div 
                          key={bet.username} 
                          className="flex justify-between items-center py-1 px-1.5 rounded text-[11px]"
                          style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          }}
                        >
                          <span className="font-semibold text-[var(--color-text-secondary)]">{bet.username}</span>
                          <span className="font-bold flex items-center gap-1" style={{ color: 'var(--color-gold)' }}>
                            {choiceEmoji} {displayPred}{ptsText}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
