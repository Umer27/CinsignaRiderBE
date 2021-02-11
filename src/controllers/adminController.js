const _ = require('lodash');
const { RECORD_STATUS } = require('../../config');
const { Record, User, sequelize,Attendance,Shift } = require('../models/');
const {
    errorHandler,
} = require('../utils');
const { Op } = require("sequelize");


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
        res.send(todayRecords)
    } catch(e) {
        console.log(e)
    }
}

