"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const simple_git_1 = __importDefault(require("simple-git"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const detect_1 = require("./detect");
const install_1 = require("./install");
const build_1 = require("./build");
const deploy_1 = require("./deploy");
dotenv_1.default.config();
const API_URL = process.env.API_URL || 'http://localhost:3000';
const WORKER_TOKEN = process.env.WORKER_TOKEN || 'default-worker-token';
const worker = new bullmq_1.Worker('build-queue', async (job) => {
    const { deploymentId, repoUrl, branch, rootDir } = job.data;
    const tempDir = path_1.default.join(os_1.default.tmpdir(), `build-${deploymentId}`);
    const workDir = path_1.default.join(tempDir, rootDir || '');
    const redis = new ioredis_1.default({
        host: process.env.REDIS_HOST === 'localhost' ? '127.0.0.1' : (process.env.REDIS_HOST || '127.0.0.1'),
        port: 6379
    });
    const log = async (message) => {
        console.log(`[${deploymentId}] ${message}`);
        try {
            await fs_extra_1.default.appendFile('worker-debug.log', `[${new Date().toISOString()}] [${deploymentId}] ${message}\n`);
            await redis.publish(`logs:${deploymentId}`, JSON.stringify({ message, timestamp: new Date().toISOString() }));
        }
        catch (e) {
            console.error('Failed to write log', e);
        }
    };
    try {
        await log('Starting build job...');
        // 1. Clone
        await log(`Cloning ${repoUrl}#${branch}...`);
        await fs_extra_1.default.ensureDir(tempDir);
        const git = (0, simple_git_1.default)();
        await git.clone(repoUrl, tempDir, ['--depth', '1', '--branch', branch]);
        // 2. Detect
        const type = await (0, detect_1.detectProjectType)(workDir);
        const framework = await (0, detect_1.detectFramework)(workDir, type);
        await log(`Detected project type: ${type} (${framework || 'generic'})`);
        // 3. Install
        await (0, install_1.installDependencies)(workDir, type, log);
        // 4. Build
        const { outputDir } = await (0, build_1.buildProject)(workDir, type, log);
        // 5. Deploy
        const { deployPath, previewUrl, size } = await (0, deploy_1.deployProject)(workDir, outputDir, job.data.projectId, job.data.projectName, log);
        // Report success
        await axios_1.default.patch(`${API_URL}/deployments/${deploymentId}`, {
            status: 'READY',
            previewUrl,
            outputSize: size,
            logs: 'Build completed successfully.' // We should aggregate logs here
        }, {
            headers: { Authorization: `Bearer ${WORKER_TOKEN}` }
        });
    }
    catch (error) {
        await log(`Build failed: ${error.message}`);
        await axios_1.default.patch(`${API_URL}/deployments/${deploymentId}`, {
            status: 'FAILED',
            logs: `Build failed: ${error.message}`
        }, {
            headers: { Authorization: `Bearer ${WORKER_TOKEN}` }
        });
    }
    finally {
        await fs_extra_1.default.remove(tempDir);
    }
}, {
    connection: {
        host: process.env.REDIS_HOST === 'localhost' ? '127.0.0.1' : (process.env.REDIS_HOST || '127.0.0.1'),
        port: 6379
    }
});
worker.on('error', err => {
    console.error('Worker error:', err);
    fs_extra_1.default.appendFile('worker-debug.log', `[${new Date().toISOString()}] Worker error: ${err.message}\n`).catch(() => { });
});
worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
    fs_extra_1.default.appendFile('worker-debug.log', `[${new Date().toISOString()}] Job ${job?.id} failed: ${err.message}\n`).catch(() => { });
});
worker.on('ready', () => {
    console.log('Worker is ready and connected to Redis.');
    fs_extra_1.default.appendFile('worker-debug.log', `[${new Date().toISOString()}] Worker is ready and connected to Redis at ${process.env.REDIS_HOST === 'localhost' ? '127.0.0.1' : (process.env.REDIS_HOST || '127.0.0.1')}:6379\n`).catch(() => { });
});
console.log('Worker started listening for jobs...');
fs_extra_1.default.appendFile('worker-debug.log', `[${new Date().toISOString()}] Worker started listening for jobs (v3). Config: ${process.env.REDIS_HOST === 'localhost' ? '127.0.0.1' : (process.env.REDIS_HOST || '127.0.0.1')}\n`).catch(console.error);
