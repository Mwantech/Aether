"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const bullmq_1 = require("bullmq");
const git_1 = require("../lib/git");
const router = express_1.default.Router();
const buildQueue = new bullmq_1.Queue('build-queue', {
    connection: {
        host: process.env.REDIS_HOST === 'localhost' ? '127.0.0.1' : (process.env.REDIS_HOST || '127.0.0.1'),
        port: 6379
    }
});
// Debug log for API Redis connection
const fs_1 = __importDefault(require("fs"));
const redisHost = process.env.REDIS_HOST === 'localhost' ? '127.0.0.1' : (process.env.REDIS_HOST || '127.0.0.1');
fs_1.default.appendFileSync('api-debug.log', `[${new Date().toISOString()}] API Queue initialized with Redis: ${redisHost}:6379\n`);
// Get all projects for the authenticated user
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const projects = await prisma_1.default.project.findMany({
            where: { userId: req.user.id },
            orderBy: { updatedAt: 'desc' },
            include: { deployments: { orderBy: { createdAt: 'desc' }, take: 1 } }
        });
        res.json(projects);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});
// Create a new project
router.post('/', auth_1.authenticate, async (req, res) => {
    try {
        const { name, repoUrl, branch } = req.body;
        const project = await prisma_1.default.project.create({
            data: {
                name,
                repoUrl,
                branch: branch || 'main',
                userId: req.user.id
            }
        });
        res.status(201).json(project);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create project' });
    }
});
// Detect root directories
router.post('/:id/detect-roots', auth_1.authenticate, async (req, res) => {
    try {
        const project = await prisma_1.default.project.findUnique({
            where: { id: req.params.id, userId: req.user.id }
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        const roots = await (0, git_1.cloneAndScan)(project.repoUrl, project.branch);
        res.json({ roots });
    }
    catch (error) {
        console.error('Root detection failed:', error);
        res.status(500).json({ error: 'Failed to detect root directories' });
    }
});
// Update project (e.g., set rootDir, buildCommand, status, etc.)
router.patch('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { name, rootDir, buildCommand, installCommand, outputDir, envVars, status, branch, runtime, domain } = req.body;
        // If updating name, check for uniqueness
        if (name) {
            const existing = await prisma_1.default.project.findUnique({ where: { name } });
            if (existing && existing.id !== req.params.id) {
                return res.status(400).json({ error: 'Project name already taken' });
            }
        }
        const project = await prisma_1.default.project.update({
            where: { id: req.params.id, userId: req.user.id },
            data: {
                ...(name && { name }),
                ...(rootDir && { rootDir }),
                ...(branch && { branch }),
                ...(runtime && { runtime }),
                ...(domain && { domain }),
                ...(buildCommand && { buildCommand }),
                ...(installCommand && { installCommand }),
                ...(outputDir && { outputDir }),
                ...(envVars && { envVars }),
                ...(status && { status })
            }
        });
        res.json(project);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update project' });
    }
});
// Delete project
router.delete('/:id', auth_1.authenticate, async (req, res) => {
    try {
        // First verify ownership
        const project = await prisma_1.default.project.findUnique({
            where: { id: req.params.id, userId: req.user.id }
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        // Delete deployments first (cascade usually handles this but good to be explicit or if cascade not set)
        await prisma_1.default.deployment.deleteMany({
            where: { projectId: project.id }
        });
        await prisma_1.default.project.delete({
            where: { id: project.id }
        });
        res.json({ message: 'Project deleted successfully' });
    }
    catch (error) {
        console.error('Delete failed:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});
// Trigger a deployment
router.post('/:id/deploy', auth_1.authenticate, async (req, res) => {
    try {
        const project = await prisma_1.default.project.findUnique({
            where: { id: req.params.id, userId: req.user.id }
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        const deployment = await prisma_1.default.deployment.create({
            data: {
                projectId: project.id,
                status: 'QUEUED'
            }
        });
        await buildQueue.add('build', {
            deploymentId: deployment.id,
            projectId: project.id,
            projectName: project.name,
            repoUrl: project.repoUrl,
            branch: project.branch,
            rootDir: project.rootDir || '/',
            buildCommand: project.buildCommand,
            installCommand: project.installCommand,
            outputDir: project.outputDir
        });
        res.json(deployment);
    }
    catch (error) {
        console.error('Deploy failed:', error);
        res.status(500).json({ error: 'Failed to trigger deployment' });
    }
});
exports.default = router;
