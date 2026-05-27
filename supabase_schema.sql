-- ==========================================
-- PHARMALOG - SISTEMA DE CHECKLIST OPERACIONAL
-- SCRIPT DE CONFIGURAÇÃO DE BANCO DE DADOS (SUPABASE SQL)
-- ==========================================

-- 1. Criação da tabela registros_checklist
CREATE TABLE IF NOT EXISTS public.registros_checklist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    data DATE DEFAULT current_date NOT NULL,
    hora TIME DEFAULT (current_time AT TIME ZONE 'UTC') NOT NULL,
    operador VARCHAR(255) NOT NULL,
    equipamento VARCHAR(255) NOT NULL,
    item VARCHAR(255) NOT NULL,
    status VARCHAR(10) CHECK (status IN ('OK', 'NOK')) NOT NULL,
    observacao TEXT DEFAULT '' NOT NULL,
    user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2. Ativação de RLS (Row Level Security) para segurança cibernética
ALTER TABLE public.registros_checklist ENABLE ROW LEVEL SECURITY;

-- 3. Criação de políticas (Policies) de acesso
-- Permite que operadores autenticados insiram novos registros
CREATE POLICY "Permite insercoes para operadores autenticados" 
ON public.registros_checklist 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Permite que operadores e gerentes visualizem todos os registros da frota
CREATE POLICY "Permite leitura geral para usuarios autenticados" 
ON public.registros_checklist 
FOR SELECT 
TO authenticated 
USING (true);

-- Permite deleção/reparação apenas por administradores ou gerentes se for desejado (Opcional - por padrão bloqueado)

-- 4. Criação de índices para otimização de buscas operacionais no BI e Power BI
CREATE INDEX IF NOT EXISTS idx_checklist_data_equipamento ON public.registros_checklist (data, equipamento);
CREATE INDEX IF NOT EXISTS idx_checklist_status ON public.registros_checklist (status);
CREATE INDEX IF NOT EXISTS idx_checklist_operador ON public.registros_checklist (operador);

-- 5. Instruções Adicionais de Conectividade
-- Cole as seguintes variáveis no painel de segredos do Vercel ou no arquivo .env local:
-- VITE_SUPABASE_URL=Sua_URL_do_Projeto_Supabase
-- VITE_SUPABASE_ANON_KEY=Sua_Chave_Anonima_do_Projeto_Supabase
