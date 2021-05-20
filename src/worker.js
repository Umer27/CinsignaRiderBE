const Queue = require('bull');
const _ = require('lodash');
const moment = require('moment')
const { RECORD_STATUS, ATTENDANCE_STATUS } = require('../config');
const bullClient = require('./utils/bull')
const { Attendance, Record, User } = require('./models');
const { Op } = require("sequelize");
const {
    assertExistence,
} = require('./utils');
// Connect to a local redis instance locally, and the Heroku-provided URL in production
const REDIS_URL = "redis://127.0.0.1:6379";

try {
    // Each job queue used in the application
    const dayEndJobQueue = new Queue(`day-end`, REDIS_URL);

    // Handler for day end
    dayEndJobQueue.process(async(job, done) => {
        try {
            // check any current day 'Active' status in record table.
            const DAY_START = moment().startOf('day').utc(true).toDate()
            const DAY_END = moment().endOf('day').utc(true).toDate()
            const records = await Record.findAll({
                where: {
                    status: RECORD_STATUS.ACTIVE,
                    createdAt: {
                        [Op.gt]: DAY_START,
                        [Op.lt]: DAY_END
                    }
                }
            })
            if(!_.isEmpty(records)){
                records.map(async record => {
                    const user = await User.findOne({
                        where: { id: record.riderId }
                    })
                    assertExistence(user)
                    const recordEnd = new moment().format("HH:mm:ss")
                    const recordStart = moment(record.createdAt).format("HH:mm:ss")
                    let recordedTime = moment(recordEnd, "HH:mm:ss").subtract(moment(recordStart, "HH:mm:ss")).utc().format("HH:mm:ss");
                    const hours = parseInt(recordedTime.split(':')[0])
                    const minutes = parseInt(recordedTime.split(':')[1])
                    const seconds = parseInt(recordedTime.split(':')[2])
                    const attendance = await Attendance.findByPk(record.attendanceId)
                    const dayTotalTime = moment(attendance.dayTotalTime, "HH:mm:ss").add(hours, 'h').add(minutes, 'm').add(seconds, "s").format("HH:mm:ss");
                    await attendance.update({ dayTotalTime, status: ATTENDANCE_STATUS.COMPLETED })
                    await record.update({
                        endLocation: user.currentLocation,
                        endLocationAddress: '',
                        recordEnd: new moment().format("HH:mm:ss"),
                        recordedTime,
                        status: RECORD_STATUS.COMPLETED,
                        job: true
                    })
                })
            }
            done()
        } catch(error) {
            console.log({ error });
        }
    });
    dayEndJobQueue.add({ repeat: { cron: '59 23 * * *' } }, { repeat: { cron: '59 23 * * *' } })
} catch(e) {
    console.log(e)
}

