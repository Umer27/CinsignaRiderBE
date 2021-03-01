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
    const timeZone = body.zone
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

        const completedAttendance = await Attendance.findOne({
            where: {
                riderId: req.userId,
                createdAt: {
                    [Op.gt]: DAY_START,
                    [Op.lt]: DAY_END
                },
                status: ATTENDANCE_STATUS.COMPLETED
            }
        })
        if(!_.isEmpty(completedAttendance)){
            throw {
                error: new Error(),
                status: 403,
                name: 'Unprocessable Entity',
                msg: 'Your day has been ended Go Home',
            }
        }

        const activeRecord = await Record.findOne({
            where: {
                riderId: req.userId,
                createdAt: {
                    [Op.gt]: DAY_START,
                    [Op.lt]: DAY_END
                },
                status: ATTENDANCE_STATUS.ACTIVE
            },
        })

        if(!_.isEmpty(activeRecord)){
            throw {
                error: new Error(),
                status: 403,
                name: 'Unprocessable Entity',
                msg: 'Already online record exist',
            }
        }
        const now = new moment().format("HH:mm:ss")
        const expected = user.shift.start
        const ms = moment(now, "HH:mm").diff(moment(expected, "HH:mm"));
        const isLate = ms >= 0

        // check for any record in that day

        const checkRecord = await Record.findOne({
            where: {
                riderId: req.userId,
                createdAt: {
                    [Op.gt]: DAY_START,
                    [Op.lt]: DAY_END
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
        const attendanceId = attendance ? attendance.dataValues.id : checkRecord.attendanceId

        const record = await Record.create({
            startLocation,
            startLocationAddress: coder[0].formattedAddress,
            riderId: req.userId,
            attendanceId
        })
        const activeAttendance = await Attendance.findByPk(attendanceId)
        await activeAttendance.update({ status: ATTENDANCE_STATUS.ACTIVE })
        res.send({ attendance: activeAttendance, record });
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
        if(record.status === RECORD_STATUS.COMPLETED){
            throw {
                error: new Error(),
                status: 403,
                name: 'Unprocessable Entity',
                msg: 'Record Already Completed',
            }
        }
        const endLocation = body.currentLocation
        const coder = await geocoder.reverse({
            lat: endLocation.split(',')[0],
            lon: endLocation.split(',')[1]
        })
        const recordEnd = new moment().format("HH:mm:ss")
        const recordStart = moment(record.createdAt).format("HH:mm:ss")
        let recordedTime = moment(recordEnd, "HH:mm:ss").subtract(moment(recordStart, "HH:mm:ss")).utc().format("HH:mm:ss");
        const hours = parseInt(recordedTime.split(':')[0])
        const minutes = parseInt(recordedTime.split(':')[1])
        const seconds = parseInt(recordedTime.split(':')[2])
        const attendance = await Attendance.findByPk(record.attendanceId)
        const dayTotalTime = moment(attendance.dayTotalTime, "HH:mm:ss").add(hours, 'h').add(minutes, 'm').add(seconds, "s").format("HH:mm:ss");
        await attendance.update({ dayTotalTime, status: ATTENDANCE_STATUS.INACTIVE })
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
        const timeZone = req.query.zone
        const user = await User.findOne({
            where: { id: req.userId },
            include: [ {
                model: Shift,
                as: 'shift'
            } ]
        })
        assertExistence(user)
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

        const todayRecords = await Attendance.findOne({
            where: {
                riderId: req.userId,
                createdAt: {
                    [Op.gt]: DAY_START,
                    [Op.lt]: DAY_END
                }
            },
            include: [ {
                model: Record,
                as: 'record',
                order: [['createdAt', 'ASC']]

            }, {
                model: Shift,
                as: 'shift'
            } ],
        })
        res.send(todayRecords)
    } catch(e) {
        console.log(e)
    }
}

exports.monthReport = async(req, res) => {
    try {
        const user = await User.findOne({
            where: { id: req.userId }
        })
        assertExistence(user)

        let startDate = moment().startOf('month').add('1', 'd');
        let endDate = moment().subtract('1', 'day').toDate().setHours(23, 59, 59, 59)

        const monthRecord = await Attendance.findAll({
            where: {
                riderId: user.id,
                createdAt: {
                    [Op.gte]: startDate,
                    [Op.lte]: endDate
                }
            },
            include: [ {
                model: Record,
                as: 'record'
            } ]
        })

        let daysInMonth = [];

        let monthDate = moment(startDate).startOf('month') // change to a date in the month of interest

        _.times(moment().get('date') - 1, function(n) {
            daysInMonth.push(monthDate.format('YYYY-MM-DD').toLocaleString());  // your format
            monthDate.add(1, 'day');
        });
        let report = []
        for(const day of daysInMonth) {
            const prevLength = report.length
            for(const record of monthRecord) {
                if(moment(record.createdAt.toString()).format('YYYY-MM-DD') === day){
                    report.push(record)
                }
            }
            if(prevLength === report.length){
                report.push({
                    createdAt: moment(day).format('YYYY-MM-DDThh:mm:ss.msZ'),
                    status: "Absent",
                })
            }
        }

        res.send({ report })
    } catch(error) {
        errorHandler(res, error);
    }
}

exports.filterDate = async(req, res) => {
    const userId = req.params.aliasId
    const date = req.query.date // give month and year
    try {
        const user = await User.findOne({
            where: { alias: userId }
        })
        assertExistence(user)

        const givenDate = moment(date)
        if(givenDate.diff(moment()) >= 0){
            throw {
                error: new Error(),
                status: 403,
                name: 'UnprocessableEntity',
                msg: 'choose any past date'
            }
        }

        let startDate
        let endDate;
        let totalDays;
        let currentMonth = moment().get('month')
        if(givenDate.get('month') === currentMonth){
            startDate = moment().startOf('month');
            endDate = moment().subtract('1', 'day').toDate().setHours(23, 59, 59, 59)
            totalDays = moment().get('date') - 1
        } else {
            startDate = givenDate.startOf('month').toString()
            endDate = givenDate.endOf('month').toString()
            totalDays = moment(startDate).daysInMonth()
        }

        const monthRecord = await Attendance.findAll({
            where: {
                riderId: user.id,
                createdAt: {
                    [Op.gte]: startDate,
                    [Op.lte]: endDate
                }
            },
            include: [ {
                model: Record,
                as: 'record'
            } ]
        })

        let daysInMonth = [];

        let monthDate = moment(startDate).startOf('month'); // change to a date in the month of interest

        _.times(totalDays, function(n) {
            daysInMonth.push(monthDate.format('YYYY-MM-DD'));  // your format
            monthDate.add(1, 'day');
        });
        let records = []
        for(const day of daysInMonth) {
            const prevLength = records.length
            for(const record of monthRecord) {
                if(moment(record.createdAt.toString()).format('YYYY-MM-DD') === day){
                    records.push(record)
                }
            }
            if(prevLength === records.length){
                records.push({
                    createdAt: moment(day).format('YYYY-MM-DDThh:mm:ss.msZ'),
                    status: "Absent",
                })
            }
        }

        res.send({ records, rider: user })
    } catch(error) {
        errorHandler(res, error);
    }
}

exports.dayEnd = async(req, res) => {
    const attendanceId = req.params.attendanceId
    try {
        const user = await User.findOne({
            where: { id: req.userId },
        })
        assertExistence(user)
        const attendance = await Attendance.findByPk(attendanceId)
        if(attendance.status === ATTENDANCE_STATUS.ACTIVE){
            throw {
                error: new Error(),
                status: 403,
                name: 'Unprocessable Entity',
                msg: 'First Complete Your Active Record',
            }
        }
        const updatedAttendance = await attendance.update({ status: ATTENDANCE_STATUS.COMPLETED })
        res.send({ updatedAttendance });
    } catch(error) {
        errorHandler(res, error);
    }
}




