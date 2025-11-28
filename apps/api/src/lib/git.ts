import simpleGit from 'simple-git';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export const cloneAndScan = async (repoUrl: string, branch: string = 'main'): Promise<string[]> => {
    const tempDir = path.join(os.tmpdir(), `aether-${Date.now()}`);

    try {
        await fs.ensureDir(tempDir);
        const git = simpleGit();

        // Shallow clone to save time and bandwidth
        await git.clone(repoUrl, tempDir, ['--depth', '1', '--branch', branch]);

        const rootCandidates: string[] = [];

        const scanDir = async (dir: string) => {
            const items = await fs.readdir(dir);

            // Check if current directory is a candidate
            if (items.includes('package.json') || items.includes('Dockerfile')) {
                const relativePath = path.relative(tempDir, dir);
                rootCandidates.push(relativePath === '' ? '/' : `/${relativePath}`);
            }

            // Recurse into subdirectories (limit depth to avoid massive scans)
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = await fs.stat(fullPath);

                if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                    // Simple depth check: don't go too deep (e.g., max 3 levels)
                    const depth = path.relative(tempDir, fullPath).split(path.sep).length;
                    if (depth <= 3) {
                        await scanDir(fullPath);
                    }
                }
            }
        };

        await scanDir(tempDir);
        return rootCandidates.sort(); // Return sorted list
    } catch (error) {
        console.error('Error scanning repository:', error);
        throw new Error('Failed to scan repository');
    } finally {
        // Cleanup
        await fs.remove(tempDir);
    }
};
