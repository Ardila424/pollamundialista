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
  'Bosnia and Herzegovina': '🇧🇦', 'Paraguay': '🇵🇾', 'Haiti': '🇭🇹', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Australia': '🇦🇺', 'Turkey': '🇹🇷', 'Brazil': '🇧🇷', 'Morocco': '🇲🇦',
  'Portugal': '🇵🇹', 'Ivory Coast': '🇨🇮', 'Nigeria': '🇳🇬', 'Cameroon': '🇨🇲',
  'Senegal': '🇸🇳', 'Argentina': '🇦🇷', 'Japan': '🇯🇵', 'Spain': '🇪🇸',
  'South Korea': '🇰🇷', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Saudi Arabia': '🇸🇦', 'Ghana': '🇬🇭',
  'Netherlands': '🇳🇱', 'Ecuador': '🇪🇨', 'Italy': '🇮🇹', 'Costa Rica': '🇨🇷',
  'Belgium': '🇧🇪', 'Uruguay': '🇺🇾', 'Croatia': '🇭🇷', 'Panama': '🇵🇦',
  'Denmark': '🇩🇰', 'Tunisia': '🇹🇳', 'Serbia': '🇷🇸', 'Switzerland': '🇨🇭',
  'Iran': '🇮🇷', 'Poland': '🇵🇱', 'Chile': '🇨🇱', 'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  'Egypt': '🇪🇬', 'Honduras': '🇭🇳', 'Sweden': '🇸🇪', 'Czech Republic': '🇨🇿',
  'Ukraine': '🇺🇦', 'Jamaica': '🇯🇲', 'Qatar': '🇶🇦', 'New Zealand': '🇳🇿',
  'Colombia': '🇨🇴', 'Peru': '🇵🇪', 'Bolivia': '🇧🇴', 'Germany': '🇩🇪', 'France': '🇫🇷',
  'Jordan': '🇯🇴', 'Austria': '🇦🇹', 'Uzbekistan': '🇺🇿', 'Curaçao': '🇨🇼',
  'Cape Verde': '🇨🇻', 'Algeria': '🇩🇿', 'Democratic Republic of Congo': '🇨🇩', 'Iraq': '🇮🇶',
  'Norway': '🇳🇴', 'Czechia': '🇨🇿', 'Türkiye': '🇹🇷',
};

const getFlag = (team: string) => FLAG_MAP[team] || '🏳️';

export default function MatchCard({ match, onPredictionSaved }: MatchCardProps) {
  const [selectedPrediction, setSelectedPrediction] = useState<PredictionChoice | null>(
    (match.user_prediction as PredictionChoice) || null
  );
  const [isSaving, setIsSaving] = useState(false);

  const isFinished = match.status === 'Finalizado';
  const isInProgress = match.status === 'En_Progreso';
  const isOpen = match.is_open && match.status === 'Pendiente';

  const matchDate = new Date(match.match_date);
  const formattedTime = matchDate.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Bogota'
  }) + ' COT';

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

  const getPredBtnClass = (choice: PredictionChoice) => {
    const isSelected = selectedPrediction === choice;
    const isCorrect = isFinished && match.user_prediction === choice && match.user_points === 3;
    const isWrong = isFinished && match.user_prediction === choice && match.user_points === 0;

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
                  background: 'var(--color-bg-secondary)',
                  fontFamily: 'var(--font-display)',
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
                  cutoffMs={30 * 60 * 1000} 
                  className={!isOpen ? "text-[#EF4444]" : ""}
                />
              )}
            </div>

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
          </div>
        )}

        {/* Points badge for finished */}
        {isFinished && match.user_prediction && (
          <div className="flex justify-center mt-3">
            <span
              className="pill text-xs font-bold"
              style={{
                background: match.user_points === 3 ? 'var(--color-green-dim)' : 'var(--color-red-dim)',
                color: match.user_points === 3 ? 'var(--color-green)' : 'var(--color-red)',
              }}
            >
              {match.user_points === 3 ? '✅ +3 puntos' : '❌ 0 puntos'}
            </span>
          </div>
        )}

        {/* No bet for finished/closed */}
        {(isFinished || (!isOpen && match.status !== 'Pendiente')) && !match.user_prediction && (
          <div className="text-center mt-3">
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>— No apostó —</span>
          </div>
        )}
      </div>
    </div>
  );
}
