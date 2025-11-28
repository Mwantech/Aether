"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectFramework = exports.detectProjectType = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const detectProjectType = async (workDir) => {
    const files = await fs_extra_1.default.readdir(workDir);
    if (files.includes('Dockerfile')) {
        return 'docker';
    }
    if (files.includes('package.json')) {
        return 'node';
    }
    if (files.includes('requirements.txt') || files.includes('pyproject.toml')) {
        return 'python';
    }
    if (files.includes('index.html')) {
        return 'static';
    }
    return 'unknown';
};
exports.detectProjectType = detectProjectType;
const detectFramework = async (workDir, type) => {
    if (type === 'node') {
        const pkg = await fs_extra_1.default.readJson(path_1.default.join(workDir, 'package.json'));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (deps['next'])
            return 'nextjs';
        if (deps['vite'])
            return 'vite';
        if (deps['react-scripts'])
            return 'create-react-app';
        if (deps['express'])
            return 'express';
        if (deps['nest'])
            return 'nestjs';
    }
    return null;
};
exports.detectFramework = detectFramework;
