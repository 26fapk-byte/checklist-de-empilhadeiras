import React, { useMemo, useState } from 'react';
import { BatteryCharging, Clock3, Droplets, Gauge, Wrench } from 'lucide-react';
import { LocalDb, generateUUID } from '../lib/db';
import { useEquipments } from '../hooks/useEquipments';
import { useAuth } from '../context/AuthContext';
import { BatteryRechargeRecord } from '../types';
import StatusToggle from '../components/StatusToggle';
import SignatureField from '../components/SignatureField';
import { useToast } from '../hooks/useToast';

export default function BatteryRecharge() {
  const { user } = useAuth();
  const { equipments } = useEquipments();
  const { toast, showToast } = useToast();

  const [patrimonio, setPatrimonio] = useState('');
  const [horimetro, setHorimetro] = useState('');
  const [inicioOperador, setInicioOperador] = useState(user?.name || '');
  const [terminoOperador, setTerminoOperador] = useState(user?.name || '');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaTermino, setHoraTermino] = useState('');
  const [carregadorStatus, setCarregadorStatus] = useState<'OK' | 'NOK'>('OK');
  const [reposicaoAgua, setReposicaoAgua] = useState(false);
  const [responsavelReposicao, setResponsavelReposicao] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [signatureName, setSignatureName] = useState(user?.name || '');
  const [signatureAccepted, setSignatureAccepted] = useState(false);

  const latest = useMemo(() => LocalDb.getBatteryRechargeRecords().slice(0, 4), [toast.visible]);

  const handleSave = () => {
    if (!patrimonio) return showToast('Selecione o patrimônio do equipamento.', 'error');
    if (!horaInicio || !horaTermino) return showToast('Preencha horário de início e término.', 'error');
    if (!inicioOperador.trim() || !terminoOperador.trim()) return showToast('Informe operadores de início e término.', 'error');
    if (reposicaoAgua && !responsavelReposicao.trim()) return showToast('Informe o responsável pela reposição de água.', 'error');
    if (!signatureName.trim() || !signatureAccepted) return showToast('Assinatura digital obrigatória.', 'error');

    const now = new Date();
    const payload: BatteryRechargeRecord = {
      id: generateUUID(),
      created_at: now.toISOString(),
      data: now.toISOString().slice(0, 10),
      patrimonio,
      horimetro: Number(horimetro.replace(',', '.')) || 0,
      operador_inicio: inicioOperador.trim(),
      operador_termino: terminoOperador.trim(),
      hora_inicio: horaInicio,
      hora_termino: horaTermino,
      carregador_status: carregadorStatus,
      reposicao_agua: reposicaoAgua,
      responsavel_reposicao: responsavelReposicao.trim(),
      observacoes: observacoes.trim(),
      assinatura_nome: signatureName.trim(),
      assinatura_confirmada: signatureAccepted
    };

    LocalDb.saveBatteryRechargeRecord(payload);
    showToast('Módulo de recarga registrado.');
    setPatrimonio('');
    setHorimetro('');
    setHoraInicio('');
    setHoraTermino('');
    setCarregadorStatus('OK');
    setReposicaoAgua(false);
    setResponsavelReposicao('');
    setObservacoes('');
    setSignatureAccepted(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-5 pb-24">
      {toast.visible && (
        <div className={`fixed left-1/2 top-4 z-50 w-[90%] max-w-sm -translate-x-1/2 rounded-xl border px-3 py-3 text-xs font-semibold shadow-lg ${toast.type === 'success' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-red-300 bg-red-50 text-red-700'}`}>
          {toast.message}
        </div>
      )}

      <section className="rounded-3xl border border-white/10 bg-[#111827] p-5 text-white shadow-[0_20px_45px_rgba(17,24,39,0.45)]">
        <div className="flex items-start gap-3">
          <BatteryCharging className="mt-1 h-5 w-5 text-[#f59e0b]" />
          <div>
            <h2 className="text-lg font-semibold">Abastecimento de Água e Recarga da Bateria</h2>
            <p className="mt-1 text-xs text-slate-300">Registro operacional de ciclo completo de carregamento e manutenção da bateria.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Patrimônio</label>
        <select value={patrimonio} onChange={(event) => setPatrimonio(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm">
          <option value="">Selecionar equipamento</option>
          {equipments.map((eq) => (
            <option key={eq.id} value={eq.patrimonio}>{eq.patrimonio} - {eq.nome}</option>
          ))}
        </select>

        <label className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500"><Gauge className="h-3.5 w-3.5" /> Horímetro</label>
        <input value={horimetro} onChange={(event) => setHorimetro(event.target.value.replace(/[^0-9.,]/g, ''))} className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm" placeholder="Ex: 1320,0" />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Início operador</label>
            <input value={inicioOperador} onChange={(event) => setInicioOperador(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Término operador</label>
            <input value={terminoOperador} onChange={(event) => setTerminoOperador(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500"><Clock3 className="h-3.5 w-3.5" /> Hora início</label>
            <input type="time" value={horaInicio} onChange={(event) => setHoraInicio(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm" />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500"><Clock3 className="h-3.5 w-3.5" /> Hora término</label>
            <input type="time" value={horaTermino} onChange={(event) => setHoraTermino(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm" />
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Situação do carregador</label>
          <div className="w-36"><StatusToggle value={carregadorStatus} onChange={setCarregadorStatus} size="sm" /></div>
        </div>

        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">
          <Droplets className="h-4 w-4 text-[#1e3a8a]" />
          <input type="checkbox" checked={reposicaoAgua} onChange={(event) => setReposicaoAgua(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-[#2563eb]" />
          Reposição de água executada
        </label>

        {reposicaoAgua && (
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Responsável pela reposição</label>
            <input value={responsavelReposicao} onChange={(event) => setResponsavelReposicao(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm" />
          </div>
        )}

        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Observações</label>
          <textarea value={observacoes} onChange={(event) => setObservacoes(event.target.value)} rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
        </div>
      </section>

      <SignatureField signerName={signatureName} acknowledged={signatureAccepted} onSignerNameChange={setSignatureName} onAcknowledgedChange={setSignatureAccepted} />

      <button onClick={handleSave} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1e3a8a] text-sm font-bold text-white shadow-[0_12px_28px_rgba(30,58,138,0.35)] transition hover:bg-[#1e40af]">
        <Wrench className="h-4 w-4" />
        Salvar Ciclo de Recarga
      </button>

      <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Últimos ciclos registrados</h3>
        {latest.length === 0 ? (
          <p className="text-xs text-slate-500">Nenhum ciclo de recarga registrado.</p>
        ) : latest.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
            <div>
              <p className="font-semibold text-slate-800">{entry.patrimonio}</p>
              <p className="text-slate-500">{entry.hora_inicio} - {entry.hora_termino}</p>
            </div>
            <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${entry.carregador_status === 'OK' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{entry.carregador_status}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
