// worker.js
const Bull = require('bull');
const fs = require('fs');
const path = require('path');

const taskQueue = new Bull('taskQueue', {
    redis: { port: 6379, host: '127.0.0.1' }
});

const logFilePath = path.join(__dirname, 'task.log');

taskQueue.process(async (job) => {
    const { user_id } = job.data;
    const timestamp = new Date().toISOString();

    console.log(`Processing task for user_id: ${user_id} at ${timestamp}`);

    const logMessage = `${user_id} - task completed at ${timestamp}\n`;

    try {
        fs.appendFileSync(logFilePath, logMessage, 'utf8');
        console.log(`Successfully logged task for user_id: ${user_id}`);
    } catch (error) {
        console.error(`Error writing to log file for user_id: ${user_id}:`, error);
    }
});

// Handle unexpected errors
process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection in worker:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception in worker:', error);
});

console.log('Worker is running and waiting for tasks...');
