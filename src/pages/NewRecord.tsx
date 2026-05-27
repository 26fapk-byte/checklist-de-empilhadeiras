import React, { useState, useEffect, useMemo } from 'react';
import { LocalDb, CHECKLIST_ITEMS, generateUUID } from '../lib/db';
import { ChecklistRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle2, 
  XCircle, 
  Save, 
  Check, 
  Sparkles, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Truck, 
  User, 
  Battery, 
  Gauge, 
  Power 
} from 'lucide-react';

export default function NewRecord() {
  const { user } = useAuth();
  const equipments = LocalDb.getEquipments();

  // Combine custom logged-in operator if not present in DEFAULT_OPERATORS list
  const operators = useMemo(() => {
    const list = [...LocalDb.getOperators()];
    if (user && user.role === 'operador') {
      const exists = list.some(op => op.nome.toLowerCase() === user.name.toLowerCase());
      if (!exists) {
        list.push({
          id: user.id || 'dynamic-user-1',
          nome: user.name,
          matricula: 'AH-AUTO',
          setor: 'Logística Ativa',
          ativo: true
        });
      }
    }
    return list;
  }, [user]);

  // Selected header fields
  const [operator, setOperator] = useState('');
  const [equipment, setEquipment] = useState('');
  const [horimetro, setHorimetro] = useState('');
  const [ligando, setLigando] = useState<'OK' | 'NOK'>('OK');
  const [bateriaBarras, setBateriaBarras] = useState<number>(4);

  // States for the 17 Checklist Attributes
  // key: attribute_key, value: 'OK' | 'NOK'
  const [itemsStatus, setItemsStatus] = useState<Record<string, 'OK' | 'NOK'>>(() => {
    const initial: Record<string, 'OK' | 'NOK'> = {};
    CHECKLIST_ITEMS.forEach(i => {
      initial[i.key] = 'OK';
    });
    return initial;
  });

  // State for observation notes by key
  const [itemsObservations, setItemsObservations] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    CHECKLIST_ITEMS.forEach(i => {
      initial[i.key] = '';
    });
    return initial;
  });

  const [generalObservation, setGeneralObservation] = useState('');

  // Date/Time automatically set
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  // UI notifications
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-set operator to logged in user if they are an operator
  useEffect(() => {
    if (user && user.role === 'operador') {
      setOperator(user.name);
    }
  }, [user]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDate(now.toISOString().split('T')[0]);
      setCurrentTime(now.toTimeString().substring(0, 5));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Shortcut command to quickly mark everything as OK or NOK
  const handleMarkAll = (status: 'OK' | 'NOK') => {
    const updated: Record<string, 'OK' | 'NOK'> = {};
    CHECKLIST_ITEMS.forEach(i => {
      updated[i.key] = status;
    });
    setItemsStatus(updated);
    
    // Alert the user politely
    triggerToast(`Todos os 17 atributos marcados como ${status}!`, 'success');
  };

  const handleStatusToggle = (key: string, status: 'OK' | 'NOK') => {
    setItemsStatus(prev => ({
      ...prev,
      [key]: status
    }));
  };

  const handleObsChange = (key: string, text: string) => {
    setItemsObservations(prev => ({
      ...prev,
      [key]: text
    }));
  };

  const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3500);
  };

  // Submit operations
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!operator) {
      triggerToast('Por favor, selecione o operador responsável.', 'error');
      return;
    }
    if (!equipment) {
      triggerToast('Por favor, selecione qual veículo está sendo inspecionado.', 'error');
      return;
    }
    
    // Support Portuguese comma layout decimals safely
    const parsedHorimetroStr = horimetro ? horimetro.toString().trim() : '';
    const parsedHorimetro = Number(parsedHorimetroStr.replace(',', '.'));
    if (!parsedHorimetroStr || isNaN(parsedHorimetro) || parsedHorimetro < 0) {
      triggerToast('Por favor, digite uma leitura válida de Horímetro.', 'error');
      return;
    }

    // Verify if any NOK state lacks explanation
    let hasUnexplainedNok = false;
    CHECKLIST_ITEMS.forEach(item => {
      if (itemsStatus[item.key] === 'NOK' && !itemsObservations[item.key].trim()) {
        hasUnexplainedNok = true;
      }
    });

    if (hasUnexplainedNok) {
      triggerToast('Atenção: Descreva a não-conformidade (NOK) no campo de observação.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Find selected equipment metadata
      const selectedEquipmentMeta = equipments.find(eq => eq.patrimonio === equipment);
      const eqLabelOutput = selectedEquipmentMeta 
        ? `${selectedEquipmentMeta.nome} (${selectedEquipmentMeta.patrimonio})`
        : equipment;

      const newRecordsToAdd: ChecklistRecord[] = [];
      const timestamp = new Date().toISOString();

      // We log each checklist item inspected as a row with a unique UUID for database insertion
      CHECKLIST_ITEMS.forEach(item => {
        newRecordsToAdd.push({
          id: generateUUID(),
          created_at: timestamp,
          data: currentDate,
          hora: currentTime,
          operador: operator,
          equipamento: eqLabelOutput,
          item: item.label,
          status: itemsStatus[item.key],
          observacao: itemsObservations[item.key].trim(),
          patrimonio: equipment,
          horimetro: parsedHorimetro,
          ligando: ligando,
          bateria_barras: bateriaBarras
        });
      });

      // Insert any general remarks if filled out
      if (generalObservation.trim()) {
        newRecordsToAdd.push({
          id: generateUUID(),
          created_at: timestamp,
          data: currentDate,
          hora: currentTime,
          operador: operator,
          equipamento: eqLabelOutput,
          item: 'Observações Gerais',
          status: 'OK',
          observacao: generalObservation.trim(),
          patrimonio: equipment,
          horimetro: parsedHorimetro,
          ligando: ligando,
          bateria_barras: bateriaBarras
        });
      }

      // Save records locally (which triggers auto sync background attempts)
      LocalDb.saveRecords(newRecordsToAdd);

      // Play safe vibration cue for mobile operators if available
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }

      triggerToast('Checklist de Empilhadeira registrado com sucesso!', 'success');

      // Reset Form fields to empty as required
      setEquipment('');
      setHorimetro('');
      setLigando('OK');
      setBateriaBarras(4);
      setGeneralObservation('');
      
      const resetStatus: Record<string, 'OK' | 'NOK'> = {};
      const resetObs: Record<string, string> = {};
      CHECKLIST_ITEMS.forEach(i => {
        resetStatus[i.key] = 'OK';
        resetObs[i.key] = '';
      });
      setItemsStatus(resetStatus);
      setItemsObservations(resetObs);

      // Scroll smoothly back to top for immediate visual verification
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      triggerToast('Ocorreu uma falha interna ao salvar o registro.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6 relative">
      
      {/* Visual Floating Success/Error Alert Toast */}
      {showToast && (
        <div 
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-3 w-[90%] max-w-sm animate-fade-in text-xs font-semibold ${
            toastType === 'success' 
              ? 'bg-[#E6F7F8] border-[#1e3a8a] text-[#006970]' 
              : 'bg-[#FFDAD6] border-red-200 text-[#93000a]'
          }`}
        >
          {toastType === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-[#1e3a8a]" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600" />
          )}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Checklist Header Title */}
      <div>
              <h2 className="text-xl font-bold text-[#181C1E] tracking-tight flex items-center gap-2">
          <span>Novo Registro de Checklist</span>
        </h2>
        <p className="text-xs text-[#6C797B] mt-0.5">
          Formulário eletrônico rápido em substituição ao papel POP-ESTOQUE v1.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Automatic Information Block */}
        <section className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-sm grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C797B] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#1e3a8a]" />
              <span>data automática</span>
            </span>
            <p className="text-sm font-bold text-[#181C1E]">
              {currentDate ? currentDate.split('-').reverse().join('/') : '--/--/----'}
            </p>
          </div>

          <div className="space-y-1 text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C797B] flex justify-end items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#1e3a8a]" />
              <span>hora automática</span>
            </span>
            <p className="text-sm font-bold text-[#006970]">{currentTime || '--:--'}</p>
          </div>
        </section>

        {/* Master Identification Selectors */}
        <section className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#006970]">
            Identificação de Campo
          </h3>

          {/* Operator Select (Large clear mobile touch size) */}
          <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#3D494A] flex items-center gap-1" htmlFor="operator">
              <User className="w-3.5 h-3.5 text-[#1e3a8a]" />
              <span>Operador Responsável</span>
            </label>
            <select
              id="operator"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full h-12 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#181C1E]"
            >
              <option value="">Selecione o Operador...</option>
              {operators.map(op => (
                <option key={op.id} value={op.nome}>
                  {op.nome} - MAT {op.matricula} ({op.setor})
                </option>
              ))}
            </select>
          </div>

          {/* Forklift/Resource Select */}
          <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#3D494A] flex items-center gap-1" htmlFor="eq">
              <Truck className="w-3.5 h-3.5 text-[#1e3a8a]" />
              <span>Equipamento (Patrimônio)</span>
            </label>
            <select
              id="eq"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              className="w-full h-12 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#181C1E]"
            >
              <option value="">Selecione a Empilhadeira...</option>
              {equipments.map(eq => (
                <option key={eq.id} value={eq.patrimonio}>
                  {eq.patrimonio} - {eq.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Horímetro input */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-[#3D494A] flex items-center gap-1" htmlFor="horimetro">
                <Gauge className="w-3.5 h-3.5 text-[#1e3a8a]" />
                <span>Horímetro Atual (h)</span>
              </label>
              <input
                id="horimetro"
                type="text"
                inputMode="decimal"
                placeholder="Ex: 1208,5"
                value={horimetro}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9.,]/g, '');
                  setHorimetro(cleaned);
                }}
                className="w-full h-12 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#181C1E] focus:outline-none focus:border-[#006970]"
              />
            </div>

            {/* Test starting state */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#3D494A] flex items-center gap-1" htmlFor="ignition">
                <Power className="w-3.5 h-3.5 text-[#1e3a8a]" />
                <span>Ligando?</span>
              </label>
              <div className="grid grid-cols-2 gap-1 bg-[#F8FAFC] p-1 rounded-lg border border-[#E2E8F0] h-12">
                <button
                  type="button"
                  onClick={() => setLigando('OK')}
                  className={`rounded text-xs font-bold transition-all shrink-0 flex items-center justify-center ${
                    ligando === 'OK' 
                      ? 'bg-[#E6F7F8] text-[#006970] border border-[#1e3a8a]' 
                      : 'text-[#6C797B]'
                  }`}
                >
                  SIM
                </button>
                <button
                  type="button"
                  onClick={() => setLigando('NOK')}
                  className={`rounded text-xs font-bold transition-all shrink-0 flex items-center justify-center ${
                    ligando === 'NOK' 
                      ? 'bg-[#003366] text-white' 
                      : 'text-[#6C797B]'
                  }`}
                >
                  NÃO
                </button>
              </div>
            </div>
          </div>

          {/* Battery level selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#3D494A] flex items-center gap-1">
              <Battery className="w-3.5 h-3.5 text-[#1e3a8a]" />
              <span>Nível da Carga da Bateria (Barras)</span>
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBateriaBarras(b)}
                  className={`h-11 rounded-lg font-bold text-xs border transition-colors cursor-pointer flex flex-col items-center justify-center ${
                    bateriaBarras === b
                      ? 'bg-[#006970] text-white border-[#006970]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#3D494A] hover:bg-gray-100'
                  }`}
                >
                  <span>{b}</span>
                  <span className="text-[7px] opacity-75">{b === 5 ? 'Cheio' : `${b} B`}</span>
                </button>
              ))}
            </div>
          </div>

        </section>

        {/* The 17 Checklist inspection items section */}
        <section className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F4F6] pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#006970]">
                Itens de Inspeção (17 Itens)
              </h3>
              <p className="text-[10px] text-[#6C797B]">Selecione o estado de cada dispositivo.</p>
            </div>
            {/* Shortcut triggers */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleMarkAll('OK')}
                className="bg-[#E6F7F8] hover:bg-[#dfe8fb] border border-[#1e3a8a] text-[#006970] px-2.5 py-1.5 rounded text-[10px] font-bold tracking-wide cursor-pointer transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#1e3a8a]" />
                <span>MARCAR TODOS OK</span>
              </button>
            </div>
          </div>

          <div className="space-y-4 divide-y divide-[#F1F4F6]">
            {CHECKLIST_ITEMS.map((item, index) => {
              const itemStatus = itemsStatus[item.key];
              const obsValue = itemsObservations[item.key];

              const categoryLabels: Record<string, { bg: string, text: string, name: string }> = {
                'Eletrico': { bg: 'bg-[#E6F7F8]', text: 'text-[#006970]', name: 'ELÉTRICO' },
                'Mecanico': { bg: 'bg-indigo-50', text: 'text-indigo-700', name: 'MECÂNICO' },
                'Seguranca': { bg: 'bg-amber-50', text: 'text-amber-800', name: 'SEGURANÇA' },
                'Limpeza': { bg: 'bg-emerald-50', text: 'text-emerald-800', name: 'CONSERVAÇÃO' }
              };
              const cat = categoryLabels[item.categoria] || { bg: 'bg-gray-100', text: 'text-gray-700', name: 'DIVERSOS' };

              return (
                <div key={item.key} className={`pt-4 first:pt-0 space-y-2.5 ${itemStatus === 'NOK' ? 'bg-red-50/15 -mx-4 px-4 py-2 rounded-lg' : ''}`}>
                  
                  {/* Item Description */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className={`inline-block text-[8px] font-bold px-1.5 py-0.2 rounded ${cat.bg} ${cat.text} tracking-wider`}>
                        {cat.name}
                      </span>
                      <h4 className="text-sm font-semibold text-[#181C1E]">{item.label}</h4>
                    </div>

                    {/* Giant toggle buttons */}
                    <div className="grid grid-cols-2 gap-1 bg-[#F8FAFC] p-1 rounded-lg border border-[#E2E8F0] w-36 h-10 select-none">
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(item.key, 'OK')}
                        className={`rounded text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-0.5 ${
                          itemStatus === 'OK'
                            ? 'bg-[#E6F7F8] text-[#006970] border border-[#1e3a8a]'
                            : 'text-[#6C797B]'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>OK</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(item.key, 'NOK')}
                        className={`rounded text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-0.5 ${
                          itemStatus === 'NOK'
                            ? 'bg-[#003366] text-white font-bold'
                            : 'text-[#6C797B]'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>NOK</span>
                      </button>
                    </div>
                  </div>

                  {/* Conditional Observation Field when NOK */}
                  {itemStatus === 'NOK' && (
                    <div className="bg-[#FFF8F8] border border-red-150 p-3 rounded-lg space-y-2 animate-fade-in transition-all">
                      <label className="text-[11px] font-bold text-[#BA1A1A] block uppercase tracking-wide">
                        * DESCREVA O DETALHE DA AVARIA / FALHA:
                      </label>
                      <textarea
                        rows={2}
                        value={obsValue}
                        onChange={(e) => handleObsChange(item.key, e.target.value)}
                        placeholder="Ex: Mangueira apresentando vazamento de óleo ou buzina sem sinal sonoro..."
                        className="w-full text-xs p-2.5 bg-white border border-red-200 rounded focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 text-black leading-relaxed"
                      />
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </section>

        {/* Global Remarks Textarea */}
        <section className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-sm space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#006970] block" htmlFor="general-obs">
            Observações Gerais (Opcional)
          </label>
          <textarea
            id="general-obs"
            rows={3}
            value={generalObservation}
            onChange={(e) => setGeneralObservation(e.target.value)}
            placeholder="Relate observações gerais do turno ou pendências técnicas da empilhadeira..."
            className="w-full text-xs p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#006970]"
          />
        </section>

        {/* Submission Execution Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 bg-[#1e3a8a] hover:bg-[#152e72] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer shadow-md disabled:opacity-70"
          >
            <Save className="w-5 h-5" />
            <span>Salvar Checklist Operacional</span>
          </button>
          <p className="text-center text-[10px] text-[#6C797B] mt-3">
            Ao salvar, o checklist é registrado localmente e enviado para o painel de BI.
          </p>
        </div>

      </form>

    </div>
  );
}
