import fs from 'fs-extra';
import path from 'path';

export type ProjectType = 'node' | 'python' | 'static' | 'docker' | 'unknown';

export const detectProjectType = async (workDir: string): Promise<ProjectType> => {
    const files = await fs.readdir(workDir);

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

export const detectFramework = async (workDir: string, type: ProjectType): Promise<string | null> => {
    if (type === 'node') {
        const pkg = await fs.readJson(path.join(workDir, 'package.json'));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };

        if (deps['next']) return 'nextjs';
        if (deps['vite']) return 'vite';
        if (deps['react-scripts']) return 'create-react-app';
        if (deps['express']) return 'express';
        if (deps['nest']) return 'nestjs';
    }
    return null;
};
