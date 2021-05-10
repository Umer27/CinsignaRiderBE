const Queue = require('bull');
const _ = require('lodash');
const bullClient = require('./utils/bull')
const { User, Record } = require('./models');
// Connect to a local redis intance locally, and the Heroku-provided URL in production
const REDIS_URL = "redis://127.0.0.1:6379";
console.log(REDIS_URL)

try {
    // Each job queue used in the application
    const dayEndJobQueue = new Queue(`day-end`, REDIS_URL);

    // Handler for day end
    dayEndJobQueue.process(async(job, done) => {
        const record = await Record.findAll({
            where: {
                status: 'Active'
            }
        });
        console.log({ job: 'day End Job' });
        try {
            done()
        } catch(error) {
            console.log({ error });
        }
    });

    dayEndJobQueue.add({ repeat: { cron: '44 21 * * *' } }, { repeat: { cron: '*/1 * * * *' } })
} catch(e) {
    console.log(e)
}

