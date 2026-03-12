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
        await redis.del('order_logs');

        return res.status(200).json({ status: 'success' });
    } catch (error) {
        console.error('Redis Error:', error);
        return res.status(500).json({ error: 'Failed to clear logs' });
    }
}
