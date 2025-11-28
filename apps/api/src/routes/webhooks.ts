import express, { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { Queue } from 'bullmq';

const router = express.Router();
const buildQueue = new Queue('build-queue', {
    connection: {
        host: process.env.REDIS_HOST === 'localhost' ? '127.0.0.1' : (process.env.REDIS_HOST || '127.0.0.1'),
        port: 6379
    }
});

// Webhook to trigger deployment
// POST /webhooks/:projectId
router.post('/:projectId', async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;

        // Verify project exists
        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Create deployment
        const deployment = await prisma.deployment.create({
            data: {
                projectId: project.id,
                status: 'QUEUED',
                logs: 'Triggered via Webhook'
            }
        });

        // Add to queue
        await buildQueue.add('build', {
            deploymentId: deployment.id,
            projectId: project.id,
            projectName: project.name,
            repoUrl: project.repoUrl,
            branch: project.branch,
            rootDir: project.rootDir || '/',
            buildCommand: project.buildCommand,
            installCommand: project.installCommand,
            outputDir: project.outputDir,
            runtime: (project as any).runtime
        });

        res.json({ message: 'Deployment triggered', deploymentId: deployment.id });
    } catch (error) {
        console.error('Webhook failed:', error);
        res.status(500).json({ error: 'Failed to process webhook' });
    }
});

export default router;
