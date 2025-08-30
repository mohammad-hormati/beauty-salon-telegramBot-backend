import { Router } from 'express';
import { prisma } from '../app';

const router = Router();

// ✅ GET all services
router.get('/', async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      include: { performer: true },
    });
    res.json(services);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error fetching services' });
  }
});

// ✅ GET service by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const service = await prisma.service.findUnique({
      where: { id: Number(id) },
      include: { performer: true },
    });
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service);
  } catch (error) {
    res.status(400).json({ error: 'Error fetching service' });
  }
});

// ✅ POST create new service
router.post('/', async (req, res) => {
  const { name, durationMin, price, performerId } = req.body;
  try {
    const service = await prisma.service.create({
      data: { name, durationMin, price, performerId },
    });
    res.json(service);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error creating service' });
  }
});

// ✅ PUT update service
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, durationMin, price, performerId } = req.body;
  try {
    const service = await prisma.service.update({
      where: { id: Number(id) },
      data: { name, durationMin, price, performerId },
    });
    res.json(service);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error updating service' });
  }
});

// ✅ DELETE service
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.service.delete({ where: { id: Number(id) } });
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error deleting service' });
  }
});

export default router;
