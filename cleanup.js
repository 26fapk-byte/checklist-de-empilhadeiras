import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mctomstklskmejxozoys.supabase.co';
const supabaseKey = 'sb_publishable_V9Ge0j9JJSnvVK16kSGDmw_2xfdRbKl';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDatabase() {
  console.log('🔄 Iniciando limpeza de dados...\n');

  try {
    // Delete all records from registros_checklist
    const { data: deletedData, error: deleteError } = await supabase
      .from('registros_checklist')
      .delete()
      .gt('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.error('❌ Erro ao deletar registros:', deleteError.message);
      return;
    }

    // Count remaining records
    const { count, error: countError } = await supabase
      .from('registros_checklist')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Erro ao contar registros:', countError.message);
      return;
    }

    console.log('✅ Limpeza concluída com sucesso!');
    console.log(`📊 Registros restantes na tabela: ${count || 0}`);
    console.log('\n🎉 Banco de dados pronto para começar do zero!');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

cleanupDatabase();
