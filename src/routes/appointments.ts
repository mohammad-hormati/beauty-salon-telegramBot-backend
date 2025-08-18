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

    const service = await prisma.service.findUnique({
      where: { id: Number(serviceId) },
    });
    if (!service) return res.status(404).json({ error: 'Service not found' });

    const start = new Date(startDate);
    const end = new Date(start.getTime() + service.durationMin * 60000); 

    const appointment = await prisma.appointment.create({
      data: {
        userId: user.id,
        serviceId: service.id,
        startDate: start,
        endDate: end,
      },
      include: { user: true, service: true },
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
