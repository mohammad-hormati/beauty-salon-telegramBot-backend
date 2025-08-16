import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ServicesType {
  name: string;
  durationMin: number;
  price: number;
}

async function main() {
  // services list
  const services: ServicesType[] = [
    { name: "آرایش دائم", durationMin: 60, price: 850 },
    { name: "اکستنشن مژه", durationMin: 60, price: 690 },
    { name: "ترمیم ناخن", durationMin: 60, price: 350 },
    { name: "کاشت ناحن", durationMin: 60, price: 480 },
    { name: "مانیکور", durationMin: 60, price: 170 },
    { name: "لمینت ناخن", durationMin: 60, price: 280 },
    { name: "وکس", durationMin: 60, price: 250 },
    { name: "اصلاح صورت", durationMin: 60, price: 100 },
    { name: "میکاپ و گریم تخصصی", durationMin: 60, price: 1200 },
    { name: "پروتئین تراپی", durationMin: 60, price: 1200 },
    { name: "کراتین", durationMin: 60, price: 3500 },
    { name: "کوتاهی", durationMin: 60, price: 450 },
    { name: "پاکسازی پوست", durationMin: 60, price: 550 },
    { name: "رنگ ریشه", durationMin: 60, price: 450 },
  ];

  await Promise.all(
    services.map((service) =>
      prisma.service.upsert({
        where: { name: service.name },
        update: {}, 
        create: service,
      })
    )
  );

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
