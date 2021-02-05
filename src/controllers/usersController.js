const { USER_PUBLIC_FIELDS } = require('../../config');

const _ = require('lodash');
const bcrypt = require('bcrypt');

const { USER_INPUT_FIELDS, UPDATE_USER_INPUT_FIELDS, USER_PRIVATE_FIELDS, ENV_VARS} = require('../../config');
const { User, Attendance, Record } = require('../models/');

const {
    cloudinaryClient,
    multerClient,
    errorHandler,
    assertExistence,
    getInstance,
    getInstances,
    deleteInstance,
    deleteInstances,
} = require('../utils');
const { ENV_NAME } = ENV_VARS;
const exclude = USER_PRIVATE_FIELDS;


exports.getUser = async(req, res) => getInstance(req, res, User, undefined, exclude);
exports.getUsers = async(req, res) => getInstances(req, res, User, undefined, exclude);

exports.postUser = async(req, res) => {
    const body = _.pick(req.body, USER_INPUT_FIELDS);
    if('password' in body)
        body.password = bcrypt.hashSync(body.password, 10);
    try {
        const instance = await User.create(body);
        let user = instance.toJSON()
        delete user.password
        res.send(user);
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

        // Apply the updates
        await user.update(body);
        user = user.toJSON();

        delete user.password
        delete user.ccv
        delete user.creditCard
        delete user.creditCardExpiredAt

        res.json(user);
    } catch(error) {
        errorHandler(res, error);
    }
}

/* Custom Image Upload */

exports.getUserStats = async(req, res) => {
    const id = req.params.id
    try {
        const user = await User.findOne({
            where: { id: id}
        })
        assertExistence(user)

        const stats = await Attendance.findAll({
            where: {
                riderId: id
            },
            include: [ {
                model: Record,
                as: 'record'
            } ]
        })
        res.send(stats)
    } catch(e) {
        console.log(e)
    }
}

exports.deleteUser = async(req, res) => deleteInstance(req, res, User);
exports.deleteUsers = async(req, res) => deleteInstances(req, res, User);


