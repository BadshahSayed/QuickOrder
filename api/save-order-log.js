import { Redis } from '@upstash/redis'

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const redis = Redis.fromEnv();
        const logEntry = req.body;

        // Push log to a list named 'order_logs'
        await redis.lpush('order_logs', JSON.stringify(logEntry));

        // Keep only the latest 100 logs
        await redis.ltrim('order_logs', 0, 99);

        return res.status(200).json({ status: 'success' });
    } catch (error) {
        console.error('Redis Error:', error);
        return res.status(500).json({ error: 'Failed to save log', details: error.message });
    }
}
