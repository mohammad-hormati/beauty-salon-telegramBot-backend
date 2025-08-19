import { Router } from 'express';
import { prisma } from '../app';
import { getAvailableSlots } from '../services/appointmentService';

const router = Router();

// GET all appointments
router.get('/', async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      include: { user: true, service: true },
    });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching appointments' });
  }
});

// POST create new appointment
router.post('/', async (req, res) => {
  const { telegramId, name, phone, serviceId, startDate } = req.body;

  if (!telegramId || !serviceId || !startDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1) تضمین وجود کاربر با telegramId
    let user = await prisma.user.findUnique({
      where: { telegramId: String(telegramId) },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: String(telegramId),
          name: name || 'نام نامشخص',
          phone: phone || null,
        },
      });
    }

    // 2) سرویس + پرسنل + مدت زمان
    const service = await prisma.service.findUnique({
      where: { id: Number(serviceId) },
      include: { performer: true },
    });
    if (!service) return res.status(400).json({ error: 'Service not found' });

    const start = new Date(startDate);
    const end = new Date(start.getTime() + service.durationMin * 60000);

    // 3) اگر سرویس پرسنل دارد، شیفت همان روز را بررسی کن
    if (service.performerId) {
      const dayKey = require('moment')(start).format('YYYY-MM-DD');
      const shift = await prisma.shift.findUnique({
        where: {
          performerId_date: {
            performerId: service.performerId,
            date: require('moment')(dayKey, 'YYYY-MM-DD').startOf('day').toDate(),
          },
        },
      });

      // اگر شیفت OFF/LEAVE → خطا
      if (shift && shift.status !== 'AVAILABLE') {
        return res.status(400).json({ error: 'Performer is not available on this day' });
      }

      // بازه مجاز (شیفت یا پیش‌فرض)
      const sStr = shift?.startTime ? require('moment')(shift.startTime).format('HH:mm') : '09:00';
      const eStr = shift?.endTime ? require('moment')(shift.endTime).format('HH:mm') : '18:00';

      const windowStart = require('moment')(`${dayKey} ${sStr}`, 'YYYY-MM-DD HH:mm').toDate();
      const windowEnd = require('moment')(`${dayKey} ${eStr}`, 'YYYY-MM-DD HH:mm').toDate();

      if (!(start >= windowStart && end <= windowEnd)) {
        return res.status(400).json({ error: 'Selected time is outside performer shift window' });
      }

      // 4) تداخل با نوبت‌های همان پرسنل
      const conflict = await prisma.appointment.findFirst({
        where: {
          service: { performerId: service.performerId },
          startDate: { lt: end },
          endDate: { gt: start },
        },
      });
      if (conflict) {
        return res.status(400).json({ error: 'Time slot is already booked' });
      }
    } else {
      const conflict = await prisma.appointment.findFirst({
        where: {
          serviceId: service.id,
          startDate: { lt: end },
          endDate: { gt: start },
        },
      });
      if (conflict) {
        return res.status(400).json({ error: 'Time slot is already booked' });
      }
    }

    // 5) ایجاد نوبت
    const appointment = await prisma.appointment.create({
      data: {
        userId: user.id,
        serviceId: service.id,
        startDate: start,
        endDate: end,
      },
    });

    res.json(appointment);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error creating appointment' });
  }
});

// GET available slots
router.get('/available/:serviceId', async (req, res) => {
  const { serviceId } = req.params;
  try {
    const slots = await getAvailableSlots(Number(serviceId));
    res.json(slots);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
