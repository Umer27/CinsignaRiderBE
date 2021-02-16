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
        const TODAY_START = new Date().setHours(0, 0, 0, 0);
        const NOW = new Date();
        const todayRecords = await Attendance.findAll({
            where: {
                createdAt: {
                    [Op.gt]: TODAY_START,
                    [Op.lt]: NOW
                }
            },
            include: [ {
                model: Record,
                as: 'record'
            }, {
                model: Shift,
                as: 'shift'
            } ]
        })

        const riders = await User.findAll({
            where: {
                role: USER_ROLES.RIDER
            },
            attributes: [ 'id' ],
            raw: true
        })

        const riderIdList = riders.map(rider => rider.id)


        const absenteesCount = await Attendance.count({
            where: {
                [Op.and]: {
                    riderId: {
                        [Op.in]: riderIdList
                    },
                    createdAt: {
                        [Op.gt]: TODAY_START,
                        [Op.lt]: NOW
                    }
                }
            },
        })
        res.send({ todayRecords, presentRider: todayRecords.length, absenteesCount, totalRiders: riders.length })
    } catch(e) {
        console.log(e)
    }
}

exports.history = async(req, res) => {
    try {
        const todayRecords = await Attendance.findAll({
            where: {
                createdAt: {
                    [Op.gte]: moment().subtract('1', 'day').toDate().setHours(0, 0, 0, 0)
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

