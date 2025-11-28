"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildProject = void 0;
const child_process_1 = require("child_process");
const util_1 = __importDefault(require("util"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const execAsync = util_1.default.promisify(child_process_1.exec);
const buildProject = async (workDir, type, logCallback) => {
    logCallback(`Building ${type} project...`);
    try {
        if (type === 'node') {
            const pkg = await fs_extra_1.default.readJson(path_1.default.join(workDir, 'package.json'));
            if (pkg.scripts && pkg.scripts.build) {
                logCallback('Running npm run build...');
                const { stdout, stderr } = await execAsync('npm run build', { cwd: workDir });
                logCallback(stdout);
                if (stderr)
                    logCallback(stderr);
            }
            else {
                logCallback('No build script found, skipping build step.');
            }
            // Detect output directory
            if (await fs_extra_1.default.pathExists(path_1.default.join(workDir, 'dist')))
                return { outputDir: 'dist' };
            if (await fs_extra_1.default.pathExists(path_1.default.join(workDir, 'build')))
                return { outputDir: 'build' };
            if (await fs_extra_1.default.pathExists(path_1.default.join(workDir, '.next')))
                return { outputDir: '.next' };
            return { outputDir: '.' }; // Default to root if no build output found (e.g. simple express app)
        }
        else if (type === 'static') {
            return { outputDir: '.' };
        }
        return { outputDir: '.' };
    }
    catch (error) {
        logCallback(`Build failed: ${error.message}`);
        throw error;
    }
};
exports.buildProject = buildProject;
