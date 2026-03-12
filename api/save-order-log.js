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
        if (!redisUrl) throw new Error('REDIS_URL is missing.');

        if (!redis) redis = new Redis(redisUrl);

        const logEntry = req.body;
        if (!logEntry || !logEntry.id) {
            return res.status(400).json({ error: 'Invalid log entry' });
        }

        // DEDUPLICATION: Check if this order ID has been logged recently
        const lockKey = `lock:logged_order:${logEntry.id}`;

        // SET with NX (Only if not exists) and EX (Expiry in seconds)
        // 300 seconds (5 mins) is enough to prevent accidental double-posts
        const isNew = await redis.set(lockKey, 'true', 'EX', 300, 'NX');

        if (!isNew) {
            console.log(`⚠️ Duplicate log attempt ignored for order: ${logEntry.id}`);
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.status(200).json({ status: 'skipped', message: 'Duplicate log' });
        }

        // Push log to the list
        await redis.lpush('order_logs', JSON.stringify(logEntry));

        // Keep only the latest 100 logs
        await redis.ltrim('order_logs', 0, 99);

        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).json({ status: 'success' });
    } catch (error) {
        console.error('Redis Error:', error);
        return res.status(500).json({ error: 'Failed to save log', message: error.message });
    }
}
