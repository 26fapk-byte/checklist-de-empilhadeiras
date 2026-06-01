import React, { useMemo, useState, useEffect } from 'react';
import { AlertTriangle, Battery, ClipboardCheck, Gauge, Truck } from 'lucide-react';
import { LocalDb, CHECKLIST_ITEMS, generateUUID, getEquipmentsFromSupabase } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { PreventiveChecklistSubmission, Equipment } from '../types';
import StatusToggle from '../components/StatusToggle';
import SignatureField from '../components/SignatureField';
import { useToast } from '../hooks/useToast';

export default function PreventiveChecklist() {
  const { user } = useAuth();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const { toast, showToast } = useToast();
  const [equipment, setEquipment] = useState('');
  const [horimetro, setHorimetro] = useState('');
  const [batteryBars, setBatteryBars] = useState(4);
  const [generalNotes, setGeneralNotes] = useState('');
  const [signatureName, setSignatureName] = useState(user?.name || '');
  const [signatureAccepted, setSignatureAccepted] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      const data = await getEquipmentsFromSupabase();
      if (active) setEquipments(data);
    }
    load();
    return () => { active = false; };
  }, []);

  const [itemsState, setItemsState] = useState<Record<string, { status: 'OK' | 'NOK'; observacao: string }>>(() => {
    const state: Record<string, { status: 'OK' | 'NOK'; observacao: string }> = {};
    CHECKLIST_ITEMS.forEach((item) => {
      state[item.key] = { status: 'OK', observacao: '' };
    });
    return state;
  });

  const latestRecords = useMemo(() => LocalDb.getPreventiveChecklists().slice(0, 4), [toast.visible]);
  const statusGeral = useMemo(
    () => (Object.values(itemsState).some((item) => item.status === 'NOK' ? true : false) ? 'NOK' : 'OK'),
    [itemsState]
  );

  const handleSave = () => {
    if (!user) return;
    if (!equipment) return showToast('Selecione o equipamento inspecionado.', 'error');
    if (!horimetro.trim()) return showToast('Informe o horímetro.', 'error');
    if (!signatureName.trim() || !signatureAccepted) {
      return showToast('Finalize a assinatura digital para concluir.', 'error');
    }

    const pending = CHECKLIST_ITEMS.find((item) => itemsState[item.key].status === 'NOK' && !itemsState[item.key].observacao.trim());
    if (pending) return showToast(`Descreva o item NOK: ${pending.label}.`, 'error');

    const selectedEq = equipments.find((eq) => eq.patrimonio === equipment);
    const now = new Date();
    const submission: PreventiveChecklistSubmission = {
      id: generateUUID(),
      created_at: now.toISOString(),
      data: now.toISOString().slice(0, 10),
      hora: now.toTimeString().slice(0, 5),
      operador: user.name,
      equipamento: selectedEq ? selectedEq.nome : equipment,
      patrimonio: equipment,
      horimetro: Number(horimetro.replace(',', '.')),
      bateria_barras: batteryBars,
      observacoes_gerais: generalNotes.trim(),
      assinatura_nome: signatureName.trim(),
      assinatura_confirmada: signatureAccepted,
      status_geral: statusGeral,
      itens: CHECKLIST_ITEMS.map((item) => ({
        itemKey: item.key,
        itemLabel: item.label,
        status: itemsState[item.key].status,
        observacao: itemsState[item.key].observacao.trim()
      }))
    };

    LocalDb.savePreventiveChecklist(submission);
    showToast('Checklist preventivo registrado com sucesso.');
    setEquipment('');
    setHorimetro('');
    setBatteryBars(4);
    setGeneralNotes('');
    setSignatureAccepted(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-5 pb-24 text-white">
      {toast.visible && (
        <div className={`tkf-toast flex items-center justify-center text-center ${toast.type === 'success' ? 'border-emerald-500 bg-[#0e131f] text-emerald-300' : 'border-red-500 bg-[#0e131f] text-red-300'}`}>
          {toast.message}
        </div>
      )}

      <header className="rounded-3xl border border-white/10 bg-[#0e131f] p-5 shadow-[0_20px_45px_rgba(14,19,31,0.5)]">
        <div className="flex items-start gap-3">
          <ClipboardCheck className="mt-1 h-5 w-5 text-[#4364f7]" />
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Checklist Preventivo de Empilhadeira</h2>
            <p className="mt-1 text-xs text-slate-400">Fluxo operacional mobile-first com rastreabilidade e sincronização posterior.</p>
          </div>
        </div>
      </header>

      <section className="tkf-card p-4 space-y-4">
        <div>
          <label className="tkf-label">Operador autenticado</label>
          <div className="mt-1.5 flex h-12 w-full items-center rounded-xl border border-white/5 bg-[#131a2c]/60 px-3 text-sm font-semibold text-slate-300 select-none">
            {user?.name}
          </div>
        </div>

        <div>
          <label className="tkf-label">Equipamento</label>
          <select value={equipment} onChange={(event) => setEquipment(event.target.value)} className="tkf-select mt-1.5">
            <option value="">Selecionar patrimônio</option>
            {equipments.map((eq) => (
              <option key={eq.id} value={eq.patrimonio}>{eq.patrimonio} - {eq.nome}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-1 tkf-label">
              <Gauge className="h-3.5 w-3.5 text-[#4364f7]" /> Horímetro
            </label>
            <input value={horimetro} onChange={(event) => setHorimetro(event.target.value.replace(/[^0-9.,]/g, ''))} className="tkf-input mt-1.5" placeholder="Ex: 1120,5" />
          </div>
          <div>
            <label className="flex items-center gap-1 tkf-label">
              <Battery className="h-3.5 w-3.5 text-[#4364f7]" /> Carga
            </label>
            <div className="grid h-12 grid-cols-5 gap-1 rounded-xl border border-white/10 bg-[#131a2c] p-1 mt-1.5">
              {[1, 2, 3, 4, 5].map((b) => (
                <button key={b} type="button" onClick={() => setBatteryBars(b)} className={`rounded-md text-[11px] font-bold transition-all cursor-pointer ${batteryBars === b ? 'bg-[#4364f7] text-white' : 'text-slate-400 hover:text-white'}`}>{b}</button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="tkf-card p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="text-sm font-semibold text-white">Itens de inspeção</h3>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold border ${statusGeral === 'OK' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-amber-500/10 text-amber-300 border-amber-500/20'}`}>
            Status geral {statusGeral}
          </span>
        </div>

        <div className="space-y-3.5">
          {CHECKLIST_ITEMS.map((item) => (
            <article key={item.key} className="space-y-2 rounded-xl border border-white/5 bg-[#131a2c]/40 p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-slate-200">{item.label}</p>
                <div className="w-32">
                  <StatusToggle value={itemsState[item.key].status} onChange={(status) => setItemsState((prev) => ({ ...prev, [item.key]: { ...prev[item.key], status } }))} size="sm" />
                </div>
              </div>
              {itemsState[item.key].status === 'NOK' && (
                <textarea
                  value={itemsState[item.key].observacao}
                  onChange={(event) => setItemsState((prev) => ({ ...prev, [item.key]: { ...prev[item.key], observacao: event.target.value } }))}
                  rows={2}
                  className="w-full rounded-xl border border-amber-500/35 bg-[#0e131f] px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
                  placeholder="Descreva a não conformidade encontrada..."
                />
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="tkf-card p-4">
        <label className="tkf-label">Observações gerais</label>
        <textarea value={generalNotes} onChange={(event) => setGeneralNotes(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-white/10 bg-[#131a2c] px-3 py-2 text-sm text-white focus:border-[#4364f7] outline-none" placeholder="Observações adicionais ou notas técnicas..." />
      </section>

      <SignatureField
        signerName={signatureName}
        acknowledged={signatureAccepted}
        onSignerNameChange={setSignatureName}
        onAcknowledgedChange={setSignatureAccepted}
      />

      <button onClick={handleSave} className="tkf-btn-primary w-full h-14 flex items-center justify-center gap-2 cursor-pointer text-sm font-bold uppercase tracking-wider">
        <Truck className="h-4 w-4" />
        Salvar Checklist Preventivo
      </button>

      <section className="tkf-card p-4 space-y-3">
        <h3 className="tkf-label">Últimos envios</h3>
        {latestRecords.length === 0 ? (
          <p className="text-xs text-slate-400">Nenhum checklist preventivo registrado.</p>
        ) : latestRecords.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-[#131a2c]/30 px-3 py-2 text-xs">
            <div>
              <p className="font-semibold text-slate-200">{entry.patrimonio}</p>
              <p className="text-slate-400">{entry.data.split('-').reverse().join('/')} {entry.hora}</p>
            </div>
            {entry.status_geral === 'NOK' ? <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse" /> : <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 text-[10px] font-bold text-emerald-300">OK</span>}
          </div>
        ))}
      </section>
    </div>
  );
}
