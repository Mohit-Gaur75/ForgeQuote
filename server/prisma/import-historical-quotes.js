// server/prisma/import-historical-quotes.js
import { prisma } from '../src/config/database.js';
import { importSample1400Archive } from '../src/modules/excel/excel-import.service.js';

async function main() {
  console.log('⚡ Starting Excel bulk import of 1,400 historical Pune quotation records...');

  const estimator = await prisma.user.findFirst({
    where: { role: 'ESTIMATOR' },
  });

  if (!estimator) {
    console.error('❌ No estimator user found. Run prisma/seed.js first.');
    process.exit(1);
  }

  const startTime = Date.now();
  const result = await importSample1400Archive(estimator);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`✅ ${result.message}`);
  console.log(`⏱️ Completed in ${elapsed}s.`);
}

main()
  .catch((e) => {
    console.error('❌ Import failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
