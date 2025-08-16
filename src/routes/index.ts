import { Router } from 'express';
import servicesRouter from './services';
import stylistsRouter from './stylists';
import appointmentsRouter from './appointments';
import usersRouter from './users';

const router = Router();

router.use('/services', servicesRouter);
router.use('/stylists', stylistsRouter);
router.use('/appointments', appointmentsRouter);
router.use('/users', usersRouter);

router.get('/', (req, res) => res.send('API is running'));

export default router;
