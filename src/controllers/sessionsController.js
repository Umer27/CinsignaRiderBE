const _ = require('lodash');
const { SESSION_INPUT_FIELDS, SESSION_PRIVATE_FIELDS } = require('../../config');
const { User, Session } = require('../models/');
const {
    jwtClient,
    getInstance,
    errorHandler,
    assertExistence,
    geocoder
} = require('../utils');
const { ENV_VARS, USER_ROLES } = require('../../config');
const { ADMIN_AUTH } = ENV_VARS
const exclude = SESSION_PRIVATE_FIELDS;

exports.getSession = async(req, res) => getInstance(req, res, Session, undefined, exclude);

/* Custom POST */
exports.postSession = async(req, res) => {
    const body = _.pick(req.body, SESSION_INPUT_FIELDS);
    const { currentLocation, phoneNumber, mac } = body
    try {
        let user = await User.findOne({ where: { phoneNumber, mac } });
        assertExistence(user)
        let session = await Session.create(body);
        assertExistence(session);
        let coder
        if(body.currentLocation){
            coder = await geocoder.reverse({
                lat: currentLocation.split(',')[0],
                lon: currentLocation.split(',')[1]
            })
        }
        await user.update({ currentLocation, currentLocationAddress: coder[0].formattedAddress })
        await session.setUser(user);
        session = session.toJSON();
        let authToken
        if(user.role !== USER_ROLES.ADMIN)
            authToken = jwtClient.sign({
                payload: session.id,
                expiresIn: '1d' // 1 day expiration
            });
        if(user.role === USER_ROLES.ADMIN)
            authToken = ADMIN_AUTH
        res.set({ 'Auth': authToken });
        session.role = user.role
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
        await session.destroy();
        res.send();
    } catch(error) {
        errorHandler(res, error);
    }
}
