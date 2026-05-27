# 🏗️ ARQUITETURA TÉCNICA DO PHARMALOG - DIAGRAMAS

---

## DIAGRAMA 1: FLUXO DE AUTENTICAÇÃO

```
┌─────────────────────────────────────────────────────────┐
│                    PHARMALOG LOGIN FLOW                  │
└─────────────────────────────────────────────────────────┘

   Usuário                    Frontend                   Backend
      │                           │                        │
      │ Acessa localhost:3000     │                        │
      ├──────────────────────────>│                        │
      │                           │                        │
      │                    [Login.tsx]                     │
      │                           │                        │
      │  email + password         │                        │
      ├──────────────────────────>│                        │
      │                           │ POST /auth/signin      │
      │                           ├───────────────────────>│
      │                           │                     [Supabase Auth]
      │                           │<───────────────────────┤
      │                           │ ✅ session + user      │
      │                           │                        │
      │ [AuthContext]             │                        │
      │ Define role: master/      │                        │
      │ gerente/operador          │                        │
      │<──────────────────────────┤                        │
      │                           │                        │
      │ ✅ Autenticado!           │                        │
      │                           │                        │
      ├─────────────────┐         │                        │
      │ Role = master?  │         │                        │
      │ → Dashboard     │         │                        │
      │ Role = operador │         │                        │
      │ → NewRecord     │         │                        │
      └─────────────────┘         │                        │


┌─────────────────────────────────────────────────────────┐
│              ROLE DETECTION BY EMAIL DOMAIN               │
└─────────────────────────────────────────────────────────┘

Email: flavio@ativa.com → 🔴 MASTER
Email: carlos@ativa.com → 🟡 GERENTE
Email: joao@gmail.com   → 🟢 OPERADOR
```

---

## DIAGRAMA 2: SINCRONIZAÇÃO OFFLINE-FIRST

```
┌───────────────────────────────────────────────────────────────┐
│                  OFFLINE-FIRST SYNCHRONIZATION                │
└───────────────────────────────────────────────────────────────┘

╔═════════════════════════════════════════════════════════════╗
║                      DISPOSITIVO LOCAL                      ║
║                                                              ║
║  ┌──────────────────────────────────────────────────────┐   ║
║  │              LocalStorage (pharmalog_v1_)            │   ║
║  │  - records: [checklist1, checklist2, ...]            │   ║
║  │  - equipments: [equip1, equip2, ...]                 │   ║
║  │  - sync_queue: [pendingRecord1, ...]                 │   ║
║  └──────────────────────────────────────────────────────┘   ║
║                           ↕                                   ║
║  ┌──────────────────────────────────────────────────────┐   ║
║  │                  Service Worker                      │   ║
║  │  - Cache assets (index.html, CSS, JS)                │   ║
║  │  - Fallback offline para navegação                   │   ║
║  │  - Serve cached quando offline                       │   ║
║  └──────────────────────────────────────────────────────┘   ║
║                           ↕                                   ║
║  ┌──────────────────────────────────────────────────────┐   ║
║  │                React App (NewRecord)                 │   ║
║  │  1. Usuário cria novo checklist                      │   ║
║  │  2. Salva em LocalStorage imediatamente              │   ║
║  │  3. Mostrador: "5 registros pendentes de sync"       │   ║
║  └──────────────────────────────────────────────────────┘   ║
║                           │                                   ║
╚───────────────────────────┼───────────────────────────────────╝
                            │
                    ┌───────▼────────┐
                    │  Conectado?    │
                    └────────────────┘
                       │         │
                    ✅ Sim     ❌ Não
                       │         │
                    ┌──▼──┐    └─→ [Fica offline]
                    │                [Aguarda reconexão]
                    │
      ┌─────────────▼──────────────┐
      │   SINCRONIZAÇÃO EM LOTE    │
      │  (db.processSyncQueue())   │
      │                             │
      │  for each record in queue:  │
      │    POST /registros_insert   │
      │      ↓                       │
      └────────────────────┬────────┘
                           │
                      ┌────▼────────────────────┐
                      │  SUPABASE (Cloud DB)    │
                      │                         │
                      │  registros_checklist    │
                      │  ├─ id (UUID)           │
                      │  ├─ data                │
                      │  ├─ hora                │
                      │  ├─ operador            │
                      │  ├─ equipamento         │
                      │  ├─ 17x item+status     │
                      │  ├─ observacao          │
                      │  └─ patrimonio          │
                      │                         │
                      └───────────────────────────┘
                           │
                           ✅ Sync completo!
                           └─→ Remover sync_queue local
                               Mostrador: "Sincronizado"
```

