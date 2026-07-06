import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';
import jsPDF from 'jspdf';
import { useNavigate } from 'react-router-dom';

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
  const { showToast } = useToast();
  const navigate = useNavigate();
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
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ estado do modal de confirmação de exclusão
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const categories = {
    INCOME: ['Salário', 'Freelance', 'Investimentos', 'Presente', 'Outros'],
    EXPENSE: ['Alimentação', 'Academia', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Moradia', 'Outros'],
  };

  useEffect(() => { fetchData(); }, [month, year]);

  // Fecha os modais com Esc e trava o scroll do fundo enquanto algum está aberto
  useEffect(() => {
    if (!showModal && !deletingTransaction) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowModal(false);
        if (!deleting) setDeletingTransaction(null);
      }
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [showModal, deletingTransaction, deleting]);

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
    setErrors({});
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
    setErrors({});
    setShowModal(true);
  }

  function handleAmountChange(raw: string) {
    // aceita só dígitos e vírgula/ponto, evita letras/símbolos por engano
    const clean = raw.replace(/[^\d,.]/g, '').replace(',', '.');
    setForm(f => ({ ...f, amount: clean }));
    setErrors(er => ({ ...er, amount: '' }));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Informe um título';
    if (!form.amount || parseFloat(form.amount) <= 0) errs.amount = 'Informe um valor válido';
    if (!form.category) errs.category = 'Selecione uma categoria';
    if (!form.date) errs.date = 'Selecione uma data';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const data = { ...form, amount: parseFloat(form.amount) };
      if (editingTransaction) {
        await api.patch(`/transactions/${editingTransaction.id}`, data);
        showToast('Transação atualizada com sucesso!', 'success');
      } else {
        await api.post('/transactions', data);
        showToast('Transação criada com sucesso!', 'success');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setErrors({ submit: 'Erro ao salvar. Tente novamente.' });
      showToast('Não foi possível salvar a transação.', 'error');
    } finally {
      setSaving(false);
    }
  }

  // ✅ abre o modal de confirmação em vez do confirm() nativo
  function openDeleteModal(t: Transaction) {
    setDeletingTransaction(t);
  }

  // ✅ executa a exclusão de fato, chamada pelo botão do modal
  async function confirmDelete() {
    if (!deletingTransaction) return;
    setDeleting(true);
    try {
      await api.delete(`/transactions/${deletingTransaction.id}`);
      showToast('Transação excluída.', 'success');
      setDeletingTransaction(null);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Não foi possível excluir a transação.', 'error');
    } finally {
      setDeleting(false);
    }
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

  // ✅ adiciona essa função antes do generatePDF
  function getPDFValueFontSize(value: number): number {
    const formatted = formatCurrency(value);
    if (formatted.length > 12) return 7;
    if (formatted.length > 10) return 8;
    return 9;
  }

  // ✅ Função de gerar relatório PDF
  function generatePDF() {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Cabeçalho
    doc.setFillColor(15, 76, 255);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('HubCash', 14, 18);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Relatório Financeiro — ${months[month - 1]} ${year}`, 14, 30);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - 14, 30, { align: 'right' });

    // Info do usuário
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(11);
    doc.text(`Usuário: ${user?.name}`, 14, 52);

    // Cards resumo
    let y = 65;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Resumo do Mês', 14, y);
    y += 10;

    // Saldo
    doc.setFillColor(240, 245, 255);
    doc.roundedRect(14, y, pageWidth - 28, 28, 4, 4, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Saldo', 22, y + 10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 76, 255);
    doc.setFontSize(14);
    doc.text(formatCurrency(summary.balance), 22, y + 22);
    y += 36;

    // Entradas e Saídas lado a lado
    const halfWidth = (pageWidth - 28) / 2 - 4;
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(14, y, halfWidth, 28, 4, 4, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Entradas', 22, y + 10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(13);
    doc.text(formatCurrency(summary.income), 22, y + 22);

    doc.setFillColor(254, 242, 242);
    doc.roundedRect(14 + halfWidth + 8, y, halfWidth, 28, 4, 4, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Saídas', 14 + halfWidth + 16, y + 10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(239, 68, 68);
    doc.setFontSize(13);
    doc.text(formatCurrency(summary.expense), 14 + halfWidth + 16, y + 22);
    y += 44;

    // Título da lista
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Transações', 14, y);
    y += 8;

    // Cabeçalho da tabela — ✅ sem coluna TIPO
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, pageWidth - 28, 10, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('DATA', 18, y + 7);
    doc.text('TÍTULO', 50, y + 7);
    doc.text('CATEGORIA', 115, y + 7);
    doc.text('VALOR', 165, y + 7);
    y += 14;

    // Linhas da tabela — ✅ sem coluna TIPO
    if (transactions.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text('Nenhuma transação neste mês.', 14, y + 8);
    } else {
      transactions.forEach((t, i) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        if (i % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, y - 4, pageWidth - 28, 12, 'F');
        }

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        doc.text(formatDate(t.date), 18, y + 4);
        doc.text(t.title.length > 28 ? t.title.substring(0, 28) + '...' : t.title, 50, y + 4);
        doc.text(t.category, 115, y + 4);

        // ✅ apenas valor, alinhado à direita
        if (t.type === 'INCOME') {
          doc.setFontSize(getPDFValueFontSize(t.amount));
          doc.setTextColor(16, 185, 129);
          doc.text(`+${formatCurrency(t.amount)}`, 165, y + 4);
        } else {
          doc.setFontSize(getPDFValueFontSize(t.amount));
          doc.setTextColor(239, 68, 68);
          doc.text(`-${formatCurrency(t.amount)}`, 165, y + 4);
        }

        y += 12;
      });
    }

    // Rodapé
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFillColor(241, 245, 249);
    doc.rect(0, pageHeight - 16, pageWidth, 16, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('HubCash — Controle Financeiro Inteligente', 14, pageHeight - 6);
    doc.text(`${months[month - 1]} ${year}`, pageWidth - 14, pageHeight - 6, { align: 'right' });

    doc.save(`hubcash-relatorio-${months[month - 1].toLowerCase()}-${year}.pdf`);
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
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
          opacity: 0.6;
        }
        input:focus, select:focus {
          border-color: #0F4CFF !important;
          box-shadow: 0 0 0 3px rgba(15,76,255,0.1);
        }
        /* Barra de rolagem customizada da lista de transações */
        .transactions-scroll {
          scrollbar-width: thin;
          scrollbar-color: #CBD5E1 transparent;
        }
        .transactions-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .transactions-scroll::-webkit-scrollbar-track {
          background: transparent;
          margin: 8px 0;
        }
        .transactions-scroll::-webkit-scrollbar-thumb {
          background-color: #CBD5E1;
          border-radius: 8px;
        }
        .transactions-scroll::-webkit-scrollbar-thumb:hover {
          background-color: #94A3B8;
        }
        .transaction-row {
          transition: background 0.15s ease;
        }
        .transaction-row:hover {
          background: #F8FAFC;
        }
      `}</style>

      {/* Header */}
      <div style={{
        background: '#FFFFFF', borderBottom: '1px solid #E5E7EB',
        padding: '16px 32px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <img src="/logo.png" alt="HubCash" style={{ width: '140px', objectFit: 'contain' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#334155', fontSize: '14px', fontWeight: 500 }}>Olá, {user?.name}!</span>
          <button onClick={() => navigate('/profile')} style={{
            background: 'none', border: '1px solid #E5E7EB', borderRadius: '10px',
            padding: '8px 16px', fontSize: '14px', color: '#64748B', cursor: 'pointer', fontWeight: 500,
          }}>Meu Perfil</button>
          <button onClick={signOut} style={{
            background: 'none', border: '2px solid #e63737ff', borderRadius: '10px',
            padding: '8px 16px', fontSize: '14px', color: '#e63737ff', cursor: 'pointer', fontWeight: 400,
          }}>Sair</button>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 20px' }}>

        {/* Navegação de mês */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '28px' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
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
          <div style={{ padding: '22px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>Transações</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: '#94A3B8' }}>{transactions.length} {transactions.length === 1 ? 'item' : 'itens'}</span>
              <button onClick={generatePDF} style={{
                background: 'none', border: '1px solid #E5E7EB', borderRadius: '10px',
                padding: '8px 16px', fontSize: '13px', fontWeight: 600,
                color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                📄 Relatório PDF
              </button>
              <button onClick={openCreate} style={{
                background: 'linear-gradient(90deg, #0F4CFF 0%, #10B981 100%)',
                border: 'none', borderRadius: '10px', padding: '8px 16px',
                fontSize: '13px', fontWeight: 600, color: 'white', cursor: 'pointer',
              }}>+ Nova transação</button>
            </div>
          </div>

          {/* ✅ Container com scroll — max-height define quantos itens aparecem antes de rolar */}
          <div className="transactions-scroll" style={{ maxHeight: '480px', overflowY: 'auto', paddingRight: '4px' }}>
            {loading ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#94A3B8' }}>Carregando...</div>
            ) : transactions.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#94A3B8' }}>
                <p style={{ fontSize: '32px', margin: '0 0 8px 0' }}>📭</p>
                <p style={{ margin: 0, fontSize: '15px' }}>Nenhuma transação neste mês</p>
              </div>
            ) : (
              transactions.map((t, i) => (
                <div
                  key={t.id}
                  className="transaction-row"
                  style={{
                    padding: '18px 24px', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: i < transactions.length - 1 ? '1px solid #F1F5F9' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '12px',
                      background: t.type === 'INCOME' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                      flexShrink: 0,
                    }}>
                      {t.type === 'INCOME' ? '↑' : '↓'}
                    </div>
                    <div>
                      <p style={{ margin: '0 0 3px 0', fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>{t.title}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>{t.category} · {formatDate(t.date)}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: t.type === 'INCOME' ? '#10B981' : '#EF4444', minWidth: '90px', textAlign: 'right' }}>
                      {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                    </span>
                    <button onClick={() => openEdit(t)} style={{
                      background: '#F1F5F9', border: 'none', borderRadius: '8px',
                      padding: '6px 12px', fontSize: '12px', cursor: 'pointer', color: '#64748B', fontWeight: 500,
                    }}>Editar</button>
                    <button onClick={() => openDeleteModal(t)} style={{
                      background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '8px',
                      padding: '6px 12px', fontSize: '12px', cursor: 'pointer', color: '#EF4444', fontWeight: 500,
                    }}>Excluir</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de criação/edição */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px', backdropFilter: 'blur(2px)',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#FFFFFF', borderRadius: '24px', padding: '32px',
              width: '100%', maxWidth: '460px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.2)',
              animation: 'slideUp 0.2s ease-out',
              maxHeight: '90vh', overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>
                {editingTransaction ? 'Editar transação' : 'Nova transação'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: '#F1F5F9', border: 'none', borderRadius: '8px',
                  width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px',
                  color: '#64748B', lineHeight: 1,
                }}
              >×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Tipo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {(['INCOME', 'EXPENSE'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setForm(f => ({ ...f, type, category: '' }))}
                    style={{
                      padding: '12px', borderRadius: '10px', border: '2px solid',
                      borderColor: form.type === type ? (type === 'INCOME' ? '#10B981' : '#EF4444') : '#E5E7EB',
                      background: form.type === type ? (type === 'INCOME' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)') : 'white',
                      color: form.type === type ? (type === 'INCOME' ? '#10B981' : '#EF4444') : '#64748B',
                      cursor: 'pointer', fontWeight: 600, fontSize: '14px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {type === 'INCOME' ? '↑ Entrada' : '↓ Saída'}
                  </button>
                ))}
              </div>



              {/* Título */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  Título
                </label>
                <input
                  autoFocus
                  style={{ ...inputStyle, borderColor: errors.title ? '#EF4444' : '#E5E7EB' }}
                  value={form.title}
                  onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setErrors(er => ({ ...er, title: '' })); }}
                  placeholder="Ex: Salário"
                />
                {errors.title && <span style={{ color: '#EF4444', fontSize: '12px' }}>{errors.title}</span>}
              </div>

              {/* Valor + Data lado a lado */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    Valor
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                      color: '#94A3B8', fontSize: '14px', pointerEvents: 'none',
                    }}>R$</span>
                    <input
                      style={{ ...inputStyle, paddingLeft: '38px', borderColor: errors.amount ? '#EF4444' : '#E5E7EB' }}
                      inputMode="decimal"
                      value={form.amount}
                      onChange={e => handleAmountChange(e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                  {errors.amount && <span style={{ color: '#EF4444', fontSize: '12px' }}>{errors.amount}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    Data
                  </label>
                  <div
                    onClick={(e) => {
                      const input = e.currentTarget.querySelector('input');
                      // showPicker existe nos navegadores modernos (Chrome, Edge)
                      // @ts-ignore
                      input?.showPicker?.();
                    }}
                    style={{
                      ...inputStyle,
                      display: 'flex', alignItems: 'center', gap: '8px',
                      cursor: 'pointer', borderColor: errors.date ? '#EF4444' : '#E5E7EB',
                    }}
                  >
                    <span style={{ color: '#94A3B8' }}>📅</span>
                    <input
                      type="date"
                      value={form.date}
                      onChange={e => { setForm(f => ({ ...f, date: e.target.value })); setErrors(er => ({ ...er, date: '' })); }}
                      style={{
                        border: 'none', outline: 'none', background: 'transparent',
                        fontSize: '14px', color: '#111827', width: '100%', cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                  {errors.date && <span style={{ color: '#EF4444', fontSize: '12px' }}>{errors.date}</span>}
                </div>
              </div>

              {/* Categoria */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  Categoria
                </label>
                <select
                  style={{ ...inputStyle, cursor: 'pointer', borderColor: errors.category ? '#EF4444' : '#E5E7EB' }}
                  value={form.category}
                  onChange={e => { setForm(f => ({ ...f, category: e.target.value })); setErrors(er => ({ ...er, category: '' })); }}
                >
                  <option value="">Selecione...</option>
                  {categories[form.type].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <span style={{ color: '#EF4444', fontSize: '12px' }}>{errors.category}</span>}
              </div>
            </div>

            {errors.submit && (
              <p style={{ color: '#EF4444', fontSize: '13px', marginTop: '12px', textAlign: 'center' }}>
                {errors.submit}
              </p>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                style={{
                  flex: 1, height: '48px', borderRadius: '10px', border: '1px solid #E5E7EB',
                  background: 'white', fontSize: '14px', fontWeight: 600, color: '#64748B', cursor: 'pointer',
                }}
              >Cancelar</button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 1, height: '48px', borderRadius: '10px', border: 'none',
                  background: saving ? '#94A3B8' : 'linear-gradient(90deg, #0F4CFF 0%, #10B981 100%)',
                  fontSize: '14px', fontWeight: 600, color: 'white',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                {saving ? 'Salvando...' : (editingTransaction ? 'Salvar' : 'Criar')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Modal de confirmação de exclusão */}
      {deletingTransaction && (
        <div
          onClick={() => !deleting && setDeletingTransaction(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1100, padding: '20px', backdropFilter: 'blur(2px)',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#FFFFFF', borderRadius: '24px', padding: '32px',
              width: '100%', maxWidth: '380px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.2)',
              animation: 'slideUp 0.2s ease-out',
              textAlign: 'center',
            }}
          >
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(239,68,68,0.1)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '24px', margin: '0 auto 16px',
            }}>🗑️</div>

            <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
              Excluir transação?
            </h2>
            <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#64748B' }}>
              Tem certeza que deseja excluir
            </p>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>
              "{deletingTransaction.title}"?
            </p>
            <p style={{ margin: '0 0 24px 0', fontSize: '12px', color: '#94A3B8' }}>
              Essa ação não pode ser desfeita.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setDeletingTransaction(null)}
                disabled={deleting}
                style={{
                  flex: 1, height: '48px', borderRadius: '10px', border: '1px solid #E5E7EB',
                  background: 'white', fontSize: '14px', fontWeight: 600, color: '#64748B',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                }}
              >Cancelar</button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                style={{
                  flex: 1, height: '48px', borderRadius: '10px', border: 'none',
                  background: deleting ? '#94A3B8' : '#EF4444',
                  fontSize: '14px', fontWeight: 600, color: 'white',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                }}
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}