import React, { useMemo, useState } from 'react';
import { AlertTriangle, Battery, ClipboardCheck, Gauge, Truck } from 'lucide-react';
import { LocalDb, CHECKLIST_ITEMS, generateUUID } from '../lib/db';
import { useEquipments } from '../hooks/useEquipments';
import { useAuth } from '../context/AuthContext';
import { PreventiveChecklistSubmission } from '../types';
import StatusToggle from '../components/StatusToggle';
import SignatureField from '../components/SignatureField';
import { useToast } from '../hooks/useToast';

export default function PreventiveChecklist() {
  const { user } = useAuth();
  const { equipments } = useEquipments();
  const { toast, showToast } = useToast();
  const [equipment, setEquipment] = useState('');
  const [horimetro, setHorimetro] = useState('');
  const [batteryBars, setBatteryBars] = useState(4);
  const [generalNotes, setGeneralNotes] = useState('');
  const [signatureName, setSignatureName] = useState(user?.name || '');
  const [signatureAccepted, setSignatureAccepted] = useState(false);

  const [itemsState, setItemsState] = useState<Record<string, { status: 'OK' | 'NOK'; observacao: string }>>(() => {
    const state: Record<string, { status: 'OK' | 'NOK'; observacao: string }> = {};
    CHECKLIST_ITEMS.forEach((item) => {
      state[item.key] = { status: 'OK', observacao: '' };
    });
    return state;
  });

  const latestRecords = useMemo(() => LocalDb.getPreventiveChecklists().slice(0, 4), [toast.visible]);
  const statusGeral = useMemo(
    () => (Object.values(itemsState).some((item) => item.status === 'NOK') ? 'NOK' : 'OK'),
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
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-5 pb-24">
      {toast.visible && (
        <div className={`fixed left-1/2 top-4 z-50 w-[90%] max-w-sm -translate-x-1/2 rounded-xl border px-3 py-3 text-xs font-semibold shadow-lg ${toast.type === 'success' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-red-300 bg-red-50 text-red-700'}`}>
          {toast.message}
        </div>
      )}

      <section className="rounded-3xl border border-white/10 bg-[#0f172a] p-5 text-white shadow-[0_20px_45px_rgba(15,23,42,0.4)]">
        <div className="flex items-start gap-3">
          <ClipboardCheck className="mt-1 h-5 w-5 text-[#60a5fa]" />
          <div>
            <h2 className="text-lg font-semibold">Checklist Preventivo de Empilhadeira</h2>
            <p className="mt-1 text-xs text-slate-300">Fluxo operacional mobile-first com rastreabilidade e sincronização posterior.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Operador autenticado</label>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-800">{user?.name}</div>

        <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Equipamento</label>
        <select value={equipment} onChange={(event) => setEquipment(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm">
          <option value="">Selecionar patrimônio</option>
          {equipments.map((eq) => (
            <option key={eq.id} value={eq.patrimonio}>{eq.patrimonio} - {eq.nome}</option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500"><Gauge className="h-3.5 w-3.5" /> Horímetro</label>
            <input value={horimetro} onChange={(event) => setHorimetro(event.target.value.replace(/[^0-9.,]/g, ''))} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm" placeholder="Ex: 1120,5" />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500"><Battery className="h-3.5 w-3.5" /> Carga</label>
            <div className="grid h-11 grid-cols-5 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
              {[1, 2, 3, 4, 5].map((b) => (
                <button key={b} type="button" onClick={() => setBatteryBars(b)} className={`rounded-md text-[11px] font-bold ${batteryBars === b ? 'bg-[#1e3a8a] text-white' : 'text-slate-500'}`}>{b}</button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Itens de inspeção</h3>
          <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${statusGeral === 'OK' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>Status geral {statusGeral}</span>
        </div>

        {CHECKLIST_ITEMS.map((item) => (
          <article key={item.key} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-slate-800">{item.label}</p>
              <div className="w-32"><StatusToggle value={itemsState[item.key].status} onChange={(status) => setItemsState((prev) => ({ ...prev, [item.key]: { ...prev[item.key], status } }))} size="sm" /></div>
            </div>
            {itemsState[item.key].status === 'NOK' && (
              <textarea
                value={itemsState[item.key].observacao}
                onChange={(event) => setItemsState((prev) => ({ ...prev, [item.key]: { ...prev[item.key], observacao: event.target.value } }))}
                rows={2}
                className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs"
                placeholder="Descreva a não conformidade"
              />
            )}
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Observações gerais</label>
        <textarea value={generalNotes} onChange={(event) => setGeneralNotes(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
      </section>

      <SignatureField
        signerName={signatureName}
        acknowledged={signatureAccepted}
        onSignerNameChange={setSignatureName}
        onAcknowledgedChange={setSignatureAccepted}
      />

      <button onClick={handleSave} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#2563eb] text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.35)] transition hover:bg-[#1d4ed8]">
        <Truck className="h-4 w-4" />
        Salvar Checklist Preventivo
      </button>

      <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Últimos envios</h3>
        {latestRecords.length === 0 ? (
          <p className="text-xs text-slate-500">Nenhum checklist preventivo registrado.</p>
        ) : latestRecords.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
            <div>
              <p className="font-semibold text-slate-800">{entry.patrimonio}</p>
              <p className="text-slate-500">{entry.data.split('-').reverse().join('/')} {entry.hora}</p>
            </div>
            {entry.status_geral === 'NOK' ? <AlertTriangle className="h-4 w-4 text-amber-600" /> : <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700">OK</span>}
          </div>
        ))}
      </section>
    </div>
  );
}