---

## DIAGRAMA 3: ESTRUTURA DE DADOS - CHECKLIST RECORD

```
┌─────────────────────────────────────────────────────────────┐
│                   CHECKLIST RECORD STRUCTURE                │
└─────────────────────────────────────────────────────────────┘

ChecklistRecord {
  id: "550e8400-e29b-41d4-a716-446655440000"  ← UUID único
  
  TIMESTAMP:
  created_at: "2026-12-15T14:30:45.000Z"  ← quando foi criado
  data: "2026-12-15"                      ← data em YYYY-MM-DD
  hora: "14:30"                           ← hora em HH:mm
  
  CONTEXTO:
  operador: "Carlos Eduardo"              ← nome do operador
  equipamento: "Empilhadeira Toyota EMP-4410"
  patrimonio: "EMP-4410"                  ← ID único do ativo
  
  INSPECÇÃO (repetido para cada item):
  item: "Nível da Bateria"
  status: "OK" | "NOK"                    ← Bom ou Ruim
  observacao: "Bateria com apenas 1 barra"  ← Anotações
  
  METADATA:
  horimetro: 1234                         ← horas de uso do ativo
  ligando: "OK"                           ← consegue ligar?
  bateria_barras: 4                       ← 1-5 barras indicador
  
  user_id: "uuid-do-supabase"             ← quem criou
}

⚠️ OBS: Há 17 LINHAS no BD (uma por item):
  1. nivel_bateria
  2. travamento_bateria
  3. rolamentos_bateria
  4. roda_central
  5. rodas_laterais
  6. corrente
  7. mangueira_hidraulica
  8. lanca_elevacao
  9. comandos_tracao
  10. comandos_abas
  11. freio
  12. buzina
  13. botao_antiesmagamento
  14. botao_emergencia
  15. vazamentos
  16. sinais_luminosos
  17. limpeza_empilhadeira
```

---

## DIAGRAMA 4: FLUXO DE CRIAÇÃO DE NOVO CHECKLIST

```
┌──────────────────────────────────────────────────────────┐
│         NOVO CHECKLIST - FLUXO COMPLETO                  │
└──────────────────────────────────────────────────────────┘

Operador abre app
      ↓
[NewRecord Page]
      ↓
┌─────────────────────────────────────────┐
│ Step 1: SELEÇÃO BÁSICA                  │
├─────────────────────────────────────────┤
│ ✓ Operador: [Carlos Eduardo▼]           │
│ ✓ Equipamento: [Empilhadeira EMP-4410▼] │
│ ✓ Data: 2026-12-15 (auto)               │
│ ✓ Hora: 14:30 (auto)                    │
│ ✓ Horímetro: [1234]                     │
│ ✓ Ligando: [✓ OK] [✗ NOK]                │
│ ✓ Bateria: [●●●●○] 4 barras             │
│ [Atalho] "MARCAR TODOS COMO OK"  ←┐     │
└─────────────────────────────────────────┘ │
      ↓                               │
┌─────────────────────────────────────────┐ │
│ Step 2: ITEMS DE INSPEÇÃO               │ │
├─────────────────────────────────────────┤ │
│ [1] Nível da Bateria    [✓ OK] [✗ NOK] │←┘ (preenche tudo)
│ [2] Travamento          [✓ OK] [✗ NOK] │
│ [3] Rolamentos          [✓ OK] [✗ NOK] │
│ ... (17 itens no total)                 │
│                                         │
│ Notas por item:                         │
│ [7] Mangueira Hidráulica                │
│     Observação: [____________] (64 chars)│
│                                         │
│ [Atalho] "MARCAR TODOS COMO NOK"        │
└─────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────┐
│ Step 3: OBSERVAÇÃO GERAL                │
├─────────────────────────────────────────┤
│ [Observação Geral]                      │
│ ┌─────────────────────────────────────┐ │
│ │ Equipamento operacional. Falta      │ │
│ │ lubrificação na corrente. Revisar   │ │
│ │ no próximo turnover.                │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
      ↓
   [SALVAR]
      ↓
┌──────────────────────────────────────────┐
│ Validações:                              │
│ ✓ Operador selecionado?                  │
│ ✓ Equipamento selecionado?               │
│ ✓ Horímetro é número?                    │
│ ✓ Todos os 17 itens têm status?          │
└──────────────────────────────────────────┘
      ↓ OK
┌──────────────────────────────────────────┐
│ Criar 17x Registros (um por item):       │
│                                          │
│ registros_checklist.insert([             │
│   { id: uuid, data, hora,                │
│     operador, equipamento,               │
│     item: "Nível da Bateria",            │
│     status: "OK",                        │
│     observacao: "",                      │
│     patrimonio: "EMP-4410" },            │
│   { ... "Travamento", "NOK", ... },      │
│   { ... "Rolamentos", "OK", ... },       │
│   ... (17 items total)                   │
│ ]);                                      │
│                                          │
└──────────────────────────────────────────┘
      ↓
┌──────────────────────────────────────────┐
│ LocalStorage Update:                     │
│ pharmalog_v1_records.push(...newItems)   │
│ pharmalog_v1_sync_queue.push(...items)   │
└──────────────────────────────────────────┘
      ↓
┌──────────────────────────────────────────┐
│ Sincronizar (se online):                 │
│ db.processSyncQueue()                    │
│ → POST /registros_insert                 │
│ → Supabase insere 17 registros           │
│ → Limpar fila local                      │
└──────────────────────────────────────────┘
      ↓
   ✅ SUCESSO!
   "Toast: Checklist salvo e sincronizado"
   Volta para NewRecord vazio
```

