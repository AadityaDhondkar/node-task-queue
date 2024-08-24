// server.js
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

    const currentWindow = Math.floor(Date.now() / 60000); // Current minute
    const userKey = `rate_limit:${user_id}:${currentWindow}`;

    const requests = await redisClient.incr(userKey);

    if (requests === 1) {
        await redisClient.expire(userKey, 60); // Set expiry to 60 seconds
    }

    if (requests > 20) {
        return res.status(429).send('Rate limit exceeded. Please try again later.');
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
    console.log(`API Server is running on port ${PORT}`);
});
