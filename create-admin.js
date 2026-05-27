import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mctomstklskmejxozoys.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  console.log('🔄 Criando usuário ADM...\n');

  try {
    // 1. Criar usuário via Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'ADM',
      password: '123456',
      email_confirm: true
    });

    if (error) {
      console.error('❌ Erro ao criar usuário:', error.message);
      return;
    }

    console.log('✅ Usuário ADM criado com sucesso!');
    console.log(`   User ID: ${data.user?.id}`);
    console.log(`   Email: ADM`);
    console.log(`   Senha: 123456`);

    // 2. Criar perfil de usuário (se tabela existe)
    if (data.user?.id) {
      const { error: profileError } = await supabase
        .from('perfis_usuarios')
        .insert({
          id: data.user.id,
          email: 'ADM',
          full_name: 'Administrador Master',
          nivel_acesso: 'master'
        });

      if (!profileError) {
        console.log('\n✅ Perfil ADM criado com sucesso!');
        console.log('   Nível: master (acesso total)');
      } else {
        console.log('\n⚠️  Perfil não criado (tabela pode não existir):');
        console.log(`   ${profileError.message}`);
      }
    }

    console.log('\n🎉 ADM pronto para usar!');
    console.log('\nCredenciais:');
    console.log('   Email: ADM');
    console.log('   Senha: 123456');
    console.log('   Role: master (gerencia tudo)');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

createAdminUser();
