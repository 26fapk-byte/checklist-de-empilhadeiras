# 🔐 CRIANDO USUÁRIO ADM NO SUPABASE

## Opção 1: Via Console Supabase (Recomendado - 2 min)

1. Acesse: https://app.supabase.com/project/mctomstklskmejxozoys
2. Menu lateral: **Authentication → Users**
3. Clique em **+ Create a new user**
4. Preencha:
   - Email: `ADM`
   - Password: `123456`
   - ✅ Confirm password
   - ✅ Auto confirm user (para não precisar email)
5. Clique **Create user**

✅ Pronto! ADM criado e já confirmado.

---

## Opção 2: Via Script Node (Se tiver SERVICE_ROLE_KEY)

Se você tiver a SERVICE_ROLE_KEY do Supabase, coloque em um arquivo `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=seu_service_role_key_aqui
```

Depois rode:
```bash
node create-admin.js
```

---

## Opção 3: Via SQL Query (Avançado)

No **SQL Editor** do Supabase, execute:

```sql
-- Criar usuário via função nativa
SELECT auth.uid();
```

Depois use o Dashboard para criar o usuário.

---

## ✅ Verificar se ADM foi criado

1. Vá em **Authentication → Users**
2. Procure por `ADM`
3. Status deve ser ✅ Confirmed

Se não aparecer, tente novamente ou use outra opção.

---

## 🔑 Credenciais Finais do ADM

```
Email: ADM
Senha: 123456
Role: master (detectado automaticamente)
```

**Permissões:**
- ✅ Acessar Dashboard (ver análises)
- ✅ Deletar registros
- ✅ Criar/editar gerentes e operadores
- ✅ Acessar TeamManagement
- ✅ Tudo

---

💡 **PRÓXIMO PASSO:** Após criar ADM, faça login em `http://localhost:3000` com:
- Email: `ADM`
- Senha: `123456`

Se funcionar, o sistema está 100% pronto para deploy em Vercel!
