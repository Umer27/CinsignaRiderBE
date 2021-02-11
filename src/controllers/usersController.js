const uuid = require('uuid/v4');
const _ = require('lodash');
const { USER_INPUT_FIELDS, UPDATE_USER_INPUT_FIELDS, USER_PRIVATE_FIELDS, BULK_USERS } = require('../../config');
const { User, Attendance, Shift } = require('../models/');
const {
    errorHandler,
    assertExistence,
    getInstance,
    getInstances,
    deleteInstance,
    deleteInstances,
    geocoder
} = require('../utils');
const exclude = USER_PRIVATE_FIELDS;
const {
    getRequestQueryInfo,
    getResponseQueryInfo
} = require('../utils/helpers')


exports.getUser = async(req, res) => getInstance(req, res, User, [ { model: Shift, as: 'shift' } ], exclude);

exports.getUsers = async(req, res) => getInstances(req, res, User, undefined, exclude);

exports.postUser = async(req, res) => {
    const body = _.pick(req.body, USER_INPUT_FIELDS);
    try {
        const instance = await User.create(body);
        let user = instance.toJSON()
        delete user.password
        res.send(user);
    } catch(error) {
        errorHandler(res, error);
    }

}

exports.postBulkUser = async(req, res) => {
    const body = _.pick(req.body, BULK_USERS);
    const { bulk } = body
    try {
        for(const user of bulk) {
            user.id = uuid()
        }
        const instance = await User.bulkCreate(bulk);
        res.send(instance);
    } catch(error) {
        errorHandler(res, error);
    }

}

/* Custom PATCH */
exports.patchUser = async(req, res) => {
    const id = req.params.id;
    const body = _.pick(req.body, UPDATE_USER_INPUT_FIELDS);
    try {
        let user = await User.findByPk(id);
        assertExistence(user);
        // If changing the `email` field
        if(body.email && body.email !== user.email){
            const anotherUserWithGivenEmail = await User.findOne({ where: { email: body.email } });
            if(anotherUserWithGivenEmail){
                throw {
                    error: new Error(),
                    status: 400,
                    name: 'SequelizeUniqueConstraintError',
                    msg: 'A user with this email already exists',
                    field: 'email'
                }
            }
        }

        if(body.currentLocation){
            const startLocation = body.currentLocation
            const coder = await geocoder.reverse({
                lat: startLocation.split(',')[0],
                lon: startLocation.split(',')[1]
            })
            body.currentLocationAddress = coder[0].formattedAddress
        }

        // Apply the updates
        await user.update(body);
        user = user.toJSON();

        delete user.password

        res.json(user);
    } catch(error) {
        errorHandler(res, error);
    }
}

exports.getUserStats = async(req, res) => {
    const id = req.params.id
    let { where, limit, offset, order, attributes = undefined } = getRequestQueryInfo(req);
    try {
        const user = await User.findOne({
            where: { id: id }
        })
        assertExistence(user)

        const count = await Attendance.count({
            where: {
                riderId: id,
            }
        });
        const { pages, page, newOffset } = getResponseQueryInfo(count, limit, offset);

        const stats = await Attendance.findAll({
            where: {
                riderId: id,
            },
            include: [ {
                model: Shift,
                as: 'shift'
            } ],
            offset: newOffset,
            limit
        })
        res.send({
            stats,
            count,
            page,
            pages
        })
    } catch(e) {
        console.log(e)
    }
}

exports.searchUser = async(req, res) => {
    const alias = req.query.alias
    try {
        const user = await User.findOne({ where: { alias } })
        assertExistence(user)
        res.send(user)
    } catch(e) {
        console.log(e)
    }
}

exports.deleteUser = async(req, res) => deleteInstance(req, res, User);
exports.deleteUsers = async(req, res) => deleteInstances(req, res, User);


