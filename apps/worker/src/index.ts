import { Worker } from 'bullmq';
import Redis from 'ioredis';
import simpleGit from 'simple-git';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import axios from 'axios';
import dotenv from 'dotenv';
import { detectProjectType, detectFramework } from './detect';
import { installDependencies } from './install';
import { buildProject } from './build';
import { deployProject } from './deploy';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3000';
const WORKER_TOKEN = process.env.WORKER_TOKEN || 'default-worker-token';

const worker = new Worker('build-queue', async (job) => {
    const { deploymentId, repoUrl, branch, rootDir } = job.data;
    const tempDir = path.join(os.tmpdir(), `build-${deploymentId}`);
    const workDir = path.join(tempDir, rootDir || '');

    const redis = new Redis({
        host: process.env.REDIS_HOST === 'localhost' ? '127.0.0.1' : (process.env.REDIS_HOST || '127.0.0.1'),
        port: 6379
    });

    const log = async (message: string) => {
        console.log(`[${deploymentId}] ${message}`);
        try {
            await fs.appendFile('worker-debug.log', `[${new Date().toISOString()}] [${deploymentId}] ${message}\n`);
            await redis.publish(`logs:${deploymentId}`, JSON.stringify({ message, timestamp: new Date().toISOString() }));
        } catch (e) { console.error('Failed to write log', e); }
    };

    try {
        await log('Starting build job...');

        // 1. Clone
        await log(`Cloning ${repoUrl}#${branch}...`);
        await fs.ensureDir(tempDir);
        const git = simpleGit();
        await git.clone(repoUrl, tempDir, ['--depth', '1', '--branch', branch]);

        // 2. Detect
        const type = await detectProjectType(workDir);
        const framework = await detectFramework(workDir, type);
        await log(`Detected project type: ${type} (${framework || 'generic'})`);

        // 3. Install
        await installDependencies(workDir, type, log);

        // 4. Build
        const { outputDir } = await buildProject(workDir, type, log);

        // 5. Deploy
        const { deployPath, previewUrl, size } = await deployProject(workDir, outputDir, job.data.projectId, job.data.projectName, log);

        // Report success
        await axios.patch(`${API_URL}/deployments/${deploymentId}`, {
            status: 'READY',
            previewUrl,
            outputSize: size,
            logs: 'Build completed successfully.' // We should aggregate logs here
        }, {
            headers: { Authorization: `Bearer ${WORKER_TOKEN}` }
        });

    } catch (error: any) {
        await log(`Build failed: ${error.message}`);
        await axios.patch(`${API_URL}/deployments/${deploymentId}`, {
            status: 'FAILED',
            logs: `Build failed: ${error.message}`
        }, {
            headers: { Authorization: `Bearer ${WORKER_TOKEN}` }
        });
    } finally {
        await fs.remove(tempDir);
    }
}, {
    connection: {
        host: process.env.REDIS_HOST === 'localhost' ? '127.0.0.1' : (process.env.REDIS_HOST || '127.0.0.1'),
        port: 6379
    }
});

worker.on('error', err => {
    console.error('Worker error:', err);
    fs.appendFile('worker-debug.log', `[${new Date().toISOString()}] Worker error: ${err.message}\n`).catch(() => { });
});

worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
    fs.appendFile('worker-debug.log', `[${new Date().toISOString()}] Job ${job?.id} failed: ${err.message}\n`).catch(() => { });
});

worker.on('ready', () => {
    console.log('Worker is ready and connected to Redis.');
    fs.appendFile('worker-debug.log', `[${new Date().toISOString()}] Worker is ready and connected to Redis at ${process.env.REDIS_HOST === 'localhost' ? '127.0.0.1' : (process.env.REDIS_HOST || '127.0.0.1')}:6379\n`).catch(() => { });
});

console.log('Worker started listening for jobs...');
fs.appendFile('worker-debug.log', `[${new Date().toISOString()}] Worker started listening for jobs (v3). Config: ${process.env.REDIS_HOST === 'localhost' ? '127.0.0.1' : (process.env.REDIS_HOST || '127.0.0.1')}\n`).catch(console.error);
