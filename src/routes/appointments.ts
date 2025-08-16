import { Router } from 'express';
import { prisma } from '../app';
import { getAvailableSlots } from '../services/appointmentService';

const router = Router();

// GET all appointments
router.get('/', async (req, res) => {
  const appointments = await prisma.appointment.findMany({
    include: { user: true, service: true },
  });
  res.json(appointments);
});

router.post('/', async (req, res) => {
  const { telegramId, name, phone, serviceId, date } = req.body;

  if (!telegramId || !serviceId || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
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

    const appointment = await prisma.appointment.create({
      data: {
        userId: user.id,
        serviceId: Number(serviceId),
        date: new Date(date),
      },
    });

    res.json(appointment);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error creating appointment' });
  }
});

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
