import { Router } from 'express';
import { prisma } from '../app';

const router = Router();

// GET all users
router.get('/', async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

// Get user by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({
    where: { telegramId: id },
  });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// POST create new user
router.post('/', async (req, res) => {
  const { name, phone, telegramId } = req.body;
  try {
    const user = await prisma.user.create({
      data: { name, phone, telegramId },
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: 'Error creating user' });
  }
});

// PUT update user by telegramId
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, phone } = req.body;

  try {
    const user = await prisma.user.update({
      where: { telegramId: id },
      data: { name, phone },
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: 'Error updating user' });
  }
});

export default router;