---

## DIAGRAMA 5: ARQUITETURA VERCEL POST-DEPLOYMENT

```
┌───────────────────────────────────────────────────────────────┐
│            ARQUITETURA EM PRODUÇÃO - VERCEL                   │
└───────────────────────────────────────────────────────────────┘

┌─────────────────────┐
│  User Smartphone    │
│  (Android/iOS)      │
│                     │
│ ┌─────────────────┐ │
│ │ LogiCheck PWA   │ │
│ │ (Installable)   │ │
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │ Service Worker  │ │
│ │ (Cache Layer)   │ │
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │ LocalStorage    │ │
│ │ (Offline Buffer)│ │
│ └─────────────────┘ │
└──────────┬──────────┘
           │
           │ HTTPS
           │ (Certificate by Let's Encrypt)
           │
        ┌──▼──────────────────────────┐
        │    VERCEL EDGE NETWORK      │
        │  (Global CDN - Fast)        │
        │                             │
        │ ┌───────────────────────┐   │
        │ │ Static Files (JS/CSS) │   │
        │ │ Cached 31536000s      │   │
        │ └───────────────────────┘   │
        │                             │
        │ ┌───────────────────────┐   │
        │ │ index.html (Rewrite)  │   │
        │ │ SPA Routing Handler   │   │
        │ └───────────────────────┘   │
        │                             │
        │ ┌───────────────────────┐   │
        │ │ Security Headers      │   │
        │ │ X-Content-Type       │   │
        │ │ X-Frame-Options      │   │
        │ └───────────────────────┘   │
        └──────────┬──────────────────┘
                   │
           ┌───────┴────────┐
           │                │
           │                │
        ┌──▼───────────┐  ┌─▼──────────────┐
        │  SUPABASE    │  │ EXTERNAL APIS  │
        │  (Database)  │  │ (Google, etc)  │
        │              │  │                │
        │ PostgreSQL   │  │ Analytics      │
        │ RLS Tables   │  │ Error Track    │
        │ Auth         │  │ Push Notif     │
        └──────────────┘  └────────────────┘


┌──────────────────────────────────────────────────┐
│           VERCEL.JSON CONFIGURATION               │
├──────────────────────────────────────────────────┤
│ {                                                │
│   "buildCommand": "npm run build",               │
│   "outputDirectory": "dist",                     │
│   "env": {                                       │
│     "VITE_SUPABASE_URL": "@vite_supabase_url",  │
│     "VITE_SUPABASE_ANON_KEY": "@..."            │
│   },                                             │
│   "rewrites": [                                  │
│     { "source": "/(.*)", "dest": "/index.html" }│
│   ],                                             │
│   "headers": [                                   │
│     { Cache-Control, X-Frame-Options, ... }     │
│   ]                                              │
│ }                                                │
└──────────────────────────────────────────────────┘
```

---

## DIAGRAMA 6: DASHBOARD ANALYTICS FLOW

