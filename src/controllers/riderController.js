const _ = require('lodash');
const { ONLINE_INPUT, OFFLINE_INPUT, ATTENDANCE_STATUS, RECORD_STATUS } = require('../../config');
const { Attendance, Record, User, Shift } = require('../models/');
const {
    errorHandler,
    assertExistence,
    geocoder
} = require('../utils');
const moment = require('moment')
const { Op } = require("sequelize");

/* Custom POST */
exports.riderOnline = async(req, res) => {
    const body = _.pick(req.body, ONLINE_INPUT);
    try {
        //User Exist
        const user = await User.findOne({
            where: { id: req.userId },
            include: [ {
                model: Shift,
                as: 'shift'
            } ]
        })
        assertExistence(user)

        const now = new moment().format("HH:mm:ss")
        const expected = user.shift.start
        const ms = moment(now, "HH:mm").diff(moment(expected, "HH:mm"));
        const isLate = ms <= 0

        // check for any record in that day
        const TODAY_START = new Date().setHours(0, 0, 0, 0);
        const NOW = new Date();
        const checkRecord = await Record.findOne({
            where: {
                riderId: req.userId,
                createdAt: {
                    [Op.gt]: TODAY_START,
                    [Op.lt]: NOW
                }
            },
            include: [ {
                model: Attendance,
                as: 'attendance',
                include: [ {
                    model: Shift,
                    as: "shift"
                } ]
            } ]
        })
        let attendance;
        if(_.isEmpty(checkRecord)){
            attendance = await Attendance.create({
                isLate,
                riderId: req.userId,
                LateValue: ms.toString(),
                shiftId: user.shiftId,
            })
        }
        const startLocation = body.currentLocation
        const coder = await geocoder.reverse({
            lat: startLocation.split(',')[0],
            lon: startLocation.split(',')[1]
        })
        const record = await Record.create({
            startLocation,
            startLocationAddress: coder[0].formattedAddress,
            riderId: req.userId,
            attendanceId: attendance ? attendance.dataValues.id : checkRecord.attendanceId
        })

        res.send({ attendance: attendance ? attendance : checkRecord.attendance, record });
    } catch(error) {
        errorHandler(res, error);
    }
}

exports.riderOffline = async(req, res) => {
    const body = _.pick(req.body, OFFLINE_INPUT);
    const { recordId } = body
    try {
        const user = await User.findOne({
            where: { id: req.userId },
        })
        assertExistence(user)
        const record = await Record.findOne({
            where: { id: recordId }
        })
        assertExistence(record)
        const endLocation = body.currentLocation
        const coder = await geocoder.reverse({
            lat: endLocation.split(',')[0],
            lon: endLocation.split(',')[1]
        })
        const recordEnd = new moment().format("HH:mm:ss")
        const recordStart = moment(record.createdAt).format("HH:mm:ss")
        let recordedTime = moment(recordEnd, "HH:mm:ss").subtract(moment(recordStart, "HH:mm:ss")).subtract(5, 'hours').format("HH:mm:ss");
        const attendance = await Attendance.findByPk(record.attendanceId)
        const dayTotalTime = moment(attendance.dayTotalTime, "HH:mm:ss").add(moment(recordedTime, "HH:mm:ss")).subtract(19, 'hours').format("HH:mm:ss");
        await attendance.update({ dayTotalTime, status: ATTENDANCE_STATUS.COMPLETED })
        const updatedRecord = await record.update({
            endLocation,
            endLocationAddress: coder[0].formattedAddress,
            recordEnd,
            recordedTime,
            status: RECORD_STATUS.COMPLETED
        })
        res.send({ attendance, updatedRecord });
    } catch(error) {
        errorHandler(res, error);
    }
}

exports.todayRecords = async(req, res) => {
    try {
        const user = await User.findOne({
            where: { id: req.userId },
            include: [ {
                model: Shift,
                as: 'shift'
            } ]
        })
        assertExistence(user)
        const TODAY_START = new Date().setHours(0, 0, 0, 0);
        const NOW = new Date();
        const todayRecords = await Attendance.findOne({
            where: {
                riderId: req.userId,
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

exports.filterDate = async(req, res) => {
    const userId = req.params.id
    const date = req.query.date // give month and year
    try {
        const user = await User.findOne({
            where: { id: userId },
            include: [ {
                model: Shift,
                as: 'shift'
            } ]
        })
        assertExistence(user)

        const givenDate = moment(date)
        if(moment().isAfter(momentDate)){
            throw new {
                error: new Error(),
                status: 403,
                name: 'UnprocessableEntity',
                msg: 'choose any past date'
            }
        }

        let startDate = moment().startOf('month');
        let endDate;
        let currentMonth = moment().get('month')
        if(givenDate.get('month').toString() === currentMonth.toString()){
            endDate = moment().subtract('1', 'day')
        }

        endDate = givenDate.endOf('month')

        const monthRecord = await Attendance.findAll({
            where: {
                riderId: userId,
                createdAt: {
                    [Op.gt]: startDate,
                    [Op.lt]: endDate
                }
            },
            include: [ {
                model: Record,
                as: 'record'
            } ]
        })
        res.send(monthRecord)
    } catch(e) {
        console.log(e)
    }
}




