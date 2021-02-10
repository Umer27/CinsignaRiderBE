const _ = require('lodash');
const { RECORD_STATUS } = require('../../config');
const { Record, User } = require('../models/');
const {
    errorHandler,
} = require('../utils');


/* Custom POST */
exports.liveRiders = async(req, res) => {
    try {
        const record = await Record.findAll({
            where: {
                status: RECORD_STATUS.ACTIVE,
                createdAt: new Date()
            },
            include: [
                {
                    model: User,
                    as: "rider"
                }
            ]
        })
        res.json(record);
    } catch(error) {
        errorHandler(res, error);
    }
}

