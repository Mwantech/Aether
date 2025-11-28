import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs-extra';
import { ProjectType } from './detect';

const execAsync = util.promisify(exec);

export const buildProject = async (
    workDir: string,
    type: ProjectType,
    logCallback: (log: string) => void
): Promise<{ outputDir: string }> => {
    logCallback(`Building ${type} project...`);

    try {
        if (type === 'node') {
            const pkg = await fs.readJson(path.join(workDir, 'package.json'));

            if (pkg.scripts && pkg.scripts.build) {
                logCallback('Running npm run build...');
                const { stdout, stderr } = await execAsync('npm run build', { cwd: workDir });
                logCallback(stdout);
                if (stderr) logCallback(stderr);
            } else {
                logCallback('No build script found, skipping build step.');
            }

            // Detect output directory
            if (await fs.pathExists(path.join(workDir, 'dist'))) return { outputDir: 'dist' };
            if (await fs.pathExists(path.join(workDir, 'build'))) return { outputDir: 'build' };
            if (await fs.pathExists(path.join(workDir, '.next'))) return { outputDir: '.next' };

            return { outputDir: '.' }; // Default to root if no build output found (e.g. simple express app)
        } else if (type === 'static') {
            return { outputDir: '.' };
        }

        return { outputDir: '.' };
    } catch (error: any) {
        logCallback(`Build failed: ${error.message}`);
        throw error;
    }
};
