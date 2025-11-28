import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { json } from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(morgan('dev'));
app.use(json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import deploymentRoutes from './routes/deployments';
import webhookRoutes from './routes/webhooks';

app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/deployments', deploymentRoutes);
app.use('/webhooks', webhookRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
