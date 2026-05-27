# 🚀 GUIA COMPLETO: MIGRAÇÃO PHARMALOG PARA VERCEL

---

## 📋 ÍNDICE
1. Preparação
2. Mudanças de Código
3. Configuração Vercel
4. Deploy
5. Pós-Deploy
6. Troubleshooting

---

## 1️⃣ PREPARAÇÃO

### Pré-requisitos
- [ ] Conta GitHub (grátis em github.com)
- [ ] Conta Vercel (grátis em vercel.com)
- [ ] Node.js 18+ instalado localmente
- [ ] Git instalado

### Passo 1: Criar Repositório GitHub

```bash
# 1. Inicializar Git no projeto (se não for feito)
cd c:\Users\26fap\Downloads\checklist-de-empilhadeiras
git init

# 2. Adicionar remote (substituir USER/REPO)
git remote add origin https://github.com/USER/checklist-de-empilhadeiras.git

# 3. Criar .gitignore (se não existir)
cat > .gitignore << EOF
node_modules/
dist/
.env
.env.local
.DS_Store
*.log
npm-debug.log*
EOF

# 4. Commit inicial
git add .
git commit -m "Initial commit: PharmaLog PWA system"
git branch -M main
git push -u origin main
```

---

## 2️⃣ MUDANÇAS NECESSÁRIAS DE CÓDIGO

### Arquivo 1: `vercel.json` (NOVO)
Cria este arquivo na raiz do projeto:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    },
    {
      "source": "/public/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Arquivo 2: `package.json` (MODIFICAR)
Verificar que existem estes scripts:

```json
{
  "scripts": {
    "dev": "vite --port=3000 --host=0.0.0.0",
    "build": "vite build",
    "preview": "vite preview",
    "clean": "rm -rf dist server.js",
    "lint": "tsc --noEmit"
  }
}
```

### Arquivo 3: `vite.config.ts` (REVISAR)
Verificar que a configuração está correta:

```typescript
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ command, mode }) => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: mode === 'production' ? false : true,
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            supabase: ['@supabase/supabase-js'],
            ui: ['lucide-react', 'tailwindcss'],
          },
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
```

### Arquivo 4: `public/sw.js` (OTIMIZAR)
Adicionar cache busting:

```javascript
const CACHE_VERSION = 'v1';
const CACHE_NAME = `logicheck_cache_${CACHE_VERSION}`;

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sw.js'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing LogiCheck...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating LogiCheck...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('logicheck_cache_') && name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Skip Supabase API, auth, and external APIs
  if (
    event.request.url.includes('supabase.co') ||
    event.request.url.includes('/api/') ||
    event.request.url.includes('/auth/')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Serve from cache, with network fallback
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
```

### Arquivo 5: `.env.example` (ATUALIZAR)
```env
# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://your_project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Optional: Sentry Error Tracking
VITE_SENTRY_DSN=https://your_sentry_dsn

# Optional: Google Analytics
VITE_GA_TRACKING_ID=your_ga_tracking_id

# Note: Do NOT commit .env to Git
```

### Arquivo 6: `public/manifest.json` (MELHORAR)
```json
{
  "name": "LogiCheck - Checklist de Empilhadeiras",
  "short_name": "LogiCheck",
  "description": "Sistema PWA moderno para registro operacional de checklists de empilhadeiras em ambientes hospitalares.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#1e3a8a",
  "background_color": "#f8fafc",
  "categories": ["business", "productivity"],
  "screenshots": [
    {
      "src": "/screenshots/1.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshots/2.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    }
  ],
  "icons": [
    {
      "src": "https://cdn-icons-png.flaticon.com/512/9356/9356230.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "https://cdn-icons-png.flaticon.com/512/9356/9356230.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Novo Registro",
      "short_name": "Novo",
      "description": "Criar novo checklist rapidamente",
      "url": "/?tab=new-record",
      "icons": []
    },
    {
      "name": "Dashboard",
      "short_name": "Dashboard",
      "description": "Ver análise dos registros",
      "url": "/?tab=dashboard",
      "icons": []
    }
  ]
}
```

### Arquivo 7: `index.html` (ATUALIZAR)
Garantir que o manifest e SW estão registrados:

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Sistema PWA moderno para registro operacional de checklists de empilhadeiras" />
    <meta name="theme-color" content="#1e3a8a" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="LogiCheck" />
    
    <!-- Manifest -->
    <link rel="manifest" href="/manifest.json" />
    
    <!-- Apple Icons -->
    <link rel="apple-touch-icon" href="https://cdn-icons-png.flaticon.com/512/9356/9356230.png" />
    
    <title>LogiCheck - Checklist de Empilhadeiras</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
    
    <!-- Register Service Worker -->
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker
            .register('/sw.js')
            .then(reg => {
              console.log('✅ Service Worker registered:', reg.scope);
              // Check for updates every hour
              setInterval(() => reg.update(), 3600000);
            })
            .catch(err => console.error('❌ SW registration failed:', err));
        });
      }
    </script>
  </body>
