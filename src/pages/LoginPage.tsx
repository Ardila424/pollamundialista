import { useState, useRef, type FormEvent, type KeyboardEvent } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    if (value && index < 3) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  };

  const handlePinPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      setPin(pasted.split(''));
      pinRefs.current[3]?.focus();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const pinStr = pin.join('');
    if (!username.trim()) {
      setError('Ingresa tu nombre de usuario');
      return;
    }
    if (pinStr.length !== 4) {
      setError('El PIN debe tener 4 dígitos');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(username.trim(), pinStr);
      if (result.isNewUser) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-5 relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            top: '-15%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, transparent 65%)',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            bottom: '-10%',
            right: '-5%',
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.06) 0%, transparent 65%)',
          }}
        />
        {/* Floating elements */}
        <div className="absolute animate-float" style={{ top: '12%', right: '18%', animationDelay: '0s' }}>
          <span className="text-4xl opacity-[0.08]">⚽</span>
        </div>
        <div className="absolute animate-float" style={{ bottom: '20%', left: '12%', animationDelay: '1.5s' }}>
          <span className="text-3xl opacity-[0.06]">⚽</span>
        </div>
        <div className="absolute animate-float" style={{ top: '55%', right: '8%', animationDelay: '0.8s' }}>
          <span className="text-2xl opacity-[0.05]">🏟️</span>
        </div>
      </div>

      {/* Login Card */}
      <div className="glass-strong rounded-3xl p-8 sm:p-10 w-full max-w-[380px] animate-fade-in-up relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'var(--color-gold-dim)' }}>
            <span className="text-3xl">🏆</span>
          </div>
          <h1
            className="text-[1.625rem] font-extrabold tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)' }}
          >
            Polla Mundialista
          </h1>
          <p className="text-sm mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
            Mundial 2026 · Predice y gana
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label
              htmlFor="login-username"
              className="block text-[0.6875rem] font-semibold mb-2 uppercase tracking-[0.08em]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Nombre de usuario
            </label>
            <input
              id="login-username"
              type="text"
              className="input"
              placeholder="Ej: santiago"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </div>

          {/* PIN */}
          <div>
            <label
              className="block text-[0.6875rem] font-semibold mb-2 uppercase tracking-[0.08em]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              PIN de acceso
            </label>
            <div className="flex gap-3 justify-center" onPaste={handlePinPaste}>
              {pin.map((digit, i) => (
                <input
                  key={i}
                  id={`login-pin-${i}`}
                  ref={(el) => { pinRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className="w-[60px] h-[60px] text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all duration-200"
                  style={{
                    background: digit ? 'var(--color-gold-dim)' : 'var(--color-bg-secondary)',
                    borderColor: digit ? 'var(--color-gold)' : 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-display)',
                    caretColor: 'var(--color-gold)',
                  }}
                  value={digit}
                  onChange={(e) => handlePinChange(i, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(i, e)}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-gold)';
                    e.target.style.boxShadow = '0 0 0 4px rgba(245, 158, 11, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = digit ? 'var(--color-gold)' : 'var(--color-border)';
                    e.target.style.boxShadow = 'none';
                  }}
                  autoComplete="off"
                />
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="text-sm text-center py-2.5 px-4 rounded-xl animate-fade-in flex items-center justify-center gap-2"
              style={{ background: 'var(--color-red-dim)', color: 'var(--color-red)' }}
            >
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Success */}
          {showSuccess && (
            <div
              className="text-sm text-center py-2.5 px-4 rounded-xl animate-fade-in flex items-center justify-center gap-2"
              style={{ background: 'var(--color-green-dim)', color: 'var(--color-green)' }}
            >
              <span>🎉</span> ¡Cuenta creada exitosamente!
            </div>
          )}

          {/* Submit */}
          <button
            id="login-submit"
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full text-[0.9375rem] py-3.5 rounded-xl"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Ingresando...
              </>
            ) : (
              'Ingresar'
            )}
          </button>

          <p className="text-[0.6875rem] text-center leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Primera vez? Tu cuenta se crea automáticamente.
          </p>
        </form>
      </div>
    </div>
  );
}
