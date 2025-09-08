import moment from 'moment';
import { prisma } from '../app';
import { nextNDays } from '../utils/dateConverter';

const DEFAULT_START = '09:00';
const DEFAULT_END = '18:00';

export const getAvailableSlots = async (serviceId: number) => {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: { performer: true },
  });
  if (!service) throw new Error('Service not found');

  const performerId = service.performerId || null;

  const slots: Record<string, string[]> = {};
  const days = nextNDays(30).map((d) => d.date);

  for (const day of days) {
    const dayKey = moment(day).format('YYYY-MM-DD');

    let start: Date;
    let end: Date;

    if (performerId) {
      const shift = await prisma.shift.findUnique({
        where: {
          performerId_date: {
            performerId,
            date: moment(day).startOf('day').toDate(),
          },
        },
      });

      if (shift) {
        if (shift.status !== 'AVAILABLE') {
          slots[dayKey] = [];
          continue;
        }

        const startStr = shift.startTime ? moment(shift.startTime).format('HH:mm') : DEFAULT_START;
        const endStr = shift.endTime ? moment(shift.endTime).format('HH:mm') : DEFAULT_END;

        start = moment(`${dayKey} ${startStr}`, 'YYYY-MM-DD HH:mm').toDate();
        end = moment(`${dayKey} ${endStr}`, 'YYYY-MM-DD HH:mm').toDate();
      } else {
        start = moment(`${dayKey} ${DEFAULT_START}`, 'YYYY-MM-DD HH:mm').toDate();
        end = moment(`${dayKey} ${DEFAULT_END}`, 'YYYY-MM-DD HH:mm').toDate();
      }
    } else {
      start = moment(`${dayKey} ${DEFAULT_START}`, 'YYYY-MM-DD HH:mm').toDate();
      end = moment(`${dayKey} ${DEFAULT_END}`, 'YYYY-MM-DD HH:mm').toDate();
    }

    let slotTime = start;
    const daySlots: string[] = [];

    while (slotTime < end) {
      const slotEnd = new Date(slotTime.getTime() + service.durationMin * 60000);

      const now = new Date();
      if (moment(slotEnd).isBefore(now)) {
        slotTime = slotEnd;
        continue;
      }

      const exists = await prisma.appointment.findFirst({
        where: {
          ...(performerId ? { service: { performerId } } : { serviceId: serviceId }),
          startDate: { lt: slotEnd },
          endDate: { gt: slotTime },
        },
      });

      if (!exists) daySlots.push(slotTime.toISOString());
      slotTime = slotEnd;
    }

    slots[dayKey] = daySlots;
  }

  return slots;
};
