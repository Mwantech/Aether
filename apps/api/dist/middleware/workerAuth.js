"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateWorker = void 0;
const WORKER_TOKEN = process.env.WORKER_TOKEN || 'default-worker-token';
const authenticateWorker = (req, res, next) => {
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
exports.authenticateWorker = authenticateWorker;
