const Redis = require('ioredis');

let redis;

module.exports = async function handler(req, res) {
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

        await redis.del('order_logs');

        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).json({ status: 'success' });
    } catch (error) {
        console.error('Redis Clear Error:', error);
        return res.status(500).json({ error: 'Failed to clear logs', message: error.message });
    }
}
