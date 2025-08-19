import moment from 'moment';
import { prisma } from '../app';
import { nextNDays } from '../utils/dateConverter';

export const getAvailableSlots = async (serviceId: number) => {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: { performer: true },
  });
  if (!service) throw new Error('Service not found');

  const relatedServiceIds = service.performer
    ? (
        await prisma.service.findMany({
          where: { performerId: service.performer.id },
          select: { id: true },
        })
      ).map((s) => s.id)
    : [service.id];

  const slots: Record<string, string[]> = {};
  const days = nextNDays(30).map((d) => d.date);

  for (const day of days) {
    const start = new Date(moment(day).format('YYYY-MM-DD') + 'T09:00:00');
    const end = new Date(moment(day).format('YYYY-MM-DD') + 'T18:00:00');

    let slotTime = start;
    const daySlots: string[] = [];

    while (slotTime < end) {
      const slotEnd = new Date(slotTime.getTime() + service.durationMin * 60000);

      const now = new Date();
      if (slotEnd <= now) {
        slotTime = slotEnd;
        continue;
      }

      const exists = await prisma.appointment.findFirst({
        where: {
          serviceId: { in: relatedServiceIds },
          AND: [{ startDate: { lt: slotEnd } }, { endDate: { gt: slotTime } }],
        },
      });

      if (!exists) daySlots.push(slotTime.toISOString());
      slotTime = slotEnd;
    }

    const dayKey = moment(day).format('YYYY-MM-DD');
    slots[dayKey] = daySlots;
  }

  return slots;
};
