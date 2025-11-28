"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloneAndScan = void 0;
const simple_git_1 = __importDefault(require("simple-git"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const cloneAndScan = async (repoUrl, branch = 'main') => {
    const tempDir = path_1.default.join(os_1.default.tmpdir(), `aether-${Date.now()}`);
    try {
        await fs_extra_1.default.ensureDir(tempDir);
        const git = (0, simple_git_1.default)();
        // Shallow clone to save time and bandwidth
        await git.clone(repoUrl, tempDir, ['--depth', '1', '--branch', branch]);
        const rootCandidates = [];
        const scanDir = async (dir) => {
            const items = await fs_extra_1.default.readdir(dir);
            // Check if current directory is a candidate
            if (items.includes('package.json') || items.includes('Dockerfile')) {
                const relativePath = path_1.default.relative(tempDir, dir);
                rootCandidates.push(relativePath === '' ? '/' : `/${relativePath}`);
            }
            // Recurse into subdirectories (limit depth to avoid massive scans)
            for (const item of items) {
                const fullPath = path_1.default.join(dir, item);
                const stat = await fs_extra_1.default.stat(fullPath);
                if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                    // Simple depth check: don't go too deep (e.g., max 3 levels)
                    const depth = path_1.default.relative(tempDir, fullPath).split(path_1.default.sep).length;
                    if (depth <= 3) {
                        await scanDir(fullPath);
                    }
                }
            }
        };
        await scanDir(tempDir);
        return rootCandidates.sort(); // Return sorted list
    }
    catch (error) {
        console.error('Error scanning repository:', error);
        throw new Error('Failed to scan repository');
    }
    finally {
        // Cleanup
        await fs_extra_1.default.remove(tempDir);
    }
};
exports.cloneAndScan = cloneAndScan;
