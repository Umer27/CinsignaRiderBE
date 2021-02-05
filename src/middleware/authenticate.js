const _ = require('lodash');
const moment = require('moment');
const { Op } = require('sequelize')
const { jwtClient, errorHandler } = require('../utils');
const { Session } = require('./../models');
const { ENV_VARS } = require('../../config');
const { ADMIN_AUTH } = ENV_VARS;

const unauthorizedError = {
    error: new Error(),
    status: 401,
    name: 'Unauthorized',
    msg: 'Request is unauthorized'
}

exports.generalAuth = async(req, res, next) => {
    try {
        const token = req.header('Auth');
        // Admin can access any route that needs authentication
        if(isValidAdminToken(token)){
            req.userId = ADMIN_AUTH
            next();
            return;
        }
        // General authentication
        const sessionId = jwtClient.verify(token);
        const session = await Session.findByPk(sessionId);
        // Get newer sessions that are authenticated
        const createdAtDate = moment(session.createdAt).toDate();
        const newSessions = await Session.findAll({
            where: {
                userId: session.userId,
                createdAt: {
                    [Op.gt]: createdAtDate
                }
            }
        });
        // Throw unauthorized error if session doesn't exist or if 
        // newer sessions have been authenticated
        if(!session || !_.isEmpty(newSessions)){
            throw unauthorizedError;
        }
        req.userId = session.userId
         next();
    } catch(error) {
        errorHandler(res, unauthorizedError);
    }
};

exports.adminAuth = async(req, res, next) => {
    try {
        const token = req.header('Auth');
        if(isValidAdminToken(token)){
            next();
        } else {
            throw unauthorizedError;
        }
    } catch(error) {
        errorHandler(res, unauthorizedError);
    }
}

/**
 * isValidAdminToken
 * @description make sure this token is a valid admin token
 */
const isValidAdminToken = (token) => {
    try {
        // const name = jwtClient.verify(token, ADMIN_AUTH);
        // console.log('Name:-', name);
        // const isValidAdmin = (name === 'admin');
        return token === ADMIN_AUTH;
    } catch(error) {
        return false;
    }
}