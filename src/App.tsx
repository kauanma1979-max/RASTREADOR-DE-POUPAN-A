/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  PiggyBank, 
  Target, 
  CalendarCheck, 
  Plus, 
  Trash2, 
  Settings, 
  Download, 
  ChartBar, 
  Percent, 
  CheckCircle2, 
  RefreshCw, 
  Eye, 
  EyeOff,
  Trophy,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar
} from 'recharts';
import confetti from 'canvas-confetti';
import { cn } from './utils';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-2xl backdrop-blur-md">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">{label}</p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-2">
                <div 
                  className="w-1.5 h-1.5 rounded-full" 
                  style={{ backgroundColor: entry.name === 'acumulado' ? '#3b82f6' : '#94a3b8' }} 
                />
                <span className="text-slate-300 text-[11px] font-medium">
                  {entry.name === 'acumulado' ? 'Patrimônio' : 'Meta Esperada'}
                </span>
              </div>
              <span className="text-white text-xs font-black">
                R$ {entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
        {payload.length > 1 && (
          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-slate-500 text-[9px] font-black uppercase">Status</span>
            <span className={cn(
              "text-[9px] font-black px-1.5 py-0.5 rounded",
              payload[0].value >= payload[1].value ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"
            )}>
              {payload[0].value >= payload[1].value ? 'EM DIA' : 'PENDENTE'}
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

interface Lancamento {
  id: string;
  mes: number;
  valor: number;
  data: string;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

const CRONOGRAMA = [
  { mes: 1, valor: 75, nome: 'Jan' },
  { mes: 2, valor: 100, nome: 'Fev' },
  { mes: 3, valor: 125, nome: 'Mar' },
  { mes: 4, valor: 150, nome: 'Abr' },
  { mes: 5, valor: 175, nome: 'Mai' },
  { mes: 6, valor: 200, nome: 'Jun' },
  { mes: 7, valor: 225, nome: 'Jul' },
  { mes: 8, valor: 250, nome: 'Ago' },
  { mes: 9, valor: 275, nome: 'Set' },
  { mes: 10, valor: 300, nome: 'Out' },
  { mes: 11, valor: 325, nome: 'Nov' },
  { mes: 12, valor: 300, nome: 'Dez' }
];

const META_TOTAL = 2500;

export default function App() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [celebratedMonths, setCelebratedMonths] = useState<number[]>(() => {
    const saved = localStorage.getItem('celebrated_months');
    return saved ? JSON.parse(saved) : [];
  });
  const [showSettings, setShowSettings] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showCelebrationModal, setShowCelebrationModal] = useState<{ show: boolean, month: string } | null>(null);

  useEffect(() => {
    const cache = localStorage.getItem('poupanca_data_cache');
    if (cache) {
      try {
        const parsed = JSON.parse(cache);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.map((l: any) => ({
            ...l,
            mes: Number(l.mes),
            valor: Number(l.valor)
          }));
          setLancamentos(sanitized);
        }
      } catch (e) {
        console.error('Error parsing cache:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('celebrated_months', JSON.stringify(celebratedMonths));
  }, [celebratedMonths]);

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const checkCelebration = (mes: number, currentLancamentos: Lancamento[]) => {
    if (celebratedMonths.includes(mes)) return;

    const meta = CRONOGRAMA.find(c => c.mes === mes);
    if (!meta) return;

    const totalMes = currentLancamentos
      .filter(l => Number(l.mes) === mes)
      .reduce((acc, curr) => acc + Number(curr.valor), 0);

    if (totalMes >= meta.valor) {
      setCelebratedMonths(prev => [...prev, mes]);
      triggerCelebration(meta.nome);
    }
  };

  const triggerCelebration = (monthName: string) => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2563eb', '#9333ea', '#10b981', '#f59e0b']
    });
    setShowCelebrationModal({ show: true, month: monthName });
    addToast(`Parabéns! Meta de ${monthName} atingida! 🥳`, 'success');
  };

  const handleAddLancamento = (mes: number, valor: number) => {
    const newLancamento: Lancamento = {
      id: crypto.randomUUID(),
      mes,
      valor,
      data: new Date().toLocaleDateString('pt-BR')
    };

    const newLancamentos = [...lancamentos, newLancamento];
    setLancamentos(newLancamentos);
    localStorage.setItem('poupanca_data_cache', JSON.stringify(newLancamentos));
    addToast('Lançamento adicionado!', 'info');
    
    checkCelebration(mes, newLancamentos);
    
    // Total progress celebration
    const total = newLancamentos.reduce((acc, curr) => acc + Number(curr.valor), 0);
    if (total >= META_TOTAL && !celebratedMonths.includes(100)) {
      setCelebratedMonths(prev => [...prev, 100]);
      triggerCelebration('Meta Total de R$ 2.500,00');
    }
  };

  const handleDeleteLancamento = (id: string) => {
    const newLancamentos = lancamentos.filter(l => l.id !== id);
    setLancamentos(newLancamentos);
    localStorage.setItem('poupanca_data_cache', JSON.stringify(newLancamentos));
    addToast('Lançamento removido', 'info');
  };

  const handleExportBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      lancamentos: lancamentos,
      celebratedMonths,
      version: '2.0-react'
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `poupanca_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    addToast('Backup exportado com sucesso!', 'success');
  };

  const handleRestoreBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target.result as string);
        if (content.lancamentos && Array.isArray(content.lancamentos)) {
          if (confirm('Deseja substituir os dados atuais pelos do backup?')) {
            setLancamentos(content.lancamentos);
            if (content.celebratedMonths) setCelebratedMonths(content.celebratedMonths);
            localStorage.setItem('poupanca_data_cache', JSON.stringify(content.lancamentos));
            addToast('Backup restaurado!', 'success');
          }
        } else {
          addToast('Arquivo de backup inválido', 'error');
        }
      } catch (err) {
        addToast('Erro ao ler arquivo JSON', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const totalPoupado = useMemo(() => {
    return lancamentos.reduce((acc, curr) => acc + Number(curr.valor), 0);
  }, [lancamentos]);

  const progressoTotal = (totalPoupado / META_TOTAL) * 100;

  const mesesConcluidos = useMemo(() => {
    return CRONOGRAMA.filter(item => {
      const totalMes = lancamentos
        .filter(l => Number(l.mes) === Number(item.mes))
        .reduce((acc, curr) => acc + Number(curr.valor), 0);
      return totalMes >= item.valor;
    }).length;
  }, [lancamentos]);

  const chartData = useMemo(() => {
    let accumulated = 0;
    return CRONOGRAMA.map(item => {
      const totalMes = lancamentos
        .filter(l => Number(l.mes) === item.mes)
        .reduce((acc, curr) => acc + Number(curr.valor), 0);
      accumulated += totalMes;
      return {
        name: item.nome,
        poupado: totalMes,
        meta: item.valor,
        acumulado: accumulated,
        metaAcumulada: CRONOGRAMA.filter(c => c.mes <= item.mes).reduce((sum, c) => sum + c.valor, 0)
      };
    });
  }, [lancamentos]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      {/* Background patterns */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-5">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[50%] h-[50%] bg-purple-500 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="mb-12 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-2"
            >
              💰 Rastreador de <span className="text-blue-600">Poupança</span>
            </motion.h1>
            <p className="text-slate-500 text-lg">Acompanhe seu progresso de R$ 2.500,00</p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button 
              onClick={() => setShowSettings(true)}
              className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all text-slate-600 hover:text-blue-600"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard 
            icon={<PiggyBank className="w-6 h-6 text-blue-600" />}
            label="Total Poupado"
            value={`R$ ${totalPoupado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            trend={`${progressoTotal.toFixed(1)}% da meta`}
            progress={progressoTotal}
            color="blue"
          />
          <StatCard 
            icon={<Target className="w-6 h-6 text-purple-600" />}
            label="Meta Restante"
            value={`R$ ${Math.max(0, META_TOTAL - totalPoupado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            trend="R$ 2.500,00 objetivo"
            color="purple"
          />
          <StatCard 
            icon={<CalendarCheck className="w-6 h-6 text-green-600" />}
            label="Meses Concluídos"
            value={`${mesesConcluidos} / 12`}
            trend="Ritmo planejado"
            color="green"
          />
          <StatCard 
            icon={<Percent className="w-6 h-6 text-orange-600" />}
            label="Conquista Total"
            value={`${Math.round(progressoTotal)}%`}
            trend="Firme no propósito"
            color="orange"
          />
        </section>

        {/* Chart Section */}
        <section className="mb-12">
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <ChartBar className="w-6 h-6 text-blue-600" />
                  Evolução do Patrimônio
                </h2>
                <p className="text-slate-400 text-sm">Visualização detalhada do seu crescimento financeiro anual</p>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">
                  <div className="w-2 h-2 rounded-full bg-blue-600" /> Acumulado
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-400 rounded-lg text-xs font-bold">
                  <div className="w-2 h-2 rounded-full bg-slate-300" /> Meta
                </div>
              </div>
            </div>

            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                    tickFormatter={(value) => `R$ ${value}`}
                    dx={-10}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ stroke: '#e2e8f0', strokeWidth: 2, strokeDasharray: '4 4' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="acumulado" 
                    name="acumulado"
                    stroke="#2563eb" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorAcumulado)" 
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="metaAcumulada" 
                    name="metaAcumulada"
                    stroke="#cbd5e1" 
                    strokeWidth={2}
                    strokeDasharray="8 8" 
                    dot={false}
                    activeDot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Months Listing */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
              <Plus className="w-6 h-6 text-blue-600" />
              Cronograma de Metas
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CRONOGRAMA.map((item, idx) => (
                <MonthCard 
                  key={`${item.mes}-${lancamentos.length}`}
                  item={item}
                  lancamentos={lancamentos.filter(l => Number(l.mes) === Number(item.mes))}
                  onAdd={handleAddLancamento}
                  onDelete={handleDeleteLancamento}
                  index={idx}
                />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold mb-4">Painel de Controle</h3>

              <div className="space-y-3 mb-6">
                <SummaryItem label="Último Lançamento" value={lancamentos.length > 0 ? lancamentos[lancamentos.length-1].data : 'Nenhum'} />
                <SummaryItem label="Meta Média Mensal" value="R$ 208,33" />
                <SummaryItem label="Status Geral" value={progressoTotal >= 100 ? 'Meta Atingida! 🏆' : 'Em andamento'} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={handleExportBackup}
                  className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Backup
                </button>
                <label className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-green-50 hover:text-green-600 transition-all shadow-sm cursor-pointer">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Restaurar
                  <input type="file" accept=".json" onChange={handleRestoreBackup} className="hidden" />
                </label>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-blue-100 font-medium mb-1">Dica de Finanças</p>
                <h4 className="text-2xl font-bold mb-4">Mantenha a Constância</h4>
                <p className="opacity-90 text-sm leading-relaxed mb-6">
                  Pequenos valores salvos todos os meses se tornam grandes objetivos realizados no fim do ano.
                </p>
                <Download className="w-12 h-12 opacity-20 absolute -bottom-2 -right-2 rotate-12 group-hover:rotate-0 transition-transform" />
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
            </div>
          </aside>
        </section>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2rem] p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">Configurações</h3>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <Trash2 className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <h4 className="text-sm font-bold mb-2">Limpar Tudo</h4>
                  <p className="text-xs text-slate-500 mb-4">Esta ação remove permanentemente todos os dados armazenados.</p>
                  <button 
                    onClick={() => {
                      if(confirm('Limpar todos os dados locais?')) {
                        localStorage.removeItem('poupanca_data_cache');
                        localStorage.removeItem('celebrated_months');
                        setLancamentos([]);
                        setCelebratedMonths([]);
                        setShowSettings(false);
                      }
                    }}
                    className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors"
                  >
                    Resetar Aplicativo
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Celebration Modal */}
      <AnimatePresence>
        {showCelebrationModal?.show && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-blue-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="relative bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-md w-full"
            >
              <div className="w-24 h-24 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-12 h-12" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-3">VOCÊ CONSEGUIU! 🎉</h3>
              <p className="text-slate-500 mb-8 leading-relaxed">
                A meta de <span className="font-bold text-blue-600">{showCelebrationModal.month}</span> foi batida! Você está cada vez mais perto dos seus sonhos financeiros.
              </p>
              <button 
                onClick={() => setShowCelebrationModal(null)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-200 transition-all transform active:scale-95"
              >
                Continuar Poupando
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toasts Container */}
      <div className="fixed bottom-6 right-6 z-[70] flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, x: 20 }}
              className={cn(
                "px-6 py-4 rounded-2xl shadow-lg border flex items-center gap-3 min-w-[280px]",
                toast.type === 'success' ? "bg-green-50 border-green-100 text-green-700" :
                toast.type === 'error' ? "bg-red-50 border-red-100 text-red-700" :
                "bg-white border-slate-100 text-slate-600"
              )}
            >
              {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : 
               toast.type === 'error' ? <XCircle className="w-5 h-5" /> : 
               <AlertCircle className="w-5 h-5" />}
              <span className="text-sm font-bold">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, trend, progress, color }: { 
  icon: React.ReactNode, 
  label: string, 
  value: string, 
  trend: string, 
  progress?: number,
  color: 'blue' | 'purple' | 'green' | 'orange'
}) {
  const colors = {
    blue: 'border-blue-100 shadow-blue-50/50',
    purple: 'border-purple-100 shadow-purple-50/50',
    green: 'border-green-100 shadow-green-50/50',
    orange: 'border-orange-100 shadow-orange-50/50',
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className={cn(
        "bg-white p-6 rounded-3xl border shadow-xl transition-all",
        colors[color]
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-slate-50 rounded-2xl">
          {icon}
        </div>
        <div className="text-right">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-black text-slate-900">{value}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, progress || 0)}%` }}
            className={cn(
              "h-full rounded-full",
              color === 'blue' ? 'bg-blue-600' :
              color === 'purple' ? 'bg-purple-600' :
              color === 'green' ? 'bg-green-600' : 'bg-orange-500'
            )}
          />
        </div>
        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{trend}</span>
      </div>
    </motion.div>
  );
}

