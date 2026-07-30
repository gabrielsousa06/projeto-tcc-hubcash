import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import api from '../services/api';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const inputStyle = {
    width: '100%',
    height: '58px',
    borderRadius: '14px',
    border: '1px solid #E5E7EB',
    background: '#FFFFFF',
    padding: '0 18px',
    fontSize: '15px',
    color: '#111827',
    outline: 'none',
    boxSizing: 'border-box' as const,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    transition: 'all 0.2s ease',
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, password });
      navigate('/login');
    } catch {
      setError('Email não encontrado. Verifique e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #F8FAFC 0%, #EEF2F7 100%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '40px 20px 20px',
      fontFamily: "'Inter', sans-serif",
    }}>
      <style>{`
        @media (max-width: 640px) {
          .fp-logo { width: 200px !important; margin-bottom: -20px !important; }
          .fp-card { padding: 28px 20px !important; border-radius: 20px !important; }
          .fp-title { font-size: 26px !important; }
          .fp-wrapper { padding: 16px 16px 20px !important; }
        }
      `}</style>

      <div className="fp-wrapper" style={{ width: '100%', maxWidth: '520px' }}>

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '10px' }}>
          <img className="fp-logo" src="/logo.png" alt="HubCash" style={{ width: '400px', objectFit: 'contain', marginBottom: '-40px' }} />
        </div>

        {/* Card */}
        <div className="fp-card" style={{
          background: '#FFFFFF', borderRadius: '28px', padding: '45px',
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.08)',
          border: '1px solid rgba(226,232,240,0.8)',
        }}>
          <h1 className="fp-title" style={{ textAlign: 'center', fontSize: '32px', fontWeight: 700, color: '#0F172A', marginTop: 0, marginBottom: '10px' }}>
            Redefinir senha
          </h1>
          <p style={{ textAlign: 'center', color: '#64748B', fontSize: '15px', marginBottom: '35px' }}>
            Informe seu email e a nova senha
          </p>

          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626',
              padding: '14px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontSize: '14px', fontWeight: 600 }}>
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontSize: '14px', fontWeight: 600 }}>
                Nova senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  style={{ ...inputStyle, paddingRight: '50px' }}
                />
                <button type="button" onClick={() => setShowPassword(s => !s)} style={{
                  position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8',
                  padding: 0, display: 'flex', alignItems: 'center',
                }}>
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontSize: '14px', fontWeight: 600 }}>
                Confirmar nova senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  required
                  style={{ ...inputStyle, paddingRight: '50px' }}
                />
                <button type="button" onClick={() => setShowConfirm(s => !s)} style={{
                  position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8',
                  padding: 0, display: 'flex', alignItems: 'center',
                }}>
                  {showConfirm ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', height: '58px', borderRadius: '999px', border: 'none',
                background: loading ? '#94A3B8' : 'linear-gradient(90deg, #0F4CFF 0%, #10B981 100%)',
                color: '#FFFFFF', fontSize: '17px', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 10px 25px rgba(15,76,255,0.25)', transition: 'all 0.2s ease',
              }}
            >
              {loading ? 'Redefinindo...' : 'Redefinir senha'}
            </button>
          </form>

          <div style={{ marginTop: '28px', textAlign: 'center' }}>
            <Link to="/login" style={{ color: '#2563EB', textDecoration: 'none', fontWeight: 600, fontSize: '15px' }}>
              ← Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}