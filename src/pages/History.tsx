<<<<<<< HEAD
import React, { useState, useMemo } from 'react';
import { LocalDb } from '../lib/db';
import { useEquipments } from '../hooks/useEquipments';
=======
import React, { useState, useMemo, useEffect } from 'react';
import { LocalDb, getEquipmentsFromSupabase } from '../lib/db';
import { Equipment } from '../types';
>>>>>>> 71e48a44c06d50148231a4e67a1b99e65bbfe284
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  FileSpreadsheet,
  Clock, 
  User, 
  Truck
} from 'lucide-react';

export default function History() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('Todos');
  const [filterEq, setFilterEq] = useState('Todos');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

<<<<<<< HEAD
  const { equipments } = useEquipments();
=======
  const [equipments, setEquipments] = useState<Equipment[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      const data = await getEquipmentsFromSupabase();
      if (active) setEquipments(data);
    }
    load();
    return () => { active = false; };
  }, []);
>>>>>>> 71e48a44c06d50148231a4e67a1b99e65bbfe284

  // Retrieve records from database
  const records = useMemo(() => {
    return LocalDb.getRecords();
  }, []);

  const months = useMemo(() => {
    const list = new Set<string>();
    records.forEach(r => {
      list.add(r.data.substring(0, 7)); // YYYY-MM
    });
    return Array.from(list).sort((a, b) => b.localeCompare(a));
  }, [records]);

  // Filter records based on selected criteria
  const filteredRecords = useMemo(() => {
    let result = [...records];

    // Search input keyword matching
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(r => 
        r.operador.toLowerCase().includes(q) ||
        r.equipamento.toLowerCase().includes(q) ||
        r.item.toLowerCase().includes(q) ||
        (r.observacao && r.observacao.toLowerCase().includes(q))
      );
    }

    // Month filter
    if (filterMonth !== 'Todos') {
      result = result.filter(r => r.data.startsWith(filterMonth));
    }

    // Equipment filter
    if (filterEq !== 'Todos') {
      result = result.filter(r => r.equipamento.includes(filterEq));
    }

    // Status filter
    if (filterStatus !== 'Todos') {
      result = result.filter(r => r.status === filterStatus);
    }

    // Sort Chronologically order
    result.sort((a, b) => {
      const dateA = `${a.data}T${a.hora}:00`;
      const dateB = `${b.data}T${b.hora}:00`;
      return sortOrder === 'desc' 
        ? dateB.localeCompare(dateA) 
        : dateA.localeCompare(dateB);
    });

    return result;
  }, [records, searchTerm, filterMonth, filterEq, filterStatus, sortOrder]);

  // Pagination bounds calculation
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  
  const paginatedRecords = useMemo(() => {
    // Clamp paging index to within range
    const page = Math.min(currentPage, totalPages);
    const start = (page - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage, totalPages]);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handleExportCSV = () => {
    try {
      // Fast procedural conversion of filtered history into CSV string formats
      const headers = ['Data', 'Hora', 'Operador', 'Equipamento', 'Atributo Inspecionado', 'Status', 'Observacao', 'Horimetro', 'Ligando', 'Barras_Bateria'];
      const csvRows = [headers.join(',')];

      filteredRecords.forEach(r => {
        const row = [
          r.data.split('-').reverse().join('/'),
          r.hora,
          `"${r.operador.replace(/"/g, '""')}"`,
          `"${r.equipamento.replace(/"/g, '""')}"`,
          `"${r.item.replace(/"/g, '""')}"`,
          r.status,
          `"${(r.observacao || '').replace(/"/g, '""')}"`,
          r.horimetro || '',
          r.ligando || '',
          r.bateria_barras || ''
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvRows.join('\n'));
      const link = document.createElement('a');
      link.setAttribute('href', csvContent);
      link.setAttribute('download', 'tkf-logicheck-checklists.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Houve um erro técnico ao estruturar o arquivo csv.');
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 pb-24 text-white">
      
      {/* Title & Stats summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="tkf-title">Histórico Operacional</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Logs completos de conformidade. Exiba e audite registros rapidamente.
          </p>
        </div>

        {/* Action Export */}
        <button
          onClick={handleExportCSV}
          className="tkf-btn-primary h-12 px-4 rounded-xl shrink-0 gap-2 cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>EXPORTAR HISTÓRICO (CSV)</span>
        </button>
      </div>

      {/* Audit filtration panel */}
      <section className="tkf-card p-4 space-y-4">
        
        {/* Quick Search */}
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="w-4.5 h-4.5" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset page on query
            }}
            placeholder="Buscar por operador, marca da empilhadeira, item defeituoso..."
            className="tkf-input pl-10 text-xs"
          />
        </div>

        {/* Modular Horizontal Selectors Scroll */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          
          {/* Month selective */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mês</span>
            <select
              value={filterMonth}
              onChange={(e) => {
                setFilterMonth(e.target.value);
                setCurrentPage(1);
              }}
              className="tkf-select h-12 text-xs"
            >
              <option value="Todos">Todos os meses</option>
              {months.map(m => (
                <option key={m} value={m}>
                  {m.split('-')[1]}/{m.split('-')[0]}
                </option>
              ))}
            </select>
          </div>

          {/* Forklift Selector */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Empilhadeira</span>
            <select
              value={filterEq}
              onChange={(e) => {
                setFilterEq(e.target.value);
                setCurrentPage(1);
              }}
              className="tkf-select h-12 text-xs"
            >
              <option value="Todos">Todas as empilhadeiras</option>
              {equipments.map(eq => (
                <option key={eq.id} value={eq.patrimonio}>
                  {eq.patrimonio} - {eq.tipo}
                </option>
              ))}
            </select>
          </div>

          {/* Status selective */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</span>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="tkf-select h-12 text-xs"
            >
              <option value="Todos">Todos os status</option>
              <option value="OK">OK (Conforme)</option>
              <option value="NOK">NOK (Exceção/Avaria)</option>
            </select>
          </div>

          {/* Sorting Direction */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ordenação</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
              className="tkf-select h-12 text-xs"
            >
              <option value="desc">Mais recentes primeiro</option>
              <option value="asc">Mais antigas primeiro</option>
            </select>
          </div>

        </div>

      </section>

      {/* Main Grid Log View - Mobile Optimized (Cards on mobile, tabular on desktop) */}
      <section className="tkf-card overflow-hidden bg-transparent border-none sm:bg-[#0e131f] sm:border sm:border-white/5">
        
        {/* Mobile Grid Layout Cards */}
        <div className="sm:hidden space-y-3">
          {paginatedRecords.length > 0 ? (
            paginatedRecords.map((rec) => {
              const isOk = rec.status === 'OK';
              return (
                <div 
                  key={rec.id} 
                  className={`bg-[#131a2c]/60 border rounded-lg p-3.5 space-y-3 relative overflow-hidden transition-all ${
                    isOk ? 'border-white/5' : 'border-red-500/20 bg-red-500/5'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 max-w-[70%]">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#4364f7]" />
                        <span>{rec.data.split('-').reverse().join('/')} &bull; {rec.hora}</span>
                      </span>
                      <h4 className="text-xs font-bold text-slate-200">{rec.item}</h4>
                    </div>

                    {/* Status Pill matching corporate standards */}
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      isOk 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                        : 'bg-red-500/10 border-red-500/20 text-red-300'
                    }`}>
                      {rec.status}
                    </span>
                  </div>

                  {/* Forklift & Operator metadata */}
                  <div className="grid grid-cols-2 gap-2 text-[10.5px] border-t border-white/5 pt-2.5 text-slate-400 font-medium">
                    <p className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-[#4364f7] shrink-0" />
                      <span className="truncate" title={rec.equipamento}>{rec.patrimonio || rec.equipamento.split(' ')[0]}</span>
                    </p>
                    <p className="flex items-center gap-1 justify-end">
                      <User className="w-3.5 h-3.5 text-[#4364f7] shrink-0" />
                      <span className="truncate">{rec.operador.split(' ')[0]}</span>
                    </p>
                  </div>

                  {/* Conditional Failure Observation */}
                  {!isOk && rec.observacao && (
                    <div className="bg-red-500/10 text-[10.5px] p-2.5 rounded border border-red-500/20 text-red-300 leading-relaxed">
                      <span className="font-bold">Avaria relatada:</span> {rec.observacao}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-[#0e131f] border border-white/5 p-8 text-center rounded-lg text-slate-400 text-xs">
              Nenhum checklist correspondente aos filtros.
            </div>
          )}
        </div>

        {/* Desktop High-Density Corporate Table Grid */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#131a2c] border-b border-white/5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Data/Hora</th>
                <th className="px-5 py-3.5">Equipamento</th>
                <th className="px-5 py-3.5">Atributo</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Operador</th>
                <th className="px-5 py-3.5">Observação Técnico-Operacional</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-200 divide-y divide-white/5">
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((rec) => {
                  const isOk = rec.status === 'OK';
                  return (
                    <tr 
                      key={rec.id} 
                      className={`hover:bg-[#131a2c]/40 transition-colors ${
                        isOk ? '' : 'bg-red-500/5'
                      }`}
                    >
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-bold">{rec.data.split('-').reverse().join('/')}</span>
                        <span className="text-slate-400 ml-1.5">{rec.hora}</span>
                      </td>
                      <td className="px-5 py-4 font-semibold whitespace-nowrap text-[#93c5fd]">
                        {rec.equipamento}
                      </td>
                      <td className="px-5 py-4 font-semibold">
                        {rec.item}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`text-[10px] p-1 px-3 rounded-full font-bold border inline-block leading-none text-center ${
                          isOk 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                            : 'bg-red-500/10 border-red-500/20 text-red-300'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-300 whitespace-nowrap font-medium">
                        {rec.operador}
                      </td>
                      <td className="px-5 py-4">
                        {isOk ? (
                          <span className="text-slate-500 italic">Sem defeitos</span>
                        ) : (
                          <span className="text-red-300 font-semibold p-1 px-1.5 rounded bg-red-500/10 border border-red-500/15 block max-w-sm truncate" title={rec.observacao}>
                            {rec.observacao}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    Nenhum checklist de empilhadeira localizado para as seleções inseridas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Structured Pagination Navigation */}
        <div className="bg-[#0e131f] border-t border-white/5 p-4 flex items-center justify-between gap-4 text-xs select-none">
          <p className="text-slate-400">
            Exibindo <span className="font-bold text-slate-100">{filteredRecords.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> a{' '}
            <span className="font-bold text-slate-100">
              {Math.min(currentPage * itemsPerPage, filteredRecords.length)}
            </span>{' '}
            de <span className="font-semibold">{filteredRecords.length}</span> registros de auditoria
          </p>

          <div className="flex items-center gap-1.5 font-bold">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="w-10 h-10 border border-white/10 rounded-lg flex items-center justify-center hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3.5 py-1 border border-white/10 h-10 rounded-lg flex items-center justify-center bg-[#131a2c] text-slate-100 font-medium min-w-[50px]">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="w-10 h-10 border border-white/10 rounded-lg flex items-center justify-center hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </section>

    </div>
  );
}
