import React, { useEffect, useMemo, useState } from 'react';
import { LocalDb } from '../lib/db';
import { ChecklistRecord, Equipment } from '../types';
import {
  Activity,
  ClipboardCheck,
  Truck,
  Users,
  ShieldCheck,
  AlertCircle,
  Trash2,
  Plus,
  Info,
  Gauge,
  Battery,
  CheckCircle2,
  Clock,
  Calendar,
  User,
  ShieldAlert
} from 'lucide-react';
import { generateUUID } from '../lib/db';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [records, setRecords] = useState<ChecklistRecord[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('Todos');
  const [selectedEq, setSelectedEq] = useState('Todos');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [equipmentName, setEquipmentName] = useState('');
  const [equipmentPatrimonio, setEquipmentPatrimonio] = useState('');
  const [equipmentType, setEquipmentType] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadData = () => {
    setRecords(LocalDb.getRecords());
    setEquipments(LocalDb.getEquipments());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Permission check: Only gerente/master can access this dashboard
  useEffect(() => {
    if (user && user.role === 'operador') {
      window.location.href = '/';
    }
  }, [user]);

  const filteredRecords = useMemo(() => {
    let result = [...records];
    if (selectedMonth !== 'Todos') {
      result = result.filter((record) => record.data.startsWith(selectedMonth));
    }
    if (selectedEq !== 'Todos') {
      result = result.filter((record) => record.equipamento.includes(selectedEq));
    }
    if (selectedStatus !== 'Todos') {
      result = result.filter((record) => record.status === selectedStatus);
    }
    return result.sort((a, b) => `${b.data} ${b.hora}`.localeCompare(`${a.data} ${a.hora}`));
  }, [records, selectedMonth, selectedEq, selectedStatus]);

  const months = useMemo(() => {
    const unique = Array.from(new Set(records.map((record) => record.data.substring(0, 7))));
    return unique.sort((a: string, b: string) => b.localeCompare(a));
  }, [records]);

  const totalInspections = useMemo(() => {
    const inspectionKeys = new Set(records.map((record) => `${record.data}_${record.hora}_${record.equipamento}`));
    return inspectionKeys.size;
  }, [records]);

  const totalOk = useMemo(() => records.filter((record) => record.status === 'OK').length, [records]);
  const totalNok = useMemo(() => records.filter((record) => record.status === 'NOK').length, [records]);

  const equipmentHealth = useMemo(() => {
    return equipments.map((equipment) => {
      const equipmentRecords = records.filter((record) => record.patrimonio === equipment.patrimonio);
      const latest = equipmentRecords.sort((a, b) => `${b.data} ${b.hora}`.localeCompare(`${a.data} ${a.hora}`))[0];
      const failedItems = equipmentRecords.filter((record) => record.status === 'NOK' && record.data === latest?.data && record.hora === latest?.hora).map((record) => record.item);
      return {
        ...equipment,
        lastInspection: latest ? `${latest.data.split('-').reverse().join('/')} ${latest.hora}` : 'Sem registro',
        lastOperator: latest?.operador ?? 'Sem operador',
        status: latest ? (failedItems.length > 0 ? 'NOK' : 'OK') : 'Sem inspeção',
        failedItems
      };
    });
  }, [equipments, records]);

  const operatorRanking = useMemo(() => {
    const countMap: Record<string, number> = {};
    records.forEach((record) => {
      if (!record.operador) return;
      countMap[record.operador] = (countMap[record.operador] || 0) + 1;
    });
    return Object.entries(countMap)
      .map(([operador, count]) => ({ operador, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [records]);

  const handleDeleteRecord = (id: string) => {
    // Permission check: Only gerente/master can delete
    if (!user || (user.role !== 'gerente' && user.role !== 'master')) {
      setNotification({ message: 'Você não tem permissão para excluir registros.', type: 'error' });
      return;
    }

    const success = LocalDb.deleteRecord(id);
    if (success) {
      setNotification({ message: 'Registro excluído com sucesso.', type: 'success' });
      loadData();
    } else {
      setNotification({ message: 'Não foi possível excluir o registro. Tente novamente.', type: 'error' });
    }
  };

  const handleCreateEquipment = () => {
    if (!equipmentName.trim() || !equipmentPatrimonio.trim() || !equipmentType.trim()) {
      setNotification({ message: 'Preencha todos os campos do cadastro de equipamento.', type: 'error' });
      return;
    }
    const newEquipment: Equipment = {
      id: generateUUID(),
      nome: equipmentName.trim(),
      patrimonio: equipmentPatrimonio.trim().toUpperCase(),
      tipo: equipmentType.trim(),
      ativo: true
    };
    LocalDb.addEquipment(newEquipment);
    setEquipmentName('');
    setEquipmentPatrimonio('');
    setEquipmentType('');
    setNotification({ message: 'Equipamento cadastrado com sucesso.', type: 'success' });
    loadData();
  };

  const handleRemoveEquipment = (id: string) => {
    LocalDb.removeEquipment(id);
    setNotification({ message: 'Equipamento removido da Checklists.', type: 'success' });
    loadData();
  };

  useEffect(() => {
    if (!notification) return;
    const timer = window.setTimeout(() => setNotification(null), 3200);
    return () => window.clearTimeout(timer);
  }, [notification]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {notification && (
        <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
          {notification.message}
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Painel Administrativo</h1>
          <p className="text-sm text-[#475569] max-w-2xl mt-1">Visão gerencial de produtividade, ativos e auditorias para a Checklists LogiCheck.</p>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#64748B]">Inspeções totais</p>
          <h2 className="mt-3 text-3xl font-bold text-[#0F172A]">{totalInspections}</h2>
          <p className="mt-2 text-xs text-[#475569]">Contagem de checklists únicos enviados hoje e no histórico.</p>
        </article>

        <article className="rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#64748B]">Status OK</p>
          <h2 className="mt-3 text-3xl font-bold text-[#0F172A]">{totalOk}</h2>
          <div className="mt-2 flex items-center gap-2 text-xs text-[#047857]">
            <CheckCircle2 className="w-4 h-4" />
            <span>Registros conformes</span>
          </div>
        </article>

        <article className="rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#64748B]">Status NOK</p>
          <h2 className="mt-3 text-3xl font-bold text-[#0F172A]">{totalNok}</h2>
          <div className="mt-2 flex items-center gap-2 text-xs text-[#881337]">
            <AlertCircle className="w-4 h-4" />
            <span>Registros com não conformidades</span>
          </div>
        </article>

        <article className="rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#64748B]">Máquinas ativas</p>
          <h2 className="mt-3 text-3xl font-bold text-[#0F172A]">{equipments.length}</h2>
          <div className="mt-2 flex items-center gap-2 text-xs text-[#1D4ED8]">
            <Truck className="w-4 h-4" />
            <span>Checklists registrados</span>
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <article className="rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#64748B]">Ranking de Produtividade</p>
              <h2 className="mt-2 text-xl font-bold text-[#0F172A]">Operadores com mais registros</h2>
            </div>
            <div className="rounded-2xl bg-[#F8FAFC] px-3 py-2 text-xs text-[#0F172A] border border-[#E2E8F0]">
              Total de operadores: {operatorRanking.length}
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {operatorRanking.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-4 text-sm text-[#64748B]">Ainda não há registros suficientes.</div>
            ) : (
              operatorRanking.map((entry, index) => (
                <div key={entry.operador} className="flex items-center justify-between rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">{entry.operador}</p>
                    <p className="text-[11px] text-[#64748B]">Ações registradas</p>
                  </div>
                  <div className="rounded-full bg-[#E2E8F8] px-3 py-1 text-sm font-bold text-[#0F172A]">{entry.count}</div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#64748B]">Saúde da Checklists</p>
          <h2 className="mt-2 text-xl font-bold text-[#0F172A]">Última inspeção por equipamento</h2>
          <div className="mt-5 space-y-3">
            {equipmentHealth.map((equipment) => (
              <div key={equipment.id} className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#0F172A]">{equipment.nome}</p>
                    <p className="text-[11px] text-[#64748B]">{equipment.patrimonio} • {equipment.tipo}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${equipment.status === 'OK' ? 'bg-[#E6F7F8] text-[#006970]' : equipment.status === 'NOK' ? 'bg-[#FEF2F2] text-[#981B1B]' : 'bg-[#E2E8F0] text-[#475569]'}`}>
                    {equipment.status}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] text-[#475569]">
                  <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-[#64748B]" /> {equipment.lastInspection}</span>
                  <span className="flex items-center gap-2"><User className="w-4 h-4 text-[#64748B]" /> {equipment.lastOperator}</span>
                </div>
                {equipment.failedItems?.length ? (
                  <div className="mt-3 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-3 text-[11px] text-[#981B1B]">
                    <p className="font-semibold">Itens NOK:</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {equipment.failedItems.map((item, index) => (
                        <span key={index} className="rounded-full bg-[#FEE2E2] px-2 py-1">{item}</span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#64748B]">Auditoria de checklist</p>
              <h2 className="mt-2 text-xl font-bold text-[#0F172A]">Registros gerais</h2>
            </div>
            <span className="rounded-full bg-[#E6F7F8] px-3 py-2 text-[11px] text-[#006970] border border-[#1e3a8a]">{filteredRecords.length} itens filtrados</span>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-[12px] text-[#1E293B]">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B] uppercase tracking-[0.18em] text-[10px]">
                  <th className="px-3 py-3">Data</th>
                  <th className="px-3 py-3">Equipamento</th>
                  <th className="px-3 py-3">Item</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Operador</th>
                  <th className="px-3 py-3">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.slice(0, 15).map((record) => (
                  <tr key={record.id} className="border-b border-[#F1F4F6] hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-3 py-3 whitespace-nowrap text-[#475569]">{record.data.split('-').reverse().join('/')}</td>
                    <td className="px-3 py-3 font-semibold text-[#0F172A]">{record.equipamento}</td>
                    <td className="px-3 py-3">{record.item}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${record.status === 'OK' ? 'bg-[#E6F7F8] text-[#006970]' : 'bg-[#003366] text-white'}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">{record.operador}</td>
                    <td className="px-3 py-3">
                      {(user?.role === 'gerente' || user?.role === 'master') ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(record.id)}
                          className="inline-flex items-center gap-2 rounded-full bg-[#FEF2F2] px-3 py-2 text-[10px] font-semibold text-[#981B1B] border border-[#FECACA] hover:bg-[#FEE2E2] transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Excluir
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#6C797B]">Sem permissão</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredRecords.length > 15 && (
            <div className="mt-4 text-xs text-[#64748B]">Apenas os 15 registros mais recentes são exibidos aqui para performance.</div>
          )}
        </article>

        <article className="rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Plus className="w-5 h-5 text-[#1E3A8A]" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#64748B]">Cadastro de Equipamento</p>
              <h2 className="text-xl font-bold text-[#0F172A]">Gerencie ativos da Checklists</h2>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Nome do equipamento</label>
              <input
                value={equipmentName}
                onChange={(event) => setEquipmentName(event.target.value)}
                className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0F172A] focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10"
                placeholder="Empilhadeira elétrica Toyota 8FBRE16S"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Patrimônio</label>
              <input
                value={equipmentPatrimonio}
                onChange={(event) => setEquipmentPatrimonio(event.target.value)}
                className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0F172A] focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10"
                placeholder="EMP-4410"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Tipo de ativo</label>
              <input
                value={equipmentType}
                onChange={(event) => setEquipmentType(event.target.value)}
                className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0F172A] focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10"
                placeholder="Empilhadeira retrátil"
              />
            </div>
            <button
              type="button"
              onClick={handleCreateEquipment}
              className="w-full rounded-2xl bg-[#1E3A8A] px-4 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#152e72]"
            >
              Cadastrar ativo
            </button>
          </div>

          <div className="mt-8 space-y-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#64748B]">Registros operacionais</div>
            {equipments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-4 text-sm text-[#64748B]">Nenhum equipamento cadastrado.</div>
            ) : (
              <div className="space-y-3">
                {equipments.map((equipment) => (
                  <div key={equipment.id} className="flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#0F172A]">{equipment.nome}</p>
                        <p className="text-[11px] text-[#64748B]">{equipment.patrimonio} • {equipment.tipo}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveEquipment(equipment.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-[#F1F4F6] bg-[#FEF2F2] px-3 py-2 text-[10px] font-semibold text-[#981B1B] hover:bg-[#FEE2E2] transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 text-sm text-[#475569] shadow-sm">
        <div className="flex items-center gap-2 font-semibold text-[#0F172A] mb-2">
          <Info className="w-4 h-4" />
          Observação de Gestão
        </div>
        <p>
          Esta área permite que gerentes visualizem o status de toda Checklists, ajustem ativos e removam registros indevidos com segurança.
          A exclusão de registros também tenta manter sincronização com o banco de dados remoto quando o Supabase estiver configurado.
        </p>
      </section>
    </div>
  );
}
