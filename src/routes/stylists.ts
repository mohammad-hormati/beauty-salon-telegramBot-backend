// src/routes/stylists.ts
import { Router } from 'express';
import { prisma } from '../app';

const router = Router();

// GET all stylists
router.get('/', async (req, res) => {
  const stylists = await prisma.stylist.findMany({
    include: { services: { include: { service: true } } },
  });
  res.json(stylists);
});

// POST create new stylist
router.post('/', async (req, res) => {
  const { name } = req.body;
  try {
    const stylist = await prisma.stylist.create({ data: { name } });
    res.json(stylist);
  } catch (error) {
    res.status(400).json({ error: 'Error creating stylist' });
  }
});

export default router;
