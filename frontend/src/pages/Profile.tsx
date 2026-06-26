import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import api from '../services/api';

export function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const inputStyle = {
    width: '100%',
    height: '52px',
    borderRadius: '12px',
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

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const data: { name?: string; email?: string; password?: string } = {};
      if (name !== user?.name) data.name = name;
      if (email !== user?.email) data.email = email;
      if (password) data.password = password;

      await api.patch('/users/me', data);

      // ✅ atualiza o localStorage com os novos dados
      const updatedUser = { ...user, name, email };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setSuccess('Perfil atualizado com sucesso!');
      setPassword('');
    } catch {
      setError('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    try {
      await api.delete('/users/me');
      signOut();
      navigate('/login');
    } catch {
      setError('Erro ao deletar conta.');
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #F8FAFC 0%, #EEF2F7 100%)',
      fontFamily: "'Inter', sans-serif",
    }}>

      {/* Header */}
      <div style={{
        background: '#FFFFFF', borderBottom: '1px solid #E5E7EB',
        padding: '16px 32px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <img src="/logo.png" alt="HubCash" style={{ width: '140px', objectFit: 'contain' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate('/dashboard')} style={{
            background: 'none', border: '1px solid #E5E7EB', borderRadius: '10px',
            padding: '8px 16px', fontSize: '14px', color: '#64748B', cursor: 'pointer', fontWeight: 500,
          }}>← Voltar</button>
          <button onClick={signOut} style={{
            background: 'none', border: '2px solid #e63737ff', borderRadius: '10px',
            padding: '8px 16px', fontSize: '14px', color: '#e63737ff', cursor: 'pointer', fontWeight: 400,
          }}>Sair</button>
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>

        {/* Avatar */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #0F4CFF 0%, #10B981 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 8px 20px rgba(15,76,255,0.25)',
          }}>
            <span style={{ fontSize: '32px', fontWeight: 700, color: 'white' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: '0 0 4px 0' }}>
            {user?.name}
          </h1>
          <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0 }}>{user?.email}</p>
        </div>

        {/* Card de edição */}
        <div style={{
          background: '#FFFFFF', borderRadius: '24px', padding: '40px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB',
          marginBottom: '20px',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: '0 0 24px 0' }}>
            Editar Perfil
          </h2>

          {success && (
            <div style={{
              background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A',
              padding: '14px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px',
            }}>
              ✅ {success}
            </div>
          )}

          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626',
              padding: '14px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontSize: '14px', fontWeight: 600 }}>
                Nome
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontSize: '14px', fontWeight: 600 }}>
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontSize: '14px', fontWeight: 600 }}>
                Nova Senha <span style={{ color: '#94A3B8', fontWeight: 400 }}>(deixe em branco para manter)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: '50px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  style={{
                    position: 'absolute', right: '16px', top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', color: '#94A3B8',
                    padding: 0, display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', height: '52px', borderRadius: '999px', border: 'none',
                background: loading ? '#94A3B8' : 'linear-gradient(90deg, #0F4CFF 0%, #10B981 100%)',
                color: '#FFFFFF', fontSize: '16px', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 10px 25px rgba(15,76,255,0.25)',
                transition: 'all 0.2s ease', marginTop: '4px',
              }}
            >
              {loading ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </form>
        </div>

        {/* Card de deletar conta */}
        <div style={{
          background: '#FFFFFF', borderRadius: '24px', padding: '28px 40px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #FEE2E2',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#DC2626', margin: '0 0 8px 0' }}>
            Zona de perigo
          </h2>
          <p style={{ fontSize: '14px', color: '#94A3B8', margin: '0 0 16px 0' }}>
            Ao deletar sua conta, todos os dados serão perdidos permanentemente.
          </p>

          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)} style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '10px', padding: '10px 20px', fontSize: '14px',
              fontWeight: 600, color: '#EF4444', cursor: 'pointer',
            }}>
              Deletar minha conta
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{
                flex: 1, height: '44px', borderRadius: '10px', border: '1px solid #E5E7EB',
                background: 'white', fontSize: '14px', fontWeight: 600, color: '#64748B', cursor: 'pointer',
              }}>Cancelar</button>
              <button onClick={handleDelete} style={{
                flex: 1, height: '44px', borderRadius: '10px', border: 'none',
                background: '#EF4444', fontSize: '14px', fontWeight: 600, color: 'white', cursor: 'pointer',
              }}>Confirmar exclusão</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}