#!/usr/bin/env node

/**
 * Script para limpar TODOS os dados de teste do aplicativo
 * - Limpa Supabase (registros_checklist)
 * - Limpa localStorage
 * - Pronto para entregar "zerado"
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mctomstklskmejxozoys.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada');
  console.log('\nPara executar este script:');
  console.log('1. Obtenha a SERVICE_ROLE_KEY do Supabase Dashboard');
  console.log('2. Execute: SUPABASE_SERVICE_ROLE_KEY=sua_key node cleanup-test-data.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupTestData() {
  console.log('🧹 Iniciando limpeza de dados de teste...\n');

  try {
    // 1. Apagar todos os registros da tabela registros_checklist
    console.log('📊 Limpando tabela registros_checklist...');
    const { error: deleteError, count } = await supabase
      .from('registros_checklist')
      .delete()
      .neq('id', ''); // Apaga tudo

    if (deleteError) {
      console.error('❌ Erro ao deletar registros:', deleteError.message);
      return;
    }

    console.log(`✅ ${count || 0} registros deletados da tabela`);

    // 2. Mostrar status final
    const { data: remaining, error: checkError } = await supabase
      .from('registros_checklist')
      .select('id');

    if (!checkError) {
      console.log(`\n✅ Tabela registros_checklist agora tem ${remaining?.length || 0} registros`);
    }

    console.log('\n🎉 Limpeza Supabase concluída!');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Limpe localStorage no navegador:');
    console.log('      DevTools → Application → Storage → Clear all');
    console.log('   2. Ou execute no console do navegador:');
    console.log('      localStorage.clear();');
    console.log('   3. Reload da página (Ctrl+Shift+R hard refresh)');
    console.log('\n✅ Aplicativo pronto para entregar zerado!');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    process.exit(1);
  }
}

cleanupTestData();
