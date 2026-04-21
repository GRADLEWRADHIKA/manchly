import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COURSE_ID = '50c4b8ae-fc6e-47e5-97dc-4e33539a3e5e';

// Pass `restore <price>` to revert: e.g. `tsx scripts/set-test-price.ts restore 4999`
async function main() {
  const arg = process.argv[2];
  const restoreTo = process.argv[3] ? Number(process.argv[3]) : null;

  const before = await prisma.courses.findUnique({
    where: { id: COURSE_ID },
    select: { id: true, title: true, price: true },
  });
  if (!before) throw new Error('Course not found: ' + COURSE_ID);

  console.log('BEFORE:', before);

  let newPrice: number;
  if (arg === 'restore') {
    if (!restoreTo) throw new Error('Pass the original price after `restore`, e.g. `restore 4999`');
    newPrice = restoreTo;
  } else {
    // Default: ₹1 (this course is on the no-fee list, so user pays exactly the price)
    newPrice = 1;
  }

  const after = await prisma.courses.update({
    where: { id: COURSE_ID },
    data: { price: newPrice },
    select: { id: true, title: true, price: true },
  });
  console.log('AFTER :', after);
  console.log(`\n>>> ORIGINAL PRICE WAS: ${before.price} <<<`);
  console.log(`To restore, run: npx tsx scripts/set-test-price.ts restore ${before.price}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
