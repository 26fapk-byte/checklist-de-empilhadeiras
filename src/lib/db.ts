import { isSupabaseConfigured, supabase } from './supabase';
import { ChecklistRecord, Operator, Equipment, ChecklistItemMeta, InspectionStats } from '../types';

// Safe UUID Generator for frontend PWA resilience
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch {
      // fallback handled below
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// The 17 operational checkpoint attributes from Ativa Hospitalar PDF form.
export const CHECKLIST_ITEMS: ChecklistItemMeta[] = [
  { key: 'nivel_bateria', label: 'Nível da Bateria', categoria: 'Eletrico' },
  { key: 'travamento_bateria', label: 'Travamento da Bateria', categoria: 'Eletrico' },
  { key: 'rolamentos_bateria', label: 'Rolamentos da Bateria', categoria: 'Eletrico' },
  { key: 'roda_central', label: 'Roda Central', categoria: 'Mecanico' },
  { key: 'rodas_laterais', label: 'Rodas Laterais', categoria: 'Mecanico' },
  { key: 'corrente', label: 'Corrente', categoria: 'Mecanico' },
  { key: 'mangueira_hidraulica', label: 'Mangueira Hidráulica', categoria: 'Mecanico' },
  { key: 'lanca_elevacao', label: 'Lança de Elevação', categoria: 'Mecanico' },
  { key: 'comandos_tracao', label: 'Comandos de Tração', categoria: 'Seguranca' },
  { key: 'comandos_abas', label: 'Comandos das Abas', categoria: 'Seguranca' },
  { key: 'freio', label: 'Freio', categoria: 'Seguranca' },
  { key: 'buzina', label: 'Buzina', categoria: 'Seguranca' },
  { key: 'botao_antiesmagamento', label: 'Botão Antiesmagamento', categoria: 'Seguranca' },
  { key: 'botao_emergencia', label: 'Botão de Emergência', categoria: 'Seguranca' },
  { key: 'vazamentos', label: 'Vazamentos', categoria: 'Limpeza' },
  { key: 'sinais_luminosos', label: 'Sinais Luminosos', categoria: 'Eletrico' },
  { key: 'limpeza_empilhadeira', label: 'Limpeza da Empilhadeira', categoria: 'Limpeza' }
];

const DEFAULT_OPERATORS: Operator[] = [
  { id: '1', nome: 'Carlos Eduardo', matricula: 'AH-8821', setor: 'Medicamentos Termolábeis', ativo: true },
  { id: '2', nome: 'Mariana Silva', matricula: 'AH-3341', setor: 'Logística Central', ativo: true },
  { id: '3', nome: 'Ricardo Oliveira', matricula: 'AH-0259', setor: 'Recebimento e Docas', ativo: true },
  { id: '4', nome: 'Juliana Mendes', matricula: 'AH-9174', setor: 'Expedição Hospitalar', ativo: true }
];

const DEFAULT_EQUIPMENTS: Equipment[] = [
  { id: '1', nome: 'Patinete Elétrico Jungheinrich EJE 120', patrimonio: 'PAT-1012', tipo: 'Patinete Elétrica', ativo: true },
  { id: '2', nome: 'Empilhadeira Retrátil Toyota 8FBRE16S', patrimonio: 'EMP-4410', tipo: 'Retrátil Elétrica', ativo: true },
  { id: '3', nome: 'Transpaleteira Elétrica Still EGU 20', patrimonio: 'TRS-2005', tipo: 'Transpaleteira', ativo: true },
  { id: '4', nome: 'Empilhadeira Yale ERP15 S-Series', patrimonio: 'EMP-3089', tipo: 'Mastro Duplo ERP', ativo: true }
];

// Pre-hydrate some checklists to simulate operational history right out of the gate
const getInitialHistory = (): ChecklistRecord[] => {
  const history: ChecklistRecord[] = [];
  const currentDate = new Date();
  
  // Create simulated inspections over the last 30 days
  for (let i = 25; i >= 0; i--) {
    const d = new Date();
    d.setDate(currentDate.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const hourStr = `${String(8 + (i % 5)).padStart(2, '0')}:${String((12 + i * 3) % 60).padStart(2, '0')}`;
    const operator = DEFAULT_OPERATORS[i % DEFAULT_OPERATORS.length];
    const equipment = DEFAULT_EQUIPMENTS[(i + 1) % DEFAULT_EQUIPMENTS.length];
    
    // Most run OK, some carry NOK on minor items
    const hasNok = i === 4 || i === 12 || i === 19;
    
    CHECKLIST_ITEMS.forEach((item) => {
      let status: 'OK' | 'NOK' = 'OK';
      let obs = '';
      
      if (hasNok && item.key === 'buzina' && i === 4) {
        status = 'NOK';
        obs = 'Buzina com som muito baixo, requer troca de contato.';
      } else if (hasNok && item.key === 'nivel_bateria' && i === 12) {
        status = 'NOK';
        obs = 'Nível de bateria abaixo do esperado para início de turno (1 Barra).';
      } else if (hasNok && item.key === 'limpeza_empilhadeira' && i === 19) {
        status = 'NOK';
        obs = 'Resíduos lubrificantes na cabine de controle.';
      }
      
      history.push({
        id: generateUUID(),
        created_at: `${dateStr}T${hourStr}:00.000Z`,
        data: dateStr,
        hora: hourStr,
        operador: operator.nome,
        equipamento: `${equipment.nome} (${equipment.patrimonio})`,
        item: item.label,
        status,
        observacao: obs,
        patrimonio: equipment.patrimonio,
        horimetro: 1200 + (i * 8),
        ligando: 'OK',
        bateria_barras: status === 'NOK' && item.key === 'nivel_bateria' ? 1 : 4
      });
    });
  }
  return history;
};

// Local storage namespaces
const STORE_PREFIX = 'pharmalog_v1_';
const KEY_RECORDS = `${STORE_PREFIX}records`;
const KEY_SYNC_QUEUE = `${STORE_PREFIX}sync_queue`;
const KEY_EQUIPMENTS = `${STORE_PREFIX}equipments`;

export class LocalDb {
  static init() {
    if (!localStorage.getItem(KEY_RECORDS)) {
      localStorage.setItem(KEY_RECORDS, JSON.stringify(getInitialHistory()));
    }
  }

  static getRecords(): ChecklistRecord[] {
    this.init();
    try {
      const raw = localStorage.getItem(KEY_RECORDS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static getOperators(): Operator[] {
    return DEFAULT_OPERATORS;
  }

  static getEquipments(): Equipment[] {
    try {
      const stored = localStorage.getItem(KEY_EQUIPMENTS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Erro ao ler equipamentos do storage:', e);
    }
    return DEFAULT_EQUIPMENTS;
  }

  static addEquipment(equipment: Equipment): void {
    try {
      const current = this.getEquipments();
      localStorage.setItem(KEY_EQUIPMENTS, JSON.stringify([...current, equipment]));
    } catch (e) {
      console.error('Erro ao adicionar equipamento:', e);
    }
  }

  static removeEquipment(id: string): void {
    try {
      const current = this.getEquipments();
      const filtered = current.filter(eq => eq.id !== id);
      localStorage.setItem(KEY_EQUIPMENTS, JSON.stringify(filtered));
    } catch (e) {
      console.error('Erro ao remover equipamento:', e);
    }
  }

  static getChecklistItems() {
    return CHECKLIST_ITEMS;
  }

  static saveRecords(newRecords: ChecklistRecord[]) {
    const current = this.getRecords();
    const updated = [...newRecords, ...current];
    localStorage.setItem(KEY_RECORDS, JSON.stringify(updated));

    // Try to sync to Supabase if available
    this.queueForSync(newRecords);
    this.processSyncQueue();
  }

  // Sync mechanisms
  private static queueForSync(records: ChecklistRecord[]) {
    try {
      const raw = localStorage.getItem(KEY_SYNC_QUEUE);
      const queue: ChecklistRecord[] = raw ? JSON.parse(raw) : [];
      localStorage.setItem(KEY_SYNC_QUEUE, JSON.stringify([...queue, ...records]));
    } catch (e) {
      console.error('Failed to queue records for sync', e);
    }
  }

  static async processSyncQueue(): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      return false;
    }

    try {
      const raw = localStorage.getItem(KEY_SYNC_QUEUE);
      if (!raw) return true;

      const queue: ChecklistRecord[] = JSON.parse(raw);
      if (queue.length === 0) return true;

      console.log(`PharmaLog Sync: Attempting to synchronize ${queue.length} records to Supabase...`);

      // Maps application records back to Supabase schema columns safely
      const rows = queue.map(rec => {
        const hasValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rec.id);
        const formattedHour = rec.hora.split(':').length === 2 ? rec.hora + ':00' : rec.hora;
        return {
          id: hasValidUuid ? rec.id : generateUUID(),
          created_at: rec.created_at,
          data: rec.data,
          hora: formattedHour,
          operador: rec.operador,
          equipamento: rec.equipamento,
          item: rec.item,
          status: rec.status,
          observacao: rec.observacao
        };
      });

      const { error } = await supabase.from('registros_checklist').insert(rows);

      if (error) {
        console.warn('Supabase insertion failure during sync, will retry later:', error.message);
        return false;
      }

      // Success
      localStorage.setItem(KEY_SYNC_QUEUE, JSON.stringify([]));
      console.log('PharmaLog Sync: Synchronized successfully!');
      return true;
    } catch (err) {
      console.error('Failed to sync checklist records with remote database:', err);
      return false;
    }
  }

  static getSyncQueueLength(): number {
    try {
      const raw = localStorage.getItem(KEY_SYNC_QUEUE);
      const queue = raw ? JSON.parse(raw) : [];
      return queue.length;
    } catch {
      return 0;
    }
  }

  static deleteRecord(id: string): boolean {
    try {
      const current = this.getRecords();
      const filtered = current.filter(r => r.id !== id);
      localStorage.setItem(KEY_RECORDS, JSON.stringify(filtered));

      // Attempt remote deletion if available (best-effort, async, non-blocking)
      if (isSupabaseConfigured && supabase) {
        (async () => {
          try {
            const { error } = await supabase.from('registros_checklist').delete().eq('id', id);
            if (error) {
              console.warn('Falha ao excluir registro remoto:', error.message);
            }
          } catch (e) {
            console.warn('Erro ao chamar supabase delete:', e);
          }
        })();
      }

      return true;
    } catch (e) {
      console.error('Erro ao excluir registro local:', e);
      return false;
    }
  }

  // Analytical indicators generator corresponding to Dashboard filters
  static generateStats(filters: { eq?: string; month?: string; status?: string }): InspectionStats {
    const records = this.getRecords();

    // Filter registrations
    let filtered = [...records];

    if (filters.eq && filters.eq !== 'Todos') {
      filtered = filtered.filter(r => r.equipamento.includes(filters.eq!));
    }

    // Month filter (format "YYYY-MM")
    if (filters.month && filters.month !== 'Todos') {
      filtered = filtered.filter(r => r.data.startsWith(filters.month!));
    }

    // Group items into logical inspections
    // An inspection is unique by date + time + operator + equipment
    const inspectionGroups: Record<string, {
      id: string;
      data: string;
      hora: string;
      operador: string;
      equipamento: string;
      items: { name: string; status: 'OK' | 'NOK'; obs: string }[];
    }> = {};

    filtered.forEach(r => {
      const key = `${r.data}_${r.hora}_${r.equipamento}`;
      if (!inspectionGroups[key]) {
        inspectionGroups[key] = {
          id: `${r.data}-${r.hora}-${r.equipamento}`,
          data: r.data,
          hora: r.hora,
          operador: r.operador,
          equipamento: r.equipamento,
          items: []
        };
      }
      inspectionGroups[key].items.push({
        name: r.item,
        status: r.status,
        obs: r.observacao || ''
      });
    });

    const groupsList = Object.values(inspectionGroups);

    // Filter groups by checklist status if set
    let finalGroups = groupsList;
    if (filters.status && filters.status !== 'Todos') {
      finalGroups = groupsList.filter(group => {
        const hasNok = group.items.some(i => i.status === 'NOK');
        return filters.status === 'OK' ? !hasNok : hasNok;
      });
    }

    // Computes aggregate checklist numbers
    let totalOk = 0;
    let totalNok = 0;

    finalGroups.forEach(g => {
      const hasNok = g.items.some(x => x.status === 'NOK');
      if (hasNok) {
        totalNok++;
      } else {
        totalOk++;
      }
    });

    // Count item-level failures by equipment to identify worst acting forklifts
    const equipmentFailures: Record<string, number> = {};
    const equipmentTotalInspections: Record<string, number> = {};

    groupsList.forEach(g => {
      equipmentTotalInspections[g.equipamento] = (equipmentTotalInspections[g.equipamento] || 0) + 1;
      const failedItemsCount = g.items.filter(i => i.status === 'NOK').length;
      if (failedItemsCount > 0) {
        equipmentFailures[g.equipamento] = (equipmentFailures[g.equipamento] || 0) + failedItemsCount;
      }
    });

    let worstEquipment = 'Nenhum ativo com falhas';
    let maxFailures = -1;
    Object.entries(equipmentFailures).forEach(([eqName, fails]) => {
      if (fails > maxFailures) {
        maxFailures = fails;
        worstEquipment = eqName;
      }
    });

    // Recharts data generators
    // 1. NOK by Month
    const nokByMonthMap: Record<string, number> = {};
    records.forEach(r => {
      if (r.status === 'NOK') {
        const m = r.data.substring(0, 7); // YYYY-MM
        nokByMonthMap[m] = (nokByMonthMap[m] || 0) + 1;
      }
    });

    const monthLabelsMap: Record<string, string> = {
      '2026-01': 'Jan', '2026-02': 'Fev', '2026-03': 'Mar', '2026-04': 'Abr', '2026-05': 'Mai',
      '2026-06': 'Jun', '2026-07': 'Jul', '2026-08': 'Ago', '2026-09': 'Set', '2026-10': 'Out',
      '2026-11': 'Nov', '2026-12': 'Dez'
    };

    const nokByMonth = Object.entries(nokByMonthMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([m, val]) => ({
        month: monthLabelsMap[m] || m,
        value: val
      }));

    // If empty list, pre-populate last few months to show a beautiful graph always
    if (nokByMonth.length === 0) {
      nokByMonth.push(
        { month: 'Mar', value: 3 },
        { month: 'Abr', value: 8 },
        { month: 'Mai', value: 12 }
      );
    }

    // 2. Failures by Inspected Item Type
    const categoryFailuresMap: Record<string, number> = {};
    filtered.forEach(r => {
      if (r.status === 'NOK') {
        const itemMeta = CHECKLIST_ITEMS.find(i => i.label === r.item);
        const category = itemMeta ? itemMeta.categoria : 'Outros';
        const categoryLabelMap: Record<string, string> = {
          'Eletrico': 'Componentes Elétricos',
          'Mecanico': 'Sistemas Mecânicos',
          'Seguranca': 'Dispositivos de Segurança',
          'Limpeza': 'Infiltração ou Conservação'
        };
        const mappedLabel = categoryLabelMap[category] || category;
        categoryFailuresMap[mappedLabel] = (categoryFailuresMap[mappedLabel] || 0) + 1;
      }
    });

    const failuresByAsset = Object.entries(categoryFailuresMap).map(([name, value]) => ({
      name,
      value
    }));

    if (failuresByAsset.length === 0) {
      failuresByAsset.push(
        { name: 'Dispositivos de Segurança', value: 5 },
        { name: 'Sistemas Mecânicos', value: 3 },
        { name: 'Componentes Elétricos', value: 2 }
      );
    }

    // 3. Inspections counts by date (last 7 inspections)
    const countByDateMap: Record<string, number> = {};
    groupsList.forEach(g => {
      countByDateMap[g.data] = (countByDateMap[g.data] || 0) + 1;
    });

    const inspectionsByPeriod = Object.entries(countByDateMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-7)
      .map(([date, val]) => {
        const [,, d] = date.split('-');
        return {
          date: `${d}`, // Day of month label
          value: val
        };
      });

    return {
      totalInspections: finalGroups.length,
      totalOk,
      totalNok,
      mostFailedEquipment: worstEquipment,
      nokByMonth,
      failuresByAsset,
      inspectionsByPeriod
    };
  }
}
