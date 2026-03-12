const Redis = require('ioredis');

// Shared Redis client (initialized outside the handler for connection pooling in Vercel)
let redis;

module.exports = async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const redisUrl = process.env.REDIS_URL;

        if (!redisUrl) {
            throw new Error('REDIS_URL environment variable is missing.');
        }

        if (!redis) {
            redis = new Redis(redisUrl);
        }

        const logEntry = req.body;
        if (!logEntry) {
            return res.status(400).json({ error: 'Request body is empty' });
        }

        // Push log to a list named 'order_logs'
        await redis.lpush('order_logs', JSON.stringify(logEntry));

        // Keep only the latest 100 logs
        await redis.ltrim('order_logs', 0, 99);

        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).json({ status: 'success' });
    } catch (error) {
        console.error('Redis Cloud Error:', error);
        return res.status(500).json({
            error: 'Failed to save log',
            message: error.message
        });
    }
}
