const _ = require('lodash');
const { SHIFT_INPUT_FIELDS } = require('../../config');
const { Shift } = require('../models/');
const {
    getInstance,
    errorHandler,
    assertExistence,
    geocoder
} = require('../utils');


exports.getShift = async(req, res) => getInstance(req, res, Shift, undefined, []);
exports.getShifts = async(req, res) => {
    try {
        const shifts = await Shift.findAll()
        res.json(shifts)
    } catch(e) {
        console.log(e)
    }

}

/* Custom POST */
exports.postShift = async(req, res) => {
    const body = _.pick(req.body, SHIFT_INPUT_FIELDS);
    const { category } = body
    try {
        let shift = await Shift.findOne({ where: { category } });
        if(!_.isEmpty(shift)){
            throw {
                error: new Error(),
                status: 403,
                name: 'Already Exist',
                msg: `Change the category name`,
            }
        }
        const newShift = await Shift.create(body)
        res.json(newShift);
    } catch(error) {
        errorHandler(res, error);
    }
}

exports.deleteShift = async(req, res) => {
    const id = req.params.id;
    try {
        let shift = await Shift.findByPk(id);
        assertExistence(shift);
        await shift.destroy()
        res.send();
    } catch(error) {
        errorHandler(res, error);
    }
}

exports.currentLocationName = async(req, res) => {
    try {
        const coder = await geocoder.reverse({
            lat: "31.4700053",
            lon: "74.2699992"
        })
        res.send(coder[0].formattedAddress);
    } catch(error) {
        errorHandler(res, error);
    }
}
