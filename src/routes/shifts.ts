import { Router } from 'express';
import { prisma } from '../app';
import moment from 'moment';

const router = Router();

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

export default router;
