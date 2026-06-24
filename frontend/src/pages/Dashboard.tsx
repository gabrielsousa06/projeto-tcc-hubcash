import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: string;
}

interface Summary {
  income: number;
  expense: number;
  balance: number;
}

interface TransactionForm {
  title: string;
  amount: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: string;
}

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({ income: 0, expense: 0, balance: 0 });
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [form, setForm] = useState<TransactionForm>({
    title: '', amount: '', type: 'INCOME', category: '', date: '',
  });

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const categories = {
    INCOME: ['Salário', 'Freelance', 'Investimentos', 'Presente', 'Outros'],
    EXPENSE: ['Alimentação', 'Academia', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Moradia', 'Outros'],
  };

  useEffect(() => { fetchData(); }, [month, year]);

  async function fetchData() {
    setLoading(true);
    try {
      const [transRes, sumRes] = await Promise.all([
        api.get(`/transactions?month=${month}&year=${year}`),
        api.get(`/transactions/summary?month=${month}&year=${year}`),
      ]);
      setTransactions(transRes.data);
      setSummary(sumRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingTransaction(null);
    setForm({ title: '', amount: '', type: 'INCOME', category: '', date: '' });
    setShowModal(true);
  }

  function openEdit(t: Transaction) {
    setEditingTransaction(t);
    setForm({
      title: t.title,
      amount: String(t.amount),
      type: t.type,
      category: t.category,
      date: t.date.split('T')[0],
    });
    setShowModal(true);
  }

  async function handleSave() {
    try {
      const data = { ...form, amount: parseFloat(form.amount) };
      if (editingTransaction) {
        await api.patch(`/transactions/${editingTransaction.id}`, data);
      } else {
        await api.post('/transactions', data);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja deletar esta transação?')) return;
    await api.delete(`/transactions/${id}`);
    fetchData();
  }

  function formatCurrency(value: number) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  }

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const inputStyle = {
    width: '100%',
    height: '48px',
    borderRadius: '10px',
    border: '1px solid #E5E7EB',
    padding: '0 14px',
    fontSize: '14px',
    color: '#111827',
    outline: 'none',
    boxSizing: 'border-box' as const,
    background: '#F8FAFC',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F8FAFC 0%, #EEF2F7 100%)', fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div style={{
        background: '#FFFFFF', borderBottom: '1px solid #E5E7EB',
        padding: '16px 32px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <img src="/logo.png" alt="HubCash" style={{ width: '140px', objectFit: 'contain' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#334155', fontSize: '14px', fontWeight: 500 }}>Olá, {user?.name}!</span>
          <button onClick={signOut} style={{
            background: 'none', border: '2px solid #e63737ff', borderRadius: '10px',
            padding: '8px 16px', fontSize: '14px', color: '#e63737ff', cursor: 'pointer', fontWeight: 400,
          }}>Sair</button>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 20px' }}>

        {/* Navegação de mês */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '32px' }}>
          <button onClick={prevMonth} style={{
            background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '10px',
            width: '40px', height: '40px', fontSize: '18px', cursor: 'pointer', color: '#334155',
          }}>‹</button>
          <span style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', minWidth: '180px', textAlign: 'center' }}>
            {months[month - 1]} {year}
          </span>
          <button onClick={nextMonth} style={{
            background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '10px',
            width: '40px', height: '40px', fontSize: '18px', cursor: 'pointer', color: '#334155',
          }}>›</button>
        </div>

        {/* Cards resumo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0F4CFF 0%, #10B981 100%)',
            borderRadius: '20px', padding: '24px', color: 'white',
            boxShadow: '0 10px 25px rgba(15,76,255,0.2)',
          }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', opacity: 0.85, fontWeight: 500 }}>Saldo do Mês</p>
            <p style={{ margin: 0, fontSize: '26px', fontWeight: 700 }}>{formatCurrency(summary.balance)}</p>
          </div>
          <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#64748B', fontWeight: 500 }}>↑ Entradas</p>
            <p style={{ margin: 0, fontSize: '26px', fontWeight: 700, color: '#10B981' }}>{formatCurrency(summary.income)}</p>
          </div>
          <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#64748B', fontWeight: 500 }}>↓ Saídas</p>
            <p style={{ margin: 0, fontSize: '26px', fontWeight: 700, color: '#EF4444' }}>{formatCurrency(summary.expense)}</p>
          </div>
        </div>

        {/* Lista de transações */}
        <div style={{ background: '#FFFFFF', borderRadius: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>Transações</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: '#94A3B8' }}>{transactions.length} {transactions.length === 1 ? 'item' : 'itens'}</span>
              <button onClick={openCreate} style={{
                background: 'linear-gradient(90deg, #0F4CFF 0%, #10B981 100%)',
                border: 'none', borderRadius: '10px', padding: '8px 16px',
                fontSize: '13px', fontWeight: 600, color: 'white', cursor: 'pointer',
              }}>+ Nova transação</button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94A3B8' }}>Carregando...</div>
          ) : transactions.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94A3B8' }}>
              <p style={{ fontSize: '32px', margin: '0 0 8px 0' }}>📭</p>
              <p style={{ margin: 0, fontSize: '15px' }}>Nenhuma transação neste mês</p>
            </div>
          ) : (
            transactions.map((t, i) => (
              <div key={t.id} style={{
                padding: '16px 24px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: i < transactions.length - 1 ? '1px solid #F1F5F9' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '12px',
                    background: t.type === 'INCOME' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                  }}>
                    {t.type === 'INCOME' ? '↑' : '↓'}
                  </div>
                  <div>
                    <p style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>{t.title}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>{t.category} · {formatDate(t.date)}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: t.type === 'INCOME' ? '#10B981' : '#EF4444' }}>
                    {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                  <button onClick={() => openEdit(t)} style={{
                    background: '#F1F5F9', border: 'none', borderRadius: '8px',
                    padding: '6px 12px', fontSize: '12px', cursor: 'pointer', color: '#64748B', fontWeight: 500,
                  }}>Editar</button>
                  <button onClick={() => handleDelete(t.id)} style={{
                    background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '8px',
                    padding: '6px 12px', fontSize: '12px', cursor: 'pointer', color: '#EF4444', fontWeight: 500,
                  }}>Excluir</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px',
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: '24px', padding: '40px',
            width: '100%', maxWidth: '480px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
          }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>
              {editingTransaction ? 'Editar transação' : 'Nova transação'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Tipo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {(['INCOME', 'EXPENSE'] as const).map(type => (
                  <button key={type} onClick={() => setForm(f => ({ ...f, type, category: '' }))} style={{
                    padding: '12px', borderRadius: '10px', border: '2px solid',
                    borderColor: form.type === type ? (type === 'INCOME' ? '#10B981' : '#EF4444') : '#E5E7EB',
                    background: form.type === type ? (type === 'INCOME' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)') : 'white',
                    color: form.type === type ? (type === 'INCOME' ? '#10B981' : '#EF4444') : '#64748B',
                    cursor: 'pointer', fontWeight: 600, fontSize: '14px',
                  }}>
                    {type === 'INCOME' ? '↑ Entrada' : '↓ Saída'}
                  </button>
                ))}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>Título</label>
                <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Salário" />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>Valor (R$)</label>
                <input style={inputStyle} type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0,00" />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>Categoria</label>
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="">Selecione...</option>
                  {categories[form.type].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>Data</label>
                <input style={inputStyle} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
              <button onClick={() => setShowModal(false)} style={{
                flex: 1, height: '48px', borderRadius: '10px', border: '1px solid #E5E7EB',
                background: 'white', fontSize: '14px', fontWeight: 600, color: '#64748B', cursor: 'pointer',
              }}>Cancelar</button>
              <button onClick={handleSave} style={{
                flex: 1, height: '48px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(90deg, #0F4CFF 0%, #10B981 100%)',
                fontSize: '14px', fontWeight: 600, color: 'white', cursor: 'pointer',
              }}>{editingTransaction ? 'Salvar' : 'Criar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}