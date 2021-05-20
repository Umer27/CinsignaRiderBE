let Queue = require('bull');
const REDIS_URL = "redis://127.0.0.1:6379";

console.log(REDIS_URL)

/**
 * createJobQueue
 * @description: creates a new job queue
 * @param {String} name - queue name
 * @returns {Object} the queue object
 */
exports.createJobQueue = name => new Queue(name, REDIS_URL);