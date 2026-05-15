import { pool } from '../../config/database.js';

import { seedUsers } from './users.js';
import { seedServiceTypes } from './serviceTypes.js';
import { seedMinistries } from './ministries.js';
import { seedMembers } from './members.js';
import { seedAvailability } from './availability.js';

/**
 * Reseta o banco de dados, removendo todos os dados seedados.
 * ATENÇÃO: apaga todos os dados das tabelas listadas em cascata.
 */
export async function resetDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    console.log('🧹 Resetting database...');
    await client.query(`
      TRUNCATE TABLE
        member_monthly_unavailabilities,
        members,
        ministries,
        service_types,
        users
      RESTART IDENTITY CASCADE
    `);
    console.log('✅ Database reset complete');
  } finally {
    client.release();
  }
}

/**
 * Executa todas as seeds em ordem, dentro de uma única transação.
 * Idempotente: pode ser rodado múltiplas vezes sem duplicar dados.
 *
 * Ordem obrigatória:
 *   users → service_types → ministries → members → availability
 */
async function seed(): Promise<void> {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting database seed...\n');

    await client.query('BEGIN');

    await seedUsers(client);
    await seedServiceTypes(client);
    await seedMinistries(client);
    await seedMembers(client);
    await seedAvailability(client);

    await client.query('COMMIT');

    console.log('\n✅ Seed concluída com sucesso!');
    console.log('   • 1 usuário admin');
    console.log('   • 3 tipos de culto');
    console.log('   • 1 ministério (Louvor)');
    console.log('   • 16 membros');
    console.log('   • 51 indisponibilidades (abril/2025)');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Seed falhou — rollback executado');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
