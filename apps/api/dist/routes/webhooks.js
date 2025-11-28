"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const bullmq_1 = require("bullmq");
const router = express_1.default.Router();
const buildQueue = new bullmq_1.Queue('build-queue', {
    connection: {
        host: process.env.REDIS_HOST === 'localhost' ? '127.0.0.1' : (process.env.REDIS_HOST || '127.0.0.1'),
        port: 6379
    }
});
// Webhook to trigger deployment
// POST /webhooks/:projectId
router.post('/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        // Verify project exists
        const project = await prisma_1.default.project.findUnique({
            where: { id: projectId }
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        // Create deployment
        const deployment = await prisma_1.default.deployment.create({
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
            runtime: project.runtime
        });
        res.json({ message: 'Deployment triggered', deploymentId: deployment.id });
    }
    catch (error) {
        console.error('Webhook failed:', error);
        res.status(500).json({ error: 'Failed to process webhook' });
    }
});
exports.default = router;
