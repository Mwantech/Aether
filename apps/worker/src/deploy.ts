import fs from 'fs-extra';
import path from 'path';

export const deployProject = async (
    workDir: string,
    outputDir: string,
    projectId: string,
    projectName: string,
    logCallback: (log: string) => void
): Promise<{ deployPath: string, previewUrl: string, size: number }> => {
    const deployRoot = path.join('C:\\Users\\USER\\Desktop\\NextVijo\\Aether\\deployments', projectId);

    logCallback(`Deploying to ${deployRoot}...`);

    // Ensure clean deploy directory
    await fs.emptyDir(deployRoot);

    // Copy artifacts
    const sourcePath = path.join(workDir, outputDir);
    await fs.copy(sourcePath, deployRoot);

    logCallback('Deployment artifacts copied successfully.');

    // In a real scenario, we would restart PM2 process or reload Nginx here
    // For POC, we'll just return the path

    // Calculate size
    const getDirSize = async (dir: string): Promise<number> => {
        const files = await fs.readdir(dir);
        const stats = await Promise.all(
            files.map(file => fs.stat(path.join(dir, file)))
        );

        return stats.reduce((acc, { size }) => acc + size, 0);
        // Note: This is shallow size for now to be safe/fast. 
        // For recursive, we'd need a recursive function.
        // Let's do a simple recursive one.
    };

    const getDirSizeRecursive = async (dir: string): Promise<number> => {
        const files = await fs.readdir(dir);
        const stats = await Promise.all(
            files.map(async file => {
                const filePath = path.join(dir, file);
                const stat = await fs.stat(filePath);
                if (stat.isDirectory()) return getDirSizeRecursive(filePath);
                return stat.size;
            })
        );
        return stats.reduce((acc, size) => acc + size, 0);
    };

    const size = await getDirSizeRecursive(deployRoot);

    return {
        deployPath: deployRoot,
        previewUrl: `http://${projectName}.aether.localhost:3005`,
        size
    };
};
