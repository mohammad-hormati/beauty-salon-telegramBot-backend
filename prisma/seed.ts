import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import bcrypt from 'bcryptjs';

type ServiceType = { name: string; durationMin: number; price: number; performer: string };

async function main() {
  const performerNames: string[] = [
    'مدیریت',
    'متخصص ناخن',
    'متخصص مژه',
    'آرایشگر مو',
    'کارشناس پوست',
    'میکاپ آرتیست',
    'متخصص ماساژ',
  ];

  const performerMap: Record<string, number> = {};
  for (const name of performerNames) {
    const p = await prisma.performer.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    performerMap[name] = p.id;
  }

  const services: ServiceType[] = [
    { name: 'آرایش دائم', durationMin: 60, price: 850, performer: 'مدیریت' },
    { name: 'اکستنشن مژه', durationMin: 60, price: 690, performer: 'متخصص مژه' },
    { name: 'ترمیم مژه', durationMin: 60, price: 690, performer: 'متخصص مژه' },
    { name: 'ترمیم ناخن', durationMin: 60, price: 350, performer: 'متخصص ناخن' },
    { name: 'کاشت ناخن', durationMin: 60, price: 480, performer: 'متخصص ناخن' },
    { name: 'مانیکور', durationMin: 60, price: 170, performer: 'متخصص ناخن' },
    { name: 'مانیکور خیس', durationMin: 60, price: 170, performer: 'متخصص ناخن' },
    { name: 'پدیکور اکونومی', durationMin: 60, price: 170, performer: 'متخصص ناخن' },
    { name: 'پدیکور vip', durationMin: 60, price: 170, performer: 'متخصص ناخن' },
    { name: 'لمینت ناخن', durationMin: 60, price: 280, performer: 'متخصص ناخن' },
    { name: 'اسکراب دست و پا ', durationMin: 60, price: 170, performer: 'متخصص ناخن' },
    { name: 'وکس', durationMin: 60, price: 250, performer: 'مدیریت' },
    { name: 'اصلاح صورت', durationMin: 60, price: 100, performer: 'مدیریت' },
    { name: 'میکاپ و گریم تخصصی', durationMin: 60, price: 1200, performer: 'میکاپ آرتیست' },
    { name: 'پروتئین تراپی', durationMin: 60, price: 1200, performer: 'آرایشگر مو' },
    { name: 'کراتین', durationMin: 60, price: 3500, performer: 'آرایشگر مو' },
    { name: 'کوتاهی', durationMin: 60, price: 450, performer: 'مدیریت' },
    { name: 'پاکسازی پوست', durationMin: 60, price: 550, performer: 'کارشناس پوست' },
    { name: 'رنگ ریشه', durationMin: 60, price: 450, performer: 'آرایشگر مو' },
    { name: 'ماساژ تخصصی و درمانی', durationMin: 60, price: 450, performer: 'متخصص ماساژ' },
  ];

  const serviceMap: Record<string, number> = {};
  for (const service of services) {
    const s = await prisma.service.upsert({
      where: { name: service.name },
      update: {
        durationMin: service.durationMin,
        price: service.price,
        performerId: performerMap[service.performer],
      },
      create: {
        name: service.name,
        durationMin: service.durationMin,
        price: service.price,
        performerId: performerMap[service.performer],
      },
    });
    serviceMap[service.name] = s.id;
  }

  // ---- Create default admin ----
  const username = 'banoohoseini';
  const password = 'banoohoseini';

  const existingAdmin = await prisma.admin.findUnique({
    where: { username },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.admin.create({
      data: {
        username,
        passwordHash,
        role: 'SUPERADMIN',
        name: 'مدیر اصلی',
        email: 'admin@example.com',
      },
    });

    console.log(`✅ Default admin created (username: ${username}, password: ${password})`);
  } else {
    console.log('ℹ️ Admin already exists, skipping...');
  }

  console.log('✅ Seed executed successfully');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
