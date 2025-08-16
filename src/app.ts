import express from 'express';
import { PrismaClient } from '@prisma/client';
import router from './routes';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use('/api', router);

export default app;
export { prisma };