</html>
```

---

## 3️⃣ CONFIGURAÇÃO VERCEL

### Passo 1: Criar Conta Vercel
1. Acesse https://vercel.com
2. Clique "Sign Up"
3. Selecione "GitHub" e autorize

### Passo 2: Conectar Projeto
1. Dashboard Vercel → "Add New..." → "Project"
2. Selecione o repositório `checklist-de-empilhadeiras`
3. Configure o projeto:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build` (detectado automaticamente)
   - **Output Directory:** `dist` (detectado automaticamente)
   - **Install Command:** `npm install`

### Passo 3: Configurar Environment Variables
No dashboard Vercel, vá para **Settings → Environment Variables** e adicione:

```
VITE_SUPABASE_URL=https://mctomstklskmejxozoys.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_V9Ge0j9JJSnvVK16kSGDmw_2xfdRbKl
```

⚠️ **IMPORTANTE:** Use as mesmas variáveis do arquivo `.env` local

### Passo 4: Configurar Domínio (Opcional)
1. **Settings → Domains**
2. Adicione seu domínio customizado
3. Siga as instruções de DNS
4. Vercel gera SSL automaticamente

---

## 4️⃣ DEPLOY

### Opção A: Deploy Automático (Recomendado)
```bash
# 1. Commit e push para main
git add .
git commit -m "Add Vercel configuration"
git push origin main

# 2. Vercel detecta automaticamente e faz deploy
# Monitore em https://vercel.com/dashboard
```

### Opção B: Deploy Manual
```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Fazer login
vercel login

# 3. Deploy
vercel --prod

# 4. Seguir instruções no terminal
```

### Verificar Deploy
```bash
# Acessar URL gerada automaticamente
https://checklist-de-empilhadeiras.vercel.app

# Ou seu domínio customizado
https://seu-dominio.com
```

---

## 5️⃣ PÓS-DEPLOY

### Checklist de Validação

- [ ] **HTTPS funcionando**
  ```bash
  curl -I https://seu-dominio.com
  # Deve retornar HTTP/1.1 200 OK e header Strict-Transport-Security
  ```

- [ ] **PWA instalável**
  - Abrir app em Chrome/Edge no Android
  - Clique "Instalar" ou 3 pontos → "Instalar aplicativo"
  - Verificar se aparece na tela inicial

- [ ] **Offline funcionando**
  - Abrir DevTools → Network
  - Marcar "Offline"
  - Recarregar página → deve funcionar
  - Criar novo checklist offline
  - Conectar internet → deve sincronizar

- [ ] **Performance**
  ```bash
  # Usar Lighthouse do Chrome DevTools
  # Meta: Score 90+ em Performance, Accessibility, Best Practices
  # Lighthouse → Generate report
  ```

