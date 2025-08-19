import { Router } from 'express';
import servicesRouter from './services';
import appointmentsRouter from './appointments';
import usersRouter from './users';
import shiftsRouter from './shifts';

const router = Router();

router.use('/services', servicesRouter);
router.use('/appointments', appointmentsRouter);
router.use('/users', usersRouter);
router.use('/shifts', shiftsRouter);

router.get('/', (req, res) => res.send('API is running'));

export default router;
