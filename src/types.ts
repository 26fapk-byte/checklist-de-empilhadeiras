/**
 * Types definition for the Forklift Checklist system (PharmaLog).
 */

export interface ChecklistRecord {
  id: string;
  created_at: string;
  data: string; // YYYY-MM-DD format
  hora: string; // HH:mm format
  operador: string;
  equipamento: string;
  item: string; // The specific attribute inspected (e.g., "Nível da Bateria", "Buzina", or "Geral")
  status: 'OK' | 'NOK';
  observacao: string; // Optional notes/comments
  patrimonio?: string; // Optional asset ID
  horimetro?: number; // Hours record
  ligando?: 'OK' | 'NOK'; // Start connection test
  bateria_barras?: number; // 1 to 5 level indicator
}

export interface Operator {
  id: string;
  nome: string;
  matricula: string;
  setor: string;
  ativo: boolean;
}

export interface Equipment {
  id: string;
  nome: string;
  patrimonio: string;
  tipo: string;
  ativo: boolean;
}

export interface ChecklistItemMeta {
  key: string;
  label: string;
  categoria: 'Eletrico' | 'Mecanico' | 'Seguranca' | 'Limpeza';
}

export interface InspectionStats {
  totalInspections: number;
  totalOk: number;
  totalNok: number;
  mostFailedEquipment: string;
  nokByMonth: { month: string; value: number }[];
  failuresByAsset: { name: string; value: number }[];
  inspectionsByPeriod: { date: string; value: number }[];
}
