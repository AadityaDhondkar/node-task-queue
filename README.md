# Node.js Task Queue with Rate Limiting

## Project Overview
This project implements a task queue with rate limiting using Node.js, Redis, and Bull. The server allows clients to submit tasks, which are then queued and processed by a worker. Rate limiting is enforced to ensure that no user exceeds one task per second and 20 tasks per minute.

## Rate Limiting
Rate limiting is implemented using Redis. Each user has a key in Redis that tracks the timestamps of their recent requests. If a user exceeds the allowed rate, further requests are denied until they fall within the acceptable limit.

## Task Queueing
Tasks are added to a Bull queue and processed asynchronously by a worker. The worker logs the completion of each task to a file named `task.log`.

## Assumptions
- The rate limit is strictly enforced per user, identified by their `user_id`.
- Redis is running locally on the default port `6379`.

## Instructions

### Prerequisites
- Node.js and npm installed
- Redis installed and running locally

### Setup
1. Install dependencies:
   ```bash
   npm install
2. Start the server:
   ```bash
   node server.js
3. Start the worker:
   ```bash
   node worker.js
4. Test the rate limiting and task queueing by sending POST requests to the API endpoint /api/v1/task.


