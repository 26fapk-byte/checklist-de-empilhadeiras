import React, { useState, useMemo } from 'react';
import { LocalDb } from '../lib/db';
import { 
  Search, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal,
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

  const equipments = LocalDb.getEquipments();

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
      link.setAttribute('download', 'pharmalog_checklists_export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Houve um erro técnico ao estruturar o arquivo csv.');
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      
      {/* Title & Stats summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#181C1E] tracking-tight">Histórico de Revisões</h2>
          <p className="text-xs text-[#6C797B] mt-0.5">
            Logs completos de conformidade. Exiba e audite registros rapidamente.
          </p>
        </div>

        {/* Action Export */}
        <button
          onClick={handleExportCSV}
          className="bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#006970] font-bold text-xs h-10 px-4 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4 text-[#1e3a8a]" />
          <span>EXPORTAR HISTÓRICO (CSV)</span>
        </button>
      </div>

      {/* Audit filtration panel */}
      <section className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-sm space-y-4">
        
        {/* Quick Search */}
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6C797B]">
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
            className="w-full h-11 pl-10 pr-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#181C1E] focus:outline-none focus:border-[#006970] focus:ring-1 focus:ring-[#006970] placeholder-[#6C797B]"
          />
        </div>

        {/* Modular Horizontal Selectors Scroll */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          
          {/* Month selective */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C797B]">Mês</span>
            <select
              value={filterMonth}
              onChange={(e) => {
                setFilterMonth(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#181C1E]"
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C797B]">Empilhadeira</span>
            <select
              value={filterEq}
              onChange={(e) => {
                setFilterEq(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#181C1E]"
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C797B]">Status</span>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#181C1E]"
            >
              <option value="Todos">Todos os status</option>
              <option value="OK">OK (Conforme)</option>
              <option value="NOK">NOK (Exceção/Avaria)</option>
            </select>
          </div>

          {/* Sorting Direction */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C797B]">Ordenação</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
              className="w-full h-10 px-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#181C1E]"
            >
              <option value="desc">Mais recentes primeiro</option>
              <option value="asc">Mais antigas primeiro</option>
            </select>
          </div>

        </div>

      </section>

      {/* Main Grid Log View - Mobile Optimized (Cards on mobile, tabular on desktop) */}
      <section className="bg-[#F4F7F9] sm:bg-white rounded-xl sm:border border-[#E2E8F0] sm:shadow-sm overflow-hidden">
        
        {/* Mobile Grid Layout Cards */}
        <div className="sm:hidden space-y-3">
          {paginatedRecords.length > 0 ? (
            paginatedRecords.map((rec) => {
              const isOk = rec.status === 'OK';
              return (
                <div 
                  key={rec.id} 
                  className={`bg-white border rounded-lg p-3.5 space-y-3 relative overflow-hidden transition-all ${
                    isOk ? 'border-[#E2E8F0]' : 'border-red-200 bg-red-50/5'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 max-w-[70%]">
                      <span className="text-[9px] font-bold text-[#6C797B] uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#1e3a8a]" />
                        <span>{rec.data.split('-').reverse().join('/')} &bull; {rec.hora}</span>
                      </span>
                      <h4 className="text-xs font-bold text-[#181C1E]">{rec.item}</h4>
                    </div>

                    {/* Status Pill matching corporate standards */}
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      isOk 
                        ? 'bg-[#E6F7F8] border border-[#00A9B4] text-[#006970]' 
                        : 'bg-[#003366] text-white'
                    }`}>
                      {rec.status}
                    </span>
                  </div>

                  {/* Forklift & Operator metadata */}
                  <div className="grid grid-cols-2 gap-2 text-[10.5px] border-t border-[#F1F4F6] pt-2.5 text-[#3D494A]">
                    <p className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-[#1e3a8a] shrink-0" />
                      <span className="truncate" title={rec.equipamento}>{rec.patrimonio || rec.equipamento.split(' ')[0]}</span>
                    </p>
                    <p className="flex items-center gap-1 justify-end">
                      <User className="w-3.5 h-3.5 text-[#1e3a8a] shrink-0" />
                      <span className="truncate">{rec.operador.split(' ')[0]}</span>
                    </p>
                  </div>

                  {/* Conditional Failure Observation */}
                  {!isOk && rec.observacao && (
                    <div className="bg-[#FFF8F8] text-[10.5px] p-2.5 rounded border border-red-100 text-[#93000a] leading-relaxed">
                      <span className="font-bold">Avaria relatada:</span> {rec.observacao}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-white border border-[#E2E8F0] p-8 text-center rounded-lg text-[#6C797B] text-xs">
              Nenhum checklist correspondente aos filtros.
            </div>
          )}
        </div>

        {/* Desktop High-Density Corporate Table Grid */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-bold text-[#6C797B] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Data/Hora</th>
                <th className="px-5 py-3.5">Equipamento</th>
                <th className="px-5 py-3.5">Atributo</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Operador</th>
                <th className="px-5 py-3.5">Observação Técnico-Operacional</th>
              </tr>
            </thead>
            <tbody className="text-xs text-[#181C1E] divide-y divide-[#F1F4F6]">
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((rec) => {
                  const isOk = rec.status === 'OK';
                  return (
                    <tr 
                      key={rec.id} 
                      className={`hover:bg-[#F8FAFC] transition-colors ${
                        isOk ? '' : 'bg-red-50/10'
                      }`}
                    >
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-bold">{rec.data.split('-').reverse().join('/')}</span>
                        <span className="text-[#6C797B] ml-1.5">{rec.hora}</span>
                      </td>
                      <td className="px-5 py-4 font-semibold whitespace-nowrap text-[#006970]">
                        {rec.equipamento}
                      </td>
                      <td className="px-5 py-4 font-semibold">
                        {rec.item}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`text-[10px] p-1 px-3 rounded-full font-bold inline-block leading-none text-center ${
                          isOk 
                            ? 'bg-[#E6F7F8] border border-[#00A9B4] text-[#006970]' 
                            : 'bg-[#003366] text-white'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[#3D494A] whitespace-nowrap font-medium">
                        {rec.operador}
                      </td>
                      <td className="px-5 py-4">
                        {isOk ? (
                          <span className="text-[#8B9C9B] italic">Sem defeitos</span>
                        ) : (
                          <span className="text-red-700 font-semibold p-1 px-1.5 rounded bg-red-50 border border-red-100 block max-w-sm truncate" title={rec.observacao}>
                            {rec.observacao}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-[#6C797B]">
                    Nenhum checklist de empilhadeira localizado para as seleções inseridas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Structured Pagination Navigation */}
        <div className="bg-white border-t border-[#E2E8F0] p-4 flex items-center justify-between gap-4 text-xs select-none">
          <p className="text-[#6C797B]">
            Exibindo <span className="font-bold text-[#181C1E]">{filteredRecords.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> a{' '}
            <span className="font-bold text-[#181C1E]">
              {Math.min(currentPage * itemsPerPage, filteredRecords.length)}
            </span>{' '}
            de <span className="font-semibold">{filteredRecords.length}</span> registros de auditoria
          </p>

          <div className="flex items-center gap-1.5 font-bold">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="w-10 h-10 border border-[#E2E8F0] rounded-lg flex items-center justify-center hover:bg-[#F8FAFC] disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer text-[#3D494A]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3.5 py-1 border border-[#E2E8F0] h-10 rounded-lg flex items-center justify-center bg-[#F8FAFC] text-[#3D494A] font-medium min-w-[50px]">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="w-10 h-10 border border-[#E2E8F0] rounded-lg flex items-center justify-center hover:bg-[#F8FAFC] disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer text-[#3D494A]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </section>

    </div>
  );
}
