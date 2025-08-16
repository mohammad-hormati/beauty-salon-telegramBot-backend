import { Router } from 'express';
import { prisma } from '../app';

const router = Router();

// GET all services
router.get('/', async (req, res) => {
  const services = await prisma.service.findMany();
  res.json(services);
});

// POST create new service
router.post('/', async (req, res) => {
  const { name, durationMin, price } = req.body;
  try {
    const service = await prisma.service.create({
      data: { name, durationMin, price },
    });
    res.json(service);
  } catch (error) {
    res.status(400).json({ error: 'Error creating service' });
  }
});

export default router;
