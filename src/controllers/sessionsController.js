const _ = require('lodash');
const { SESSION_INPUT_FIELDS, SESSION_PRIVATE_FIELDS, USER_STATUS, USER_ROLES } = require('../../config');
const { User, Session } = require('../models/');
const {
    jwtClient,
    getInstance,
    errorHandler,
    assertExistence
} = require('../utils');

const exclude = SESSION_PRIVATE_FIELDS;

exports.getSession = async(req, res) => getInstance(req, res, Session, undefined, exclude);

/* Custom POST */
exports.postSession = async(req, res) => {
    const body = _.pick(req.body, SESSION_INPUT_FIELDS);
    const { currentLocation, phoneNumber, mac } = body
    try {
        let user = await User.findOne({ phoneNumber, mac });
        assertExistence(user)
        let session = await Session.create(body);
        assertExistence(session);
        await user.update({ currentLocation })
        await session.setUser(user);
        session = session.toJSON();
        const authToken = jwtClient.sign({
            payload: session.id,
            expiresIn: '1d' // 1 day expiration
        });
        res.set({ 'Auth': authToken });
        res.json(session);
    } catch(error) {
        errorHandler(res, error);
    }
}

exports.deleteSession = async(req, res) => {
    const id = req.params.id;
    try {
        let session = await Session.findByPk(id);
        assertExistence(session);

        await User.findByPk(session.userId);
        assertExistence(session);

        // Session Invalidate
        await session.update({ isActive: false })

        res.send();
    } catch(error) {
        errorHandler(res, error);
    }
}
