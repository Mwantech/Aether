import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs-extra';
import { ProjectType } from './detect';

const execAsync = util.promisify(exec);

export const installDependencies = async (
    workDir: string,
    type: ProjectType,
    logCallback: (log: string) => void
) => {
    logCallback(`Installing dependencies for ${type} project...`);

    try {
        if (type === 'node') {
            const hasLock = await fs.pathExists(path.join(workDir, 'package-lock.json'));
            const hasYarn = await fs.pathExists(path.join(workDir, 'yarn.lock'));
            const hasPnpm = await fs.pathExists(path.join(workDir, 'pnpm-lock.yaml'));

            let command = 'npm install';
            if (hasYarn) command = 'yarn install';
            if (hasPnpm) command = 'pnpm install';

            logCallback(`Running ${command}...`);
            const { stdout, stderr } = await execAsync(command, { cwd: workDir });
            logCallback(stdout);
            if (stderr) logCallback(stderr);
        } else if (type === 'python') {
            logCallback('Setting up virtual environment...');
            await execAsync('python -m venv .venv', { cwd: workDir });

            // Install requirements
            if (await fs.pathExists(path.join(workDir, 'requirements.txt'))) {
                logCallback('Installing requirements.txt...');
                // Use the venv python
                const pipCmd = process.platform === 'win32' ? '.venv\\Scripts\\pip' : '.venv/bin/pip';
                const { stdout, stderr } = await execAsync(`${pipCmd} install -r requirements.txt`, { cwd: workDir });
                logCallback(stdout);
                if (stderr) logCallback(stderr);
            }
        } else {
            logCallback('No dependencies to install for this project type.');
        }
    } catch (error: any) {
        logCallback(`Installation failed: ${error.message}`);
        throw error;
    }
};
