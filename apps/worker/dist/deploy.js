"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deployProject = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const deployProject = async (workDir, outputDir, projectId, projectName, logCallback) => {
    const deployRoot = path_1.default.join('C:\\Users\\USER\\Desktop\\NextVijo\\Aether\\deployments', projectId);
    logCallback(`Deploying to ${deployRoot}...`);
    // Ensure clean deploy directory
    await fs_extra_1.default.emptyDir(deployRoot);
    // Copy artifacts
    const sourcePath = path_1.default.join(workDir, outputDir);
    await fs_extra_1.default.copy(sourcePath, deployRoot);
    logCallback('Deployment artifacts copied successfully.');
    // In a real scenario, we would restart PM2 process or reload Nginx here
    // For POC, we'll just return the path
    // Calculate size
    const getDirSize = async (dir) => {
        const files = await fs_extra_1.default.readdir(dir);
        const stats = await Promise.all(files.map(file => fs_extra_1.default.stat(path_1.default.join(dir, file))));
        return stats.reduce((acc, { size }) => acc + size, 0);
        // Note: This is shallow size for now to be safe/fast. 
        // For recursive, we'd need a recursive function.
        // Let's do a simple recursive one.
    };
    const getDirSizeRecursive = async (dir) => {
        const files = await fs_extra_1.default.readdir(dir);
        const stats = await Promise.all(files.map(async (file) => {
            const filePath = path_1.default.join(dir, file);
            const stat = await fs_extra_1.default.stat(filePath);
            if (stat.isDirectory())
                return getDirSizeRecursive(filePath);
            return stat.size;
        }));
        return stats.reduce((acc, size) => acc + size, 0);
    };
    const size = await getDirSizeRecursive(deployRoot);
    return {
        deployPath: deployRoot,
        previewUrl: `http://${projectName}.aether.localhost:3005`,
        size
    };
};
exports.deployProject = deployProject;
