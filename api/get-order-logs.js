const Redis = require('ioredis');

let redis;

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
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

        const logs = await redis.lrange('order_logs', 0, -1);

        const parsedLogs = logs.map(log => {
            try {
                return typeof log === 'string' ? JSON.parse(log) : log;
            } catch (e) {
                return log;
            }
        });

        return res.status(200).json(parsedLogs);
    } catch (error) {
        console.error('Redis Fetch Error:', error);
        return res.status(500).json({ error: 'Failed to fetch logs', message: error.message });
    }
}
