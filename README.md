# PharmaLog Forklift Checklist - Ativa Hospitalar 🇨🇧🩺

Este é um sistema **PWA (Progressive Web App)** moderno, mobile-first e de usabilidade simplificada, otimizado para o registro diário de conformidade operacional das empilhadeiras de logística hospitalar e farmacêutica da Ativa Hospitalar (POP-ESTOQUE Versão 1).

O sistema substitui formulários em papel por registros digitais instantâneos de alta velocidade, suportando operações estáveis mesmo offline (sem internet).

---

## 🚀 Funcionalidades Principais

* **Velocidade de Entrada Máxima (Check Completo em 2 Cliques):** Dispõe do atalho *"MARCAR TODOS COMO OK"*, preenchendo os 17 atributos do formulário instantaneamente. O operador somente altera para NOK o item que apresentar avaria e preenche a descrição.
* **Resiliência Offline (Offline-First):** Salvamento local instantâneo via cache do Navegador. Um contador dinâmico indica quantos registros estão pendentes e sincroniza em lote automaticamente assim que a rede retornar.
* **Instalação PWA Ativa:** Compatível com Android e iOS, pode ser adicionado à tela inicial como um aplicativo nativo com splash screen e ícone corporativo.
* **Arquitetura Voltada para BI (Power BI):** Cada formulário submetido salva o histórico individualizado por dispositivo, facilitando o cálculo de taxas de conformidade e auditorias da Vigilância Sanitária.

---

## 🛠️ Stack Tecnológica

* **Framework:** React 19 (com TypeScript)
* **Build Tool:** Vite & Tailwind CSS v4 (Tema Clínico Hospitalar de alto contraste)
* **Banco de Dados (Real):** Supabase (PostgreSQL) com RLS integrado
* **Form Engine:** React Hook Form
* **Visualização:** Recharts (Indicadores, Tendências Mensais de Falha e Gráficos de Área)
* **Biblioteca de Ícones:** Lucide Icons

---

## 📦 Instruções de Instalação e Execução Local

### Pré-requisitos
* Ter o **Node.js** instalado (versão 18 ou superior).

### 1. Clonar e Instalar Dependências
```bash
# Navegue até o diretório do projeto
npm install
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:
```env
# Configurações do Supabase para Sincronização em Nuvem (Produção)
VITE_SUPABASE_URL="https://seu_projeto.supabase.co"
VITE_SUPABASE_ANON_KEY="sua_chave_anonima_aqui"
```
*Se você deixar o arquivo `.env` sem as chaves, o sistema continuará funcionando perfeitamente em modo de demonstração local usando LocalStorage.*

### 3. Rodar o Servidor de Desenvolvimento
```bash
npm run dev
```
Abra o navegador em `http://localhost:3000` ou no endereço fornecido pelo terminal do Vite.

---

## 🗄️ Integração com o Supabase (Configuração da Nuvem)

### 1. Criar a Tabela e Políticas RLS
Abra o painel do seu projeto no Supabase, vá em **SQL Editor** e cole o script completo fornecido no arquivo raiz `/supabase_schema.sql`.

### 2. Autenticação Operacional (Users)
Adicione os e-mails dos seus operadores na seção **Auth > Users** no painel do Supabase. O sistema está preparado para autenticar as senhas em lote de maneira segura.

---

## 🌐 Deploy Rápido na Vercel

1. Comprima o diretório em ZIP ou envie para um repositório no **GitHub**.
2. Acesse a [Vercel](https://vercel.com) e conecte com seu repositório.
3. No painel de configuração do deploy na Vercel:
   * **Framework Preset:** Vite
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
4. Expanda a seção **Environment Variables** e cole suas credenciais:
   * `VITE_SUPABASE_URL`
   * `VITE_SUPABASE_ANON_KEY`
5. Clique em **Deploy** e seu PWA estará ao vivo e pronto para instalação em smartphones.
