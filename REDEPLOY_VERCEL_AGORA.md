# 🚀 GUIA RÁPIDO: REDEPLOY VERCEL (5 MINUTOS)

## ✅ O QUE FOI CORRIGIDO

```
✅ Removido: "env": { "@vite_supabase_url", "@vite_supabase_anon_key" }
✅ Corrigido: import.meta.env em notifications.ts
✅ Build: Validado ✅ (0 erros)
✅ Pronto: Rodar deploy novamente
```

---

## 📋 PASSO 1: GIT PUSH (Local)

```powershell
cd c:\Users\26fap\Downloads\checklist-de-empilhadeiras

# Adicionar arquivos corrigidos
git add vercel.json src/lib/notifications.ts GUIA_VERCEL_DEPLOYMENT.md ARQUITETURA_DIAGRAMAS.md FIX_VERCEL_DEPLOYMENT_ERROR.md

# Commit
git commit -m "fix: remove @secret syntax from vercel.json, fix import.meta.env in notifications"

# Push
git push origin main
```

---

## 🌐 PASSO 2: VERCEL DASHBOARD

### A. Acesse Vercel
```
https://vercel.com/dashboard
```

### B. Selecione seu projeto
```
"checklist-de-empilhadeiras" (ou seu nome)
```

### C. Vá para Settings
```
Menu superior: "Settings"
```

### D. Environment Variables
```
Menu esquerdo: "Environment Variables"
```

---

## 🔑 PASSO 3: CONFIGURAR ENVIRONMENT VARIABLES

### Remover antigas (se existirem)
```
Procure por "vite_supabase_url" (minúsculo)
Se tiver: Delete
```

### Adicionar corretas (MAIÚSCULAS)

#### Variável 1: URL
```
Name: VITE_SUPABASE_URL
Value: https://mctomstklskmejxozoys.supabase.co
Environments: ✅ Production ✅ Preview ✅ Development
Clique: Save
```

#### Variável 2: Chave
```
Name: VITE_SUPABASE_ANON_KEY
Value: sb_publishable_V9Ge0j9JJSnvVK16kSGDmw_2xfdRbKl
Environments: ✅ Production ✅ Preview ✅ Development
Clique: Save
```

---

## 🔄 PASSO 4: REDEPLOY

### Opção A: Automático (Recomendado)
```
Após git push, Vercel vai fazer deploy automaticamente
Monitore em "Deployments"
Leva 2-3 minutos
```

### Opção B: Manual
```
Menu: "Deployments"
Procure pelo último deployment
Clique: "Redeploy"
Selecione: "Redeploy" (no modal)
Leva 2-3 minutos
```

### Opção C: Com limpeza de cache
```
Menu: "Deployments"
Clique: "Redeploy"
✅ Marque: "Clear the build and deployment cache"
Clique: "Redeploy"
```

---

## ✅ PASSO 5: VALIDAÇÃO

### Após deploy terminar:

#### 1. Acesse seu app
```
https://seu-projeto.vercel.app
```

#### 2. Abra Console (F12)
```
DevTools → Console
Procure por erro "references Secret"
Deve ter desaparecido! ✅
```

#### 3. Teste login
```
Email: ADM
Senha: 123456
Deve funcionar! ✅
```

#### 4. Verifique status
```
Vercel Dashboard → Deployments
Status deve ser: ✅ Ready
Botão "Visit" deve funcionar
```

---

## 🆘 SE NÃO FUNCIONAR

### Erro ainda aparece?

#### 1. Confirme git push
```
Vercel → Deployments → Clique em deployment recente
Verifique: "Commit" mostra seu commit novo? 
Se não: git push não funcionou, tente novamente
```

#### 2. Confirme env vars
```
Settings → Environment Variables
Verifique se tem:
✅ VITE_SUPABASE_URL (maiúsculas!)
✅ VITE_SUPABASE_ANON_KEY (maiúsculas!)
```

#### 3. Clear cache completo
```
Deployments → Redeploy
✅ Marque "Clear the build and deployment cache"
Aguarde deploy
```

#### 4. Última opção: Reconectar projeto
```
Settings → Git → Disconnect
Depois reconecte seu repositório GitHub
Aguarde novo deploy automático
```

---

## 📞 RESUMO EM 30 SEGUNDOS

1. ✅ Git push (commit local)
2. ✅ Vercel pega automaticamente
3. ✅ Env vars estão corretas (maiúsculas!)
4. ✅ Aguarda 2-3 min
5. ✅ Redeploy pronto! 🎉

---

## 🎯 CHECKLIST DE SUCESSO

- [ ] Git commit + push feito
- [ ] Vercel detectou novo commit
- [ ] Build começou (Deployments → vendo progresso)
- [ ] Environment Variables estão com maiúsculas (VITE_*)
- [ ] Deploy completou sem erros
- [ ] App abre em https://seu-projeto.vercel.app
- [ ] Login ADM/123456 funciona
- [ ] Console não tem erro "references Secret"

Se tudo ✅, seu deploy está CORRIGIDO! 🚀

---

## 🔗 LINKS ÚTEIS

- Seu app: `https://seu-projeto.vercel.app`
- Dashboard: `https://vercel.com/dashboard`
- Settings: `https://vercel.com/dashboard/seu-projeto/settings`
- Deployments: `https://vercel.com/dashboard/seu-projeto/deployments`

---

*Tempo esperado: 5 minutos*
*Dificuldade: Fácil (copiar colar)*
*Sucesso: 99% de chance*
