import { useState, useEffect, useCallback } from 'react';

interface CountdownProps {
  targetDate: Date;
  cutoffMs: number; // e.g. 30 * 60 * 1000
}

export default function Countdown({ targetDate, cutoffMs }: CountdownProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const remainingToMatch = targetDate.getTime() - now.getTime();
  const isLocked = remainingToMatch <= cutoffMs;

  const formatTime = useCallback((ms: number) => {
    if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    const totalSeconds = Math.floor(ms / 1000);
    return {
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
    };
  }, []);

  if (remainingToMatch <= 0) {
    return (
      <span className="pill" style={{ background: 'var(--color-red-dim)', color: 'var(--color-red)' }}>
        🔒 Finalizado
      </span>
    );
  }

  const { days, hours, minutes, seconds } = formatTime(remainingToMatch);
  const pad = (n: number) => n.toString().padStart(2, '0');

  if (isLocked) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.6875rem] font-medium"
        style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}
      >
        <span>🔒</span>
        <span className="font-mono font-semibold tracking-wide">
          {days > 0 && `${days}d `}{pad(hours)}:{pad(minutes)}:{pad(seconds)}
        </span>
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.6875rem] font-medium"
      style={{ background: 'var(--color-green-dim)', color: 'var(--color-green)' }}
    >
      <span>⏱️</span>
      <span className="font-mono font-semibold tracking-wide">
        {days > 0 && `${days}d `}{pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
    </div>
  );
}
