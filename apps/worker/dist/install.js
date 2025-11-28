"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.installDependencies = void 0;
const child_process_1 = require("child_process");
const util_1 = __importDefault(require("util"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const execAsync = util_1.default.promisify(child_process_1.exec);
const installDependencies = async (workDir, type, logCallback) => {
    logCallback(`Installing dependencies for ${type} project...`);
    try {
        if (type === 'node') {
            const hasLock = await fs_extra_1.default.pathExists(path_1.default.join(workDir, 'package-lock.json'));
            const hasYarn = await fs_extra_1.default.pathExists(path_1.default.join(workDir, 'yarn.lock'));
            const hasPnpm = await fs_extra_1.default.pathExists(path_1.default.join(workDir, 'pnpm-lock.yaml'));
            let command = 'npm install';
            if (hasYarn)
                command = 'yarn install';
            if (hasPnpm)
                command = 'pnpm install';
            logCallback(`Running ${command}...`);
            const { stdout, stderr } = await execAsync(command, { cwd: workDir });
            logCallback(stdout);
            if (stderr)
                logCallback(stderr);
        }
        else if (type === 'python') {
            logCallback('Setting up virtual environment...');
            await execAsync('python -m venv .venv', { cwd: workDir });
            // Install requirements
            if (await fs_extra_1.default.pathExists(path_1.default.join(workDir, 'requirements.txt'))) {
                logCallback('Installing requirements.txt...');
                // Use the venv python
                const pipCmd = process.platform === 'win32' ? '.venv\\Scripts\\pip' : '.venv/bin/pip';
                const { stdout, stderr } = await execAsync(`${pipCmd} install -r requirements.txt`, { cwd: workDir });
                logCallback(stdout);
                if (stderr)
                    logCallback(stderr);
            }
        }
        else {
            logCallback('No dependencies to install for this project type.');
        }
    }
    catch (error) {
        logCallback(`Installation failed: ${error.message}`);
        throw error;
    }
};
exports.installDependencies = installDependencies;
