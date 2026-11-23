import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

async function runMigrations() {
  try {
    console.log('Running master data migrations...');
    
    // Run migrations
    const migrations = [
      '20240101000010-create-water-body-types.js',
      '20240101000011-create-states.js',
      '20240101000012-create-sector-of-operation.js',
      '20240101000013-create-registration-authority.js',
      '20240101000014-create-districts.js',
      '20240101000015-create-cooperative-society-types.js',
      '20240101000016-create-blocks.js',
      '20240101000017-create-area-of-operation-level.js',
      '20240101000018-create-area-of-operation-level-urban.js',
      '20240101000019-create-districts-blocks-gp-villages.js'
    ];

    for (const migration of migrations) {
      console.log(`Running migration: ${migration}`);
      const { stdout, stderr } = await execAsync(`npx sequelize-cli db:migrate --to ${migration}`, {
        cwd: path.join(__dirname, '..', '..')
      });
      
      if (stderr) {
        console.error(`Migration error for ${migration}:`, stderr);
      } else {
        console.log(`Migration completed: ${migration}`);
      }
    }

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

async function runSeeders() {
  try {
    console.log('Running master data seeders...');
    
    // Run seeders
    const seeders = [
      '20240101000005-default-water-body-types.js',
      '20240101000007-default-sector-of-operation.js',
      '20240101000008-default-registration-authority.js',
      '20240101000009-default-cooperative-society-types.js'
    ];

    for (const seeder of seeders) {
      console.log(`Running seeder: ${seeder}`);
      const { stdout, stderr } = await execAsync(`npx sequelize-cli db:seed --seed ${seeder}`, {
        cwd: path.join(__dirname, '..', '..')
      });
      
      if (stderr) {
        console.error(`Seeder error for ${seeder}:`, stderr);
      } else {
        console.log(`Seeder completed: ${seeder}`);
      }
    }

    console.log('All seeders completed successfully!');
  } catch (error) {
    console.error('Error running seeders:', error);
    process.exit(1);
  }
}

async function main() {
  const command = process.argv[2];
  
  if (command === 'migrate') {
    await runMigrations();
  } else if (command === 'seed') {
    await runSeeders();
  } else if (command === 'all') {
    await runMigrations();
    await runSeeders();
  } else {
    console.log('Usage: npm run master-data:migrate | master-data:seed | master-data:all');
    console.log('  migrate: Run migrations only');
    console.log('  seed: Run seeders only');
    console.log('  all: Run both migrations and seeders');
  }
}

main().catch(console.error); 