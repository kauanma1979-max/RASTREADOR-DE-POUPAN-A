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
  EyeOff 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './utils';

interface Lancamento {
  id: string;
  mes: number;
  valor: number;
  data: string;
}

const CRONOGRAMA = [
  { mes: 1, valor: 75, nome: 'Janeiro' },
  { mes: 2, valor: 100, nome: 'Fevereiro' },
  { mes: 3, valor: 125, nome: 'Março' },
  { mes: 4, valor: 150, nome: 'Abril' },
  { mes: 5, valor: 175, nome: 'Maio' },
  { mes: 6, valor: 200, nome: 'Junho' },
  { mes: 7, valor: 225, nome: 'Julho' },
  { mes: 8, valor: 250, nome: 'Agosto' },
  { mes: 9, valor: 275, nome: 'Setembro' },
  { mes: 10, valor: 300, nome: 'Outubro' },
  { mes: 11, valor: 325, nome: 'Novembro' },
  { mes: 12, valor: 300, nome: 'Dezembro' }
];

const META_TOTAL = 2500;

export default function App() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const cache = localStorage.getItem('poupanca_data_cache');
    if (cache) {
      try {
        const parsed = JSON.parse(cache);
        if (Array.isArray(parsed)) {
          // Sanitize data to ensure numbers
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
  };

  const handleDeleteLancamento = (id: string) => {
    const newLancamentos = lancamentos.filter(l => l.id !== id);
    setLancamentos(newLancamentos);
    localStorage.setItem('poupanca_data_cache', JSON.stringify(newLancamentos));
  };

  const handleExportBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      lancamentos: lancamentos,
      version: '2.0-react'
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `poupanca_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
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
            localStorage.setItem('poupanca_data_cache', JSON.stringify(content.lancamentos));
            alert('✅ Backup restaurado com sucesso!');
          }
        } else {
          alert('❌ Arquivo de backup inválido.');
        }
      } catch (err) {
        alert('❌ Erro ao ler o arquivo JSON.');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  const totalPoupado = useMemo(() => lancamentos.reduce((acc, curr) => acc + Number(curr.valor), 0), [lancamentos]);
  const progressoTotal = (totalPoupado / META_TOTAL) * 100;
  const mesesConcluidos = useMemo(() => {
    return CRONOGRAMA.filter(item => {
      const totalMes = lancamentos.filter(l => Number(l.mes) === Number(item.mes)).reduce((acc, curr) => acc + Number(curr.valor), 0);
      return totalMes >= item.valor;
    }).length;
  }, [lancamentos]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Background patterns */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-10">
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

        {/* Main Content */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Months Listing */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
              <ChartBar className="w-6 h-6 text-blue-600" />
              Cronograma de Metas
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CRONOGRAMA.map((item, idx) => (
                <MonthCard 
                  key={item.mes}
                  item={item}
                  lancamentos={lancamentos.filter(l => l.mes === item.mes)}
                  onAdd={handleAddLancamento}
                  onDelete={handleDeleteLancamento}
                  index={idx}
                />
              ))}
            </div>
          </div>

          {/* Sidebar / Settings / Summary */}
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
                        setLancamentos([]);
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
  
  const totalPoupado = lancamentos.reduce((acc, curr) => acc + Number(curr.valor), 0);
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
          <p className="text-xs text-slate-500">Mês {item.mes}</p>
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
}

function SummaryItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500 font-medium">{label}</span>
      <span className="text-xs font-bold text-slate-800">{value}</span>
    </div>
  );
}

