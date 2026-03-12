const { Redis } = require('@upstash/redis');

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
        // Ensure environment variables are loaded
        if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
            throw new Error('Redis environment variables are missing. Please check your Vercel project settings.');
        }

        const redis = Redis.fromEnv();
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
        console.error('Detailed Redis Error:', error);
        return res.status(500).json({
            error: 'Failed to save log',
            message: error.message,
            stack: error.stack
        });
    }
}
