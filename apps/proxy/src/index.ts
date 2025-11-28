import express from 'express';
import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

app.use(async (req, res, next) => {
    const host = req.headers.host;
    if (!host) return next();

    // Parse subdomain
    // Format: project-name.aether.localhost:3005
    // or localhost:3005/project-id (fallback)

    const parts = host.split('.');
    let projectId: string | null = null;

    // Check for branded domain: project.aether.localhost
    if (host.includes('.aether.localhost')) {
        const projectName = parts[0];
        console.log(`[Proxy] Lookup project: ${projectName}`);
        try {
            const result = await pool.query('SELECT id, name FROM "Project" WHERE LOWER(name) = LOWER($1)', [projectName]);
            console.log(`[Proxy] DB Result:`, result.rows);
            if (result.rows.length > 0) {
                projectId = result.rows[0].id;
                console.log(`[Proxy] Found Project ID: ${projectId}`);
            } else {
                console.log(`[Proxy] Project not found in DB`);
            }
        } catch (error) {
            console.error('Database error:', error);
        }
    }

    if (projectId) {
        // Serve static files from deployments/projectId
        const deployPath = path.join('C:\\Users\\USER\\Desktop\\NextVijo\\Aether\\deployments', projectId);

        if (fs.existsSync(deployPath)) {
            return express.static(deployPath)(req, res, next);
        }
    }

    next();
});

// Fallback for direct ID access (localhost:3005/projectId)
// This is useful for debugging or if DNS isn't working
app.use('/:projectId', async (req, res, next) => {
    const { projectId } = req.params;
    const deployPath = path.join('C:\\Users\\USER\\Desktop\\NextVijo\\Aether\\deployments', projectId);

    if (fs.existsSync(deployPath)) {
        // Strip the projectId from the URL so the static middleware sees /index.html instead of /projectId/index.html
        req.url = req.url.replace(`/${projectId}`, '') || '/';
        return express.static(deployPath)(req, res, next);
    }

    next();
});

app.get('*', (req, res) => {
    res.status(404).send('Deployment not found');
});

app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
});
