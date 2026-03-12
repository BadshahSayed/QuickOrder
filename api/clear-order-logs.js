const { Redis } = require('@upstash/redis');

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
        if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
            throw new Error('Redis environment variables are missing.');
        }

        const redis = Redis.fromEnv();
        await redis.del('order_logs');

        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).json({ status: 'success' });
    } catch (error) {
        console.error('Redis Clear Error:', error);
        return res.status(500).json({ error: 'Failed to clear logs', message: error.message });
    }
}
