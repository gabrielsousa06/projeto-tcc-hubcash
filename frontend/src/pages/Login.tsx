import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // ✅ novo estado

  const { signIn } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch {
      setError('E-mail ou senha inválidos');
    } finally {
      setLoading(false);
    }
  }

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
      <div style={{ width: '100%', maxWidth: '520px' }}>

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '10px' }}>
          <img src="/logo.png" alt="HubCash" style={{ width: '400px', objectFit: 'contain', marginBottom: '-40px' }} />
        </div>

        {/* Card */}
        <div style={{
          background: '#FFFFFF', borderRadius: '28px', padding: '45px',
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.08)',
          border: '1px solid rgba(226,232,240,0.8)',
        }}>
          <h1 style={{ textAlign: 'center', fontSize: '38px', fontWeight: 700, color: '#0F172A', marginTop: 0, marginBottom: '10px' }}>
            Acesse sua conta
          </h1>
          <p style={{ textAlign: 'center', color: '#64748B', fontSize: '15px', marginBottom: '35px' }}>
            Faça login para acompanhar suas finanças
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
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontSize: '14px', fontWeight: 600 }}>
                Senha
              </label>
              {/* ✅ wrapper com posição relativa */}
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ ...inputStyle, paddingRight: '50px' }}
                />
                {/* ✅ botão olhinho */}
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94A3B8',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-10px' }}>
              <Link to="/forgot-password" style={{ color: '#2563EB', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
                Esqueci minha senha
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', height: '58px', borderRadius: '999px', border: 'none',
                background: loading ? '#94A3B8' : 'linear-gradient(90deg, #0F4CFF 0%, #10B981 100%)',
                color: '#FFFFFF', fontSize: '17px', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 10px 25px rgba(15,76,255,0.25)',
                transition: 'all 0.2s ease',
              }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div style={{ marginTop: '28px', textAlign: 'center' }}>
            <span style={{ color: '#64748B', fontSize: '15px' }}>Ainda não possui conta?{' '}</span>
            <Link to="/register" style={{ color: '#2563EB', textDecoration: 'none', fontWeight: 600, fontSize: '15px' }}>
              Criar conta
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}