```
┌──────────────────────────────────────────────────────────┐
│              DASHBOARD - DATA FLOW                       │
└──────────────────────────────────────────────────────────┘

Gerente/Master acessa Dashboard
         ↓
┌────────────────────────────────────────┐
│ LocalDb.getRecords()                   │
│ → Retorna array de ChecklistRecord[]   │
└───────────┬────────────────────────────┘
            ↓
┌────────────────────────────────────────────────────┐
│ CÁLCULOS (useMemo - otimizado)                    │
├────────────────────────────────────────────────────┤
│                                                    │
│ 1. totalInspections = unique(data+hora+equip)     │
│    Ex: 26 inspeções no mês                        │
│                                                    │
│ 2. totalOk = filter(status === 'OK').length       │
│    Ex: 24 OK                                      │
│                                                    │
│ 3. totalNok = filter(status === 'NOK').length     │
│    Ex: 3 NOK (buzina, bateria, limpeza)           │
│                                                    │
│ 4. equipmentHealth = map each equip {             │
│      lastInspection: "15/12/2026 14:30",          │
│      lastOperator: "Carlos Eduardo",              │
│      status: "OK" | "NOK",                        │
│      failedItems: ["Buzina", "Bateria"]           │
│    }                                              │
│                                                    │
│ 5. operatorRanking = sort by count desc           │
│    [Carlos: 8, Mariana: 7, Ricardo: 5]            │
│                                                    │
│ 6. filteredRecords = apply filters {              │
│      selectedMonth: "2026-12",                    │
│      selectedEq: "EMP-4410",                      │
│      selectedStatus: "NOK"                        │
│    }                                              │
│                                                    │
└────────────────────────────────────────────────────┘
         ↓
┌───────────────────────────────────────────────┐
│ RENDERIZAÇÃO DOS WIDGETS                      │
├───────────────────────────────────────────────┤
│                                               │
│ 📊 KPI Cards:                                 │
│ ┌─────────────┬─────────────┬─────────────┐  │
│ │ 26 Total    │ 24 OK       │ 3 NOK       │  │
│ │ Inspeções   │ (92.3%)     │ (7.7%)      │  │
│ └─────────────┴─────────────┴─────────────┘  │
│                                               │
│ 🏥 Equipment Health (Recharts Tabela):       │
│ ┌──────────────────────────────────────────┐ │
│ │ Equipamento  │ Status │ Falhas | Operador│ │
│ ├──────────────────────────────────────────┤ │
│ │ EMP-4410     │ NOK    │ Buzina │ Carlos  │ │
│ │ EMP-3089     │ OK     │ -      │ Mariana │ │
│ │ PAT-1012     │ OK     │ -      │ Ricardo │ │
│ └──────────────────────────────────────────┘ │
│                                               │
│ 🏆 Operador Ranking (Top 6):                 │
│ 1. Carlos        8 registros                 │
│ 2. Mariana       7 registros                 │
│ 3. Ricardo       5 registros                 │
│                                               │
└───────────────────────────────────────────────┘
```

---

## DIAGRAMA 7: PWA INSTALLATION FLOW

```
┌────────────────────────────────────────────────────┐
│         PWA INSTALLATION - ANDROID                 │
└────────────────────────────────────────────────────┘

1. Usuário acessa https://logicheck.vercel.app
                     ↓
2. Chrome detecta manifest.json + Service Worker
                     ↓
3. Icone "Instalar" aparece na barra

   ┌─────────────────────────────────┐
   │ LogiCheck - Instalar?           │
   │ [Instalar] [Não agora] [Nunca]  │
   └─────────────────────────────────┘
                     ↓ [Instalar]
4. App é adicionado à tela inicial

   ┌──────────────────────┐
   │  🏠 Tela Inicial     │
   ├──────────────────────┤
   │ [ícone]              │
   │ LogiCheck            │
   │                      │
   │ [Outras apps...]     │
   └──────────────────────┘

5. Splash Screen customizado (manifest.json)
   ┌────────────────────┐
   │ LogiCheck          │
   │ (theme_color azul) │
   │ (background claro) │
   └────────────────────┘

6. App roda em modo standalone (sem barra do navegador)
   ┌────────────────────────────────┐
   │   LogiCheck                    │
   ├────────────────────────────────┤
   │                                │
   │  [Login Screen]                │
   │  Email: [__________]           │
   │  Senha: [__________]           │
   │                                │
   │        [Entrar]                │
   │                                │
   │ (Sem barra de URL!)            │
   ├────────────────────────────────┤
   │  [Back] [Home] [Recents]       │
   └────────────────────────────────┘

7. Offline: Service Worker carrega assets cached
   - index.html
   - JavaScript bundles
   - CSS
   - Ícones
   
   Usuário continua usando offline! ✅

8. Ao reconectar:
   - Sincroniza registros da fila
   - Download de atualizações
   - Mostra toast: "Sincronizado com sucesso"
```

