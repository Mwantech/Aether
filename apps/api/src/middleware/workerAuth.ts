import { Request, Response, NextFunction } from 'express';

const WORKER_TOKEN = process.env.WORKER_TOKEN || 'default-worker-token';

export const authenticateWorker = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    if (token !== WORKER_TOKEN) {
        return res.status(403).json({ error: 'Invalid worker token' });
    }

    next();
};
