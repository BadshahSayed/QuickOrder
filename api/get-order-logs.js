import { Redis } from '@upstash/redis'

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const redis = Redis.fromEnv();
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
        console.error('Redis Error:', error);
        return res.status(500).json({ error: 'Failed to fetch logs' });
    }
}
