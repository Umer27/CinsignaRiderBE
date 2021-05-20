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
        const DAY_START = moment().startOf('day').utc(true).toDate()
        const DAY_END = moment().endOf('day').utc(true).toDate()
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
        const DAY_START = moment().startOf('day').utc(true).toDate()
        const DAY_END = moment().endOf('day').utc(true).toDate()
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
        const DAY_START = moment().subtract(1, 'd').startOf('day').utc(true).toDate()
        const DAY_END = moment().subtract(1, 'd').endOf('day').utc(true).toDate()
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
        const givenDate = moment(date)
        if(givenDate.diff(moment()) >= 0){
            throw {
                error: new Error(),
                status: 403,
                name: 'UnprocessableEntity',
                msg: 'choose any past date'
            }
        }
        const DAY_START = moment(givenDate).startOf('d').toDate()
        const DAY_END = moment(givenDate).endOf('d').toDate()
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

