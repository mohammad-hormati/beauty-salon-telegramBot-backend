import { Router } from 'express';
import { prisma } from '../app';
import moment from 'moment';

const router = Router();

// ✅ Create new shift
router.post('/', async (req, res) => {
  try {
    const { performerId, date, status, startTime, endTime } = req.body;

    if (!performerId || !date || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const day = moment(date, 'YYYY-MM-DD');
    if (!day.isValid()) return res.status(400).json({ error: 'Invalid date' });

    const startDT = startTime ? moment(`${date} ${startTime}`, 'YYYY-MM-DD HH:mm') : null;
    const endDT = endTime ? moment(`${date} ${endTime}`, 'YYYY-MM-DD HH:mm') : null;

    if (startDT && endDT && !endDT.isAfter(startDT)) {
      return res.status(400).json({ error: 'endTime must be after startTime' });
    }

    const shift = await prisma.shift.create({
      data: {
        performerId: Number(performerId),
        date: day.startOf('day').toDate(),
        status,
        startTime: startDT ? startDT.toDate() : null,
        endTime: endDT ? endDT.toDate() : null,
      },
    });

    res.json(shift);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: 'Cannot create shift' });
  }
});

// ✅ Upsert (update or insert if exists)
router.post('/upsert', async (req, res) => {
  try {
    const { performerId, date, status, startTime, endTime } = req.body;

    if (!performerId || !date || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const day = moment(date, 'YYYY-MM-DD');
    if (!day.isValid()) return res.status(400).json({ error: 'Invalid date' });

    const startDT = startTime ? moment(`${date} ${startTime}`, 'YYYY-MM-DD HH:mm') : null;
    const endDT = endTime ? moment(`${date} ${endTime}`, 'YYYY-MM-DD HH:mm') : null;

    if (startDT && endDT && !endDT.isAfter(startDT)) {
      return res.status(400).json({ error: 'endTime must be after startTime' });
    }

    const data = {
      performerId: Number(performerId),
      date: day.startOf('day').toDate(),
      status,
      startTime: startDT ? startDT.toDate() : null,
      endTime: endDT ? endDT.toDate() : null,
    };

    const shift = await prisma.shift.upsert({
      where: {
        performerId_date: {
          performerId: data.performerId,
          date: data.date,
        },
      },
      create: data,
      update: {
        status: data.status,
        startTime: data.startTime,
        endTime: data.endTime,
      },
    });

    res.json(shift);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: 'Cannot upsert shift' });
  }
});

// ✅ Get all shifts by performer & date range
router.get('/', async (req, res) => {
  try {
    const { performerId, from, to } = req.query as Record<string, string>;
    if (!performerId || !from || !to) {
      return res.status(400).json({ error: 'Missing required query params' });
    }
    const fromD = moment(from, 'YYYY-MM-DD').startOf('day');
    const toD = moment(to, 'YYYY-MM-DD').endOf('day');
    if (!fromD.isValid() || !toD.isValid()) {
      return res.status(400).json({ error: 'Invalid date range' });
    }

    const shifts = await prisma.shift.findMany({
      where: {
        performerId: Number(performerId),
        date: {
          gte: fromD.toDate(),
          lte: toD.toDate(),
        },
      },
      orderBy: { date: 'asc' },
    });

    res.json(shifts);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: 'Cannot fetch shifts' });
  }
});

// ✅ Get single shift by ID
router.get('/:id', async (req, res) => {
  try {
    const shift = await prisma.shift.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!shift) return res.status(404).json({ error: 'Shift not found' });

    res.json(shift);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: 'Cannot fetch shift' });
  }
});

// ✅ Update shift by ID
router.put('/:id', async (req, res) => {
  try {
    const { status, startTime, endTime } = req.body;

    const shift = await prisma.shift.update({
      where: { id: Number(req.params.id) },
      data: {
        status,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
      },
    });

    res.json(shift);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: 'Cannot update shift' });
  }
});

// ✅ Delete shift by ID
router.delete('/:id', async (req, res) => {
  try {
    await prisma.shift.delete({
      where: { id: Number(req.params.id) },
    });

    res.json({ message: 'Shift deleted successfully' });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: 'Cannot delete shift' });
  }
});

export default router;
