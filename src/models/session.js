const _ = require('lodash');
const jwt = require('jsonwebtoken');
const uuid = require('uuid/v4');
const { SESSION_PRIVATE_FIELDS } = require('../../config');

module.exports = (sequelize, type) => {
    const Session = sequelize.define('session', {
        id: {
            type: type.UUID,
            primaryKey: true
        },
        phoneNumber: {
            type: type.STRING,
            allowNull: false
        },
        mac: type.STRING,
        isActive: {
            type: type.BOOLEAN,
            defaultValue: true
        }
    }, {
        hooks: {
            beforeCreate(instance) {
                // ID 
                instance.id = uuid();

            },
            async afterCreate(instance) {

            }
        }
    });

    /*** Instance Methods ***/

    /**
     * toJSON
     * @description: override default toJSON to omit private fields
     */
    Session.prototype.toJSON = function() {
        return _.omit(this.get(), SESSION_PRIVATE_FIELDS);
    }

    /**
     * updateVerification - ensure the pin is correct and the secret token is not expired
     * @param {string} pin - 4 digit pin
     * @returns {} <Promise>
     */
    Session.prototype.updateVerification = async function(pin) {
        return new Promise(async(resolve, reject) => {
            try {
                jwt.verify(this.token, pin);
                await this.update({
                    pinVerified: true
                });
                resolve();
            } catch(error) {
                reject({
                    error: new Error(),
                    status: 400,
                    name: 'PinIncorrect',
                    msg: 'The pin is incorrect or the session has expired.'
                });
            }
        });
    };

    // Return the Model
    return Session;
}