- [ ] **Supabase conectando**
  - Fazer login com credenciais
  - Criar novo registro
  - Verificar no Dashboard Supabase se aparecerem os dados

### Configurar Monitoramento

#### Sentry (Error Tracking)
```bash
# 1. Criar conta em https://sentry.io
# 2. Criar projeto React
# 3. Copiar DSN
# 4. No Vercel → Settings → Environment Variables
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# 5. Instalar no projeto
npm install @sentry/react @sentry/tracing

# 6. No src/main.tsx, adicionar:
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: "production"
  });
}
```

#### Google Analytics
```bash
# 1. Criar conta em https://analytics.google.com
# 2. Copiar Tracking ID
# 3. No Vercel → Environment Variables
VITE_GA_TRACKING_ID=G-XXXXXXX

# 4. No index.html, adicionar:
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXX');
</script>
```

#### Vercel Analytics (Automático)
- Já habilitado por padrão
- Dashboard Vercel → Analytics
- Monitora Core Web Vitals

---

## 6️⃣ TROUBLESHOOTING

### Problema: "Build falhou"
```bash
# 1. Testar build localmente
npm run build
npm run preview

# 2. Verificar erros TypeScript
npm run lint

# 3. Limpar node_modules e reinstalar
rm -rf node_modules
npm install
npm run build

# 4. Verificar .env variables no Vercel dashboard
```

### Problema: "PWA não instala"
- [ ] Verificar se `manifest.json` está correto
- [ ] Verificar se tem ícones PNG válidos
- [ ] Verificar se tem `https://`
- [ ] Verificar console para erros de SW
- [ ] Testar em DevTools → Application → Manifest

### Problema: "Offline não funciona"
- [ ] Verificar se SW registrado: `console.log('Service Workers:', navigator.serviceWorker.controller)`
- [ ] Verificar Network tab se `/sw.js` está loaded
- [ ] Verificar Application → Cache Storage
- [ ] Limpar cache: Ctrl+Shift+Delete → All time → Cache storage

### Problema: "Supabase não conecta em produção"
```javascript
// Em lib/supabase.ts, adicionar logs
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

// Testar no console do navegador
fetch('https://mctomstklskmejxozoys.supabase.co/rest/v1/registros_checklist', {
  headers: {
    'Authorization': 'Bearer sb_publishable_...',
    'apikey': 'sb_publishable_...'
  }
})
```

### Problema: "Erros CORS"
```javascript
// Em vercel.json, já configurado com rewrites
// Se ainda tiver problema, verificar RLS no Supabase
// SELECT → Verificar políticas de acesso
```

### Problema: "Páginas não carregam após refresh"
```json
// Em vercel.json, configurar rewrites:
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 🎯 CHECKLIST FINAL

### Antes do Deploy
- [ ] `git push` no repositório
- [ ] `.env` local não commitado (verificar `.gitignore`)
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Build funciona localmente: `npm run build && npm run preview`
- [ ] PWA funciona offline localmente
- [ ] TypeScript sem erros: `npm run lint`
- [ ] Supabase conectando em localhost

### Durante Deploy
- [ ] Vercel começou build automaticamente
- [ ] Build completou sem erros
- [ ] Preview URL fornecida
- [ ] Logs na aba "Deployments"

### Após Deploy
- [ ] HTTPS funcionando
- [ ] PWA instalável
- [ ] Offline funcionando
- [ ] Supabase sincronizando
- [ ] Performance score > 90 (Lighthouse)
- [ ] Sem erros em Sentry
- [ ] Analytics rastreando eventos

---

## 📞 SUPORTE

**Documentação Vercel:** https://vercel.com/docs  
**Documentação React:** https://react.dev  
**Documentação Supabase:** https://supabase.com/docs  
**Status Vercel:** https://www.vercel-status.com

---

*Documento criado para migração segura e otimizada para produção.*
