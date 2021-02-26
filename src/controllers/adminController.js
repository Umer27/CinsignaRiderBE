const _ = require('lodash');
const { RECORD_STATUS, USER_ROLES, ATTENDANCE_STATUS } = require('../../config');
const { Record, User, sequelize, Attendance, Shift } = require('../models/');
const {
    errorHandler,
} = require('../utils');
const { Op, QueryTypes } = require("sequelize");
const moment = require('moment')

/* Custom POST */
exports.liveRiders = async(req, res) => {
    try {
        const timeZone = parseInt(req.query.zone)

        const currentHour = moment().get('h')
        let DAY_START
        let DAY_END
        if(currentHour < 6){
            DAY_START = moment(moment().subtract(1, 'd').toDate().setHours(6 - timeZone, 0, 0, 0)).utc(true).toDate()
            DAY_END = moment(moment().toDate().setHours(5 - timeZone, 59, 59, 0)).utc(true).toDate()
        } else {
            DAY_START = moment(moment().toDate().setHours(6 - timeZone, 0, 0, 0)).utc(true).toDate()
            DAY_END = moment(moment().add(1, 'd').toDate().setHours(6 - timeZone, 0, 0, 0)).utc(true).toDate()
        }

        const attendances = await Attendance.findAll({
            where: {
                status: {
                    [Op.in]: [ ATTENDANCE_STATUS.ACTIVE, ATTENDANCE_STATUS.INACTIVE ]
                },
                createdAt: {
                    [Op.gt]: DAY_START,
                    [Op.lt]: DAY_END
                }
            },
            include: [
                {
                    model: User,
                    as: "rider"
                }
            ],
        })

        res.json(attendances);
    } catch(error) {
        errorHandler(res, error);
    }
}

exports.adminTodayRecords = async(req, res) => {
    try {
        const timeZone = parseInt(req.query.zone)

        const currentHour = moment().get('h')
        let DAY_START
        let DAY_END
        if(currentHour < 6){
            DAY_START = moment(moment().subtract(1, 'd').toDate().setHours(6 - timeZone, 0, 0, 0)).utc(true).toDate()
            DAY_END = moment(moment().toDate().setHours(5 - timeZone, 59, 59, 0)).utc(true).toDate()
        } else {
            DAY_START = moment(moment().toDate().setHours(6 - timeZone, 0, 0, 0)).utc(true).toDate()
            DAY_END = moment(moment().add(1, 'd').toDate().setHours(6 - timeZone, 0, 0, 0)).utc(true).toDate()
        }

        const todayRecords = await Attendance.findAll({
            where: {
                createdAt: {
                    [Op.gt]: DAY_START,
                    [Op.lt]: DAY_END
                }
            },
            include: [ {
                model: Record,
                as: 'record'
            }, {
                model: User,
                as: 'rider'
            } ]
        })

        const riders = await User.count({
            where: {
                role: USER_ROLES.RIDER
            },
            raw: true
        })

        res.send({
            todayRecords,
            presentRider: todayRecords.length,
            absenteesCount: riders - todayRecords.length,
            totalRiders: riders
        })
    } catch(error) {
        errorHandler(res, error);
    }
}

exports.history = async(req, res) => {
    try {
        const timeZone = parseInt(req.query.zone)
        const currentHour = moment().get('h')
        let DAY_START
        let DAY_END
        if(currentHour < 6){
            DAY_START = moment(moment().subtract(2, 'd').toDate().setHours(6 - timeZone, 0, 0, 0)).utc(true).toDate()
            DAY_END = moment(moment().subtract(1, 'd').toDate().setHours(5 - timeZone, 59, 59, 0)).utc(true).toDate()
        } else {
            DAY_START = moment(moment().subtract(1, 'd').toDate().setHours(6 - timeZone, 0, 0, 0)).utc(true).toDate()
            DAY_END = moment(moment().toDate().setHours(5 - timeZone, 59, 59, 59)).utc(true).toDate()
        }
        const todayRecords = await Attendance.findAll({
            where: {
                createdAt: {
                    [Op.gt]: DAY_START,
                    [Op.lt]: DAY_END
                }
            },
            include: [ {
                model: Record,
                as: 'record'
            },
                {
                    model: User,
                    as: 'rider'
                }
            ]
        })
        res.send(todayRecords)
    } catch(e) {
        console.log(e)
    }
}

exports.historyAttendanceFilter = async(req, res) => {
    try {
        const date = req.query.date
        const timeZone = req.query.zone
        const givenDate = moment(date)
        if(givenDate.diff(moment()) >= 0){
            throw {
                error: new Error(),
                status: 403,
                name: 'UnprocessableEntity',
                msg: 'choose any past date'
            }
        }

        let DAY_START = moment(givenDate.toDate().setHours(6 - timeZone, 0, 0, 0)).utc(true).toDate()
        let DAY_END = moment(givenDate.add(1,'d').toDate().setHours(5 - timeZone, 59, 59, 59)).utc(true).toDate()

        const givenDayAttendances = await Attendance.findAll({
            where: {
                createdAt: {
                    [Op.gt]: DAY_START,
                    [Op.lt]: DAY_END
                }
            },
            include: [ {
                model: Record,
                as: 'record'
            },
                {
                    model: User,
                    as: 'rider'
                }
            ]
        })
        res.send(givenDayAttendances)

    } catch(error) {
        errorHandler(res, error);
    }
}

