import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  const harsh = await p.users.findUnique({
    where: { email: 'hvraj619@gmail.com' },
    select: { id: true, name: true, email: true, phone: true, user_type: true },
  });
  console.log('--- Harsh user ---');
  console.log(JSON.stringify(harsh, null, 2));

  const sahmadCourse = await p.courses.findUnique({
    where: { id: '50c4b8ae-fc6e-47e5-97dc-4e33539a3e5e' },
    include: {
      videos: true,
      creator: { select: { id: true, name: true, email: true } },
    },
  });
  console.log('\n--- Sahmad course ---');
  console.log('id:', sahmadCourse?.id);
  console.log('title:', sahmadCourse?.title);
  console.log('creator:', sahmadCourse?.creator);
  console.log('videos:', sahmadCourse?.videos?.length);
  console.log('price:', sahmadCourse?.price);
  console.log('status:', sahmadCourse?.status);

  const techCourses = await p.courses.findMany({
    where: { title: { contains: 'echnical', mode: 'insensitive' } },
    select: {
      id: true,
      title: true,
      status: true,
      price: true,
      creator: { select: { id: true, email: true, name: true } },
      _count: { select: { videos: true } },
    },
  });
  console.log('\n--- Technical Analysis matches ---');
  console.log(JSON.stringify(techCourses, null, 2));

  if (harsh) {
    const harshCourses = await p.courses.findMany({
      where: { creator_id: harsh.id },
      select: { id: true, title: true, status: true, price: true, _count: { select: { videos: true } } },
    });
    console.log('\n--- Harsh existing courses ---');
    console.log(JSON.stringify(harshCourses, null, 2));
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