---

## DIAGRAMA 8: MATRIX DE PERMISSÕES POR ROLE

```
┌────────────────────────────────────────────────────────────┐
│                    ROLE-BASED ACCESS CONTROL               │
├────────────────────────────────────────────────────────────┤

                    Master  Gerente  Operador
Acessar Login       ✅      ✅       ✅
Ver Dashboard       ✅      ✅       ❌
Ver NewRecord       ✅      ✅       ✅
Criar Checklist     ✅      ✅       ✅
Ver Histórico       ✅      ✅       ✅
Deletar Registro    ✅      ✅       ❌
Editar Equipamento  ✅      ✅       ❌
Criar Usuário       ✅      ❌       ❌
Ver Análise BI      ✅      ✅       ❌
Exportar CSV/PDF    ✅      ✅       ✅
Ver TeamManagement  ✅      ❌       ❌

Database RLS:
INSERT               ✅      ✅       ✅  (Autenticados)
SELECT (Todos)       ✅      ✅       ✅  (Autenticados)
UPDATE               ❌      ❌       ❌  (Bloqueado)
DELETE               ❌      ❌       ❌  (Bloqueado RLS)
DELETE (Frontend)     ✅      ✅       ❌  (Permissão)

Default Auto-route:
Master/Gerente → Dashboard
Operador       → NewRecord
```

---

## DIAGRAMA 9: CICLO DE SYNC BACKGROUND

```
┌──────────────────────────────────────────────────────┐
│     BACKGROUND SYNC - QUANDO IMPLEMENTADO             │
└──────────────────────────────────────────────────────┘

Timeline:
─────────────────────────────────────────────────────

T=0:  User offline, cria 5 registros
      └─> Salvar em LocalStorage
      └─> Mostrador: "5 pendentes de sync"

T=30min: Internet volta!
      └─> Service Worker detecta mudança
      └─> Dispara evento 'sync'
      └─> Browser chama syncPendingRecords()

      ┌────────────────────────────────────┐
      │  Sincronização em Lote              │
      ├────────────────────────────────────┤
      │ for (let record of pendingQueue) {  │
      │   POST /registros_insert            │
      │   └─> Supabase insere               │
      │   └─> Se OK: remove de queue        │
      │   └─> Se erro: fica na queue       │
      │ }                                   │
      │                                     │
      │ Resultado: "5/5 sincronizado ✅"    │
      └────────────────────────────────────┘

      └─> Notificação: "Registros sincronizados"
      └─> Mostrador: "0 pendentes"

T=31min: Tudo sincronizado!
      └─> Queue vazia
      └─> Dados em Supabase prontos para BI
      └─> Dashboard atualiza em tempo real
```

---

## DIAGRAMA 10: FLUXO DE ERRO E RETRY

```
┌────────────────────────────────────────────────────┐
│        ERROR HANDLING & RETRY STRATEGY              │
└────────────────────────────────────────────────────┘

User cria registro
      ↓
Validar (frontend)
      ├─ Email válido?
      ├─ Todos os itens preenchidos?
      ├─ Horímetro é número?
      └─ Se não: Toast erro (vermelho)
           └─ Não salva nada
      ↓ OK
Salvar em LocalStorage
      ├─ Sucesso sempre (é local!)
      ├─ Toast: "Salvo localmente"
      └─ Se offline: "Sincronizará quando conectado"
      ↓
Tentar sincronizar (se online)
      ├─ Enviar para Supabase
      ├─ ├─ Sucesso (HTTP 200)
      │ │  └─> Remover de fila
      │ │      Toast verde: "Sincronizado"
      │ │
      │ ├─ Erro Network
      │ │  └─> Deixar na fila
      │ │      Toast amarelo: "Reconectar e tenta novamente"
      │ │      Após 5 min: Retry automático
      │ │
      │ └─ Erro RLS/Auth
      │    └─> Notificar user
      │        Toast vermelho: "Erro de permissão"
      │        Não faz retry (falha permanente)
      │
      └─> Continuar funcionando offline
```

---

💡 **ESTES DIAGRAMAS AJUDAM A VISUALIZAR:**
- ✅ Fluxo de dados completo
- ✅ Arquitetura antes/depois de Vercel
- ✅ Sincronização offline
- ✅ Permissões por role
- ✅ PWA installation
- ✅ Error handling

**Use como referência ao discutir com IA!**