interface MonthCardProps {
  item: typeof CRONOGRAMA[0];
  lancamentos: Lancamento[];
  onAdd: (mes: number, valor: number) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
  index: number;
}

const MonthCard: React.FC<MonthCardProps> = ({ item, lancamentos, onAdd, onDelete, index }) => {
  const [inputValue, setInputValue] = useState('');
  const [expanded, setExpanded] = useState(false);
  
  const totalPoupado = useMemo(() => {
    return lancamentos.reduce((acc, curr) => acc + Number(curr.valor), 0);
  }, [lancamentos]);
  
  const isCompleted = totalPoupado >= item.valor;
  const percentual = (totalPoupado / item.valor) * 100;

  const handleAdd = () => {
    const val = parseFloat(inputValue);
    if (!isNaN(val) && val > 0) {
      onAdd(item.mes, val);
      setInputValue('');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "bg-white rounded-3xl border border-slate-200 p-6 flex flex-col shadow-sm hover:shadow-md transition-all h-fit",
        isCompleted && "border-green-200 bg-green-50/30"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-lg font-bold">{item.nome}</h4>
          <p className="text-xs text-slate-500">Cronograma {item.mes}</p>
        </div>
        {isCompleted ? (
          <div className="bg-green-500 text-white p-2 rounded-full shadow-lg shadow-green-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        ) : (
          <div className="bg-slate-100 text-slate-400 p-2 rounded-full">
            <CalendarCheck className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-slate-50 rounded-2xl">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Meta</p>
          <p className="text-sm font-bold text-slate-700">R$ {item.valor.toFixed(2)}</p>
        </div>
        <div className={cn("p-3 rounded-2xl", isCompleted ? "bg-green-100/50" : "bg-blue-50")}>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Poupado</p>
          <p className={cn("text-sm font-bold", isCompleted ? "text-green-700" : "text-blue-700")}>
            R$ {totalPoupado.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-bold text-slate-400">Progresso</span>
          <span className={cn("text-[10px] font-bold", isCompleted ? "text-green-600" : "text-blue-600")}>
            {Math.round(percentual)}%
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, percentual)}%` }}
            className={cn("h-full rounded-full transition-colors", isCompleted ? "bg-green-500" : "bg-blue-500")}
          />
        </div>
      </div>

      {/* List of partial launches */}
      <AnimatePresence>
        {lancamentos.length > 0 && (
          <div className="space-y-2 mb-4">
            <button 
              onClick={() => setExpanded(!expanded)}
              className="w-full py-1 text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between hover:text-slate-600 transition-colors"
            >
              <span>Histórico ({lancamentos.length})</span>
              {expanded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
            {expanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-white/50 rounded-xl divide-y divide-slate-100"
              >
                {lancamentos.map((l) => (
                  <div key={l.id} className="p-2 flex items-center justify-between group">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">R$ {l.valor.toFixed(2)}</span>
                      <span className="text-[9px] text-slate-400">{l.data}</span>
                    </div>
                    <button 
                      onClick={() => onDelete(l.id)}
                      className="p-1 px-2 text-red-100 group-hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>

      <div className="mt-auto flex gap-2">
        <input 
          type="number" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Valor"
          className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button 
          onClick={handleAdd}
          className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};

function SummaryItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500 font-medium">{label}</span>
      <span className="text-xs font-bold text-slate-800">{value}</span>
    </div>
  );
}

function AlertCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}

