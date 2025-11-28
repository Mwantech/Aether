"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const workerAuth_1 = require("../middleware/workerAuth");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Update deployment status (called by Worker)
router.patch('/:id', workerAuth_1.authenticateWorker, async (req, res) => {
    try {
        const { status, logs, previewUrl, imageUrl, buildTime, outputSize } = req.body;
        const deployment = await prisma_1.default.deployment.update({
            where: { id: req.params.id },
            data: {
                ...(status && { status }),
                ...(logs && { logs }),
                ...(previewUrl && { previewUrl }),
                ...(imageUrl && { imageUrl }),
                ...(buildTime && { buildTime }),
                ...(outputSize && { outputSize })
            }
        });
        // Also update the project status if deployment is ready
        if (status === 'READY') {
            await prisma_1.default.project.update({
                where: { id: deployment.projectId },
                data: { updatedAt: new Date() } // Just touch it for now, or maybe set a 'lastDeployedAt'
            });
        }
        res.json(deployment);
    }
    catch (error) {
        console.error('Failed to update deployment:', error);
        res.status(500).json({ error: 'Failed to update deployment' });
    }
});
// Get recent deployments
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const deployments = await prisma_1.default.deployment.findMany({
            where: {
                project: {
                    userId: req.user.id
                }
            },
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                project: {
                    select: { name: true }
                }
            }
        });
        res.json(deployments);
    }
    catch (error) {
        console.error('Failed to fetch deployments:', error);
        res.status(500).json({ error: 'Failed to fetch deployments' });
    }
});
// Stream logs via SSE
const ioredis_1 = __importDefault(require("ioredis"));
router.get('/:id/logs', async (req, res) => {
    const { id } = req.params;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    const redis = new ioredis_1.default({
        host: process.env.REDIS_HOST === 'localhost' ? '127.0.0.1' : (process.env.REDIS_HOST || '127.0.0.1'),
        port: 6379
    });
    await redis.subscribe(`logs:${id}`);
    redis.on('message', (channel, message) => {
        if (channel === `logs:${id}`) {
            res.write(`data: ${message}\n\n`);
        }
    });
    // Send initial ping
    res.write(`data: ${JSON.stringify({ message: 'Connected to log stream', timestamp: new Date().toISOString() })}\n\n`);
    req.on('close', () => {
        redis.disconnect();
    });
});
exports.default = router;
