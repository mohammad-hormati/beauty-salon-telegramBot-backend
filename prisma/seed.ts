import { Performer } from './../node_modules/.prisma/client/index.d';
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

type ServiceType = { name: string; durationMin: number; price: number; performer: string };

async function main() {

  const performerNames: string[] = [
    "متخصص ناخن",
    "متخصص مژه",
    "آرایشگر مو",
    "کارشناس پوست",
    "میکاپ آرتیست",
    "اپیلاسیون",
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
    { name: "آرایش دائم", durationMin: 60, price: 850, performer: "میکاپ آرتیست" },
    { name: "اکستنشن مژه", durationMin: 60, price: 690, performer: "متخصص مژه" },
    { name: "ترمیم ناخن", durationMin: 60, price: 350, performer: "متخصص ناخن" },
    { name: "کاشت ناخن", durationMin: 60, price: 480, performer: "متخصص ناخن" },
    { name: "مانیکور", durationMin: 60, price: 170, performer: "متخصص ناخن" },
    { name: "لمینت ناخن", durationMin: 60, price: 280, performer: "متخصص ناخن" },
    { name: "وکس", durationMin: 60, price: 250, performer: "اپیلاسیون" },
    { name: "اصلاح صورت", durationMin: 60, price: 100, performer: "اپیلاسیون" },
    { name: "میکاپ و گریم تخصصی", durationMin: 60, price: 1200, performer: "میکاپ آرتیست" },
    { name: "پروتئین تراپی", durationMin: 60, price: 1200, performer: "آرایشگر مو" },
    { name: "کراتین", durationMin: 60, price: 3500, performer: "آرایشگر مو" },
    { name: "کوتاهی", durationMin: 60, price: 450, performer: "آرایشگر مو" },
    { name: "پاکسازی پوست", durationMin: 60, price: 550, performer: "کارشناس پوست" },
    { name: "رنگ ریشه", durationMin: 60, price: 450, performer: "آرایشگر مو" },
  ];

  for (const service of services) {
    await prisma.service.upsert({
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
      })
  }

  console.log("✅ seed executed successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
