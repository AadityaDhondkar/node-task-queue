// server.js
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
    const numCPUs = 2; // Or you can use os.cpus().length to scale to available CPUs
    console.log(`Master process is running. Forking ${numCPUs} workers...`);

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} exited. Forking a new worker...`);
        cluster.fork();
    });
} else {
    const express = require('express');
    const Bull = require('bull');
    const { createClient } = require('redis');

    const app = express();
    const PORT = 3000;

    // Configure Redis client
    const redisClient = createClient();
    redisClient.connect().catch(console.error);

    // Initialize Bull queue
    const taskQueue = new Bull('taskQueue', {
        redis: { port: 6379, host: '127.0.0.1' }
    });

    app.use(express.json());

    // Rate limiting middleware
    const rateLimit = async (req, res, next) => {
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).send('Bad Request: Missing user_id');
        }

        const currentSecond = Math.floor(Date.now() / 1000); // Current second
        const currentMinute = Math.floor(Date.now() / 60000); // Current minute
        const userSecondKey = `rate_limit:${user_id}:${currentSecond}`;
        const userMinuteKey = `rate_limit:${user_id}:${currentMinute}`;

        // Limit to 1 task per second
        const secondRequests = await redisClient.incr(userSecondKey);
        if (secondRequests === 1) {
            await redisClient.expire(userSecondKey, 1); // Expire after 1 second
        }
        if (secondRequests > 1) {
            return res.status(429).send('Rate limit exceeded (1 per second). Please try again later.');
        }

        // Limit to 20 tasks per minute
        const minuteRequests = await redisClient.incr(userMinuteKey);
        if (minuteRequests === 1) {
            await redisClient.expire(userMinuteKey, 60); // Expire after 60 seconds
        }
        if (minuteRequests > 20) {
            return res.status(429).send('Rate limit exceeded (20 per minute). Please try again later.');
        }

        next();
    };

    app.post('/api/v1/task', rateLimit, async (req, res) => {
        const { user_id } = req.body;

        try {
            await taskQueue.add({ user_id });
            return res.status(200).send('Task queued successfully');
        } catch (error) {
            console.error('Error adding task to queue:', error);
            return res.status(500).send('Internal Server Error');
        }
    });

    app.listen(PORT, () => {
        console.log(`API Server is running on port ${PORT}, worker ${process.pid}`);
    });
}
