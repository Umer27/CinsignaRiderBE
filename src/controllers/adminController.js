const _ = require('lodash');
const { RECORD_STATUS, USER_ROLES } = require('../../config');
const { Record, User, sequelize, Attendance, Shift } = require('../models/');
const {
    errorHandler,
} = require('../utils');
const { Op, QueryTypes } = require("sequelize");
const moment = require('moment')

/* Custom POST */
exports.liveRiders = async(req, res) => {
    try {
        const record = await Record.findAll({
            where: {
                [Op.and]: [ {
                    status: RECORD_STATUS.ACTIVE,
                }, sequelize.where(
                    sequelize.fn('DATE', sequelize.col('record.createdAt')),
                    sequelize.literal('CURRENT_DATE')
                ) ]
            },
            include: [
                {
                    model: User,
                    as: "rider"
                }
            ],
        })
        res.json(record);
    } catch(error) {
        errorHandler(res, error);
    }
}

exports.adminTodayRecords = async(req, res) => {
    try {
        const timeZone = 5

        const currentHour = moment().utc().get('h')
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
    } catch(e) {
        console.log(e)
    }
}

exports.history = async(req, res) => {
    try {

        const todayRecords = await Attendance.findAll({
            where: {
                createdAt: {
                    [Op.gte]: moment().subtract('2', 'day').toDate().setHours(0, 0, 0, 0)
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

