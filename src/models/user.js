const _ = require('lodash');
const uuid = require('uuid/v4');
const bcrypt = require('bcrypt');
const { USER_ROLES, USER_PRIVATE_FIELDS } = require('../../config');
const { nanoid } = require('nanoid')

module.exports = (sequelize, type) => {
    const User = sequelize.define('user', {
        id: {
            type: type.UUID,
            primaryKey: true
        },
        status: {
            type: type.STRING,
            defaultValue: USER_ROLES.ACTIVE
        },
        firstName: {
            type: type.STRING,
            allowNull: true,
            validate: {
                len: [ 1, 30 ]
            }
        },
        lastName: {
            type: type.STRING,
            allowNull: true,
            validate: {
                len: [ 1, 30 ]
            }
        },
        alias: {
            type: type.STRING,
            defaultValue: nanoid(5)
        },
        phoneNumber: {
            type: type.STRING,
            allowNull: false,
            validate: {
                isAlphanumeric: true,
                len: [ 10, 15 ]
            },
            unique: true
        },
        email: {
            type: type.STRING,
            allowNull: true,
            validate: {
                isEmail: true
            },
            unique: true
        },
        mac: {
            type: type.STRING,
            allowNull: false
        },
        role: {
            type: type.STRING,
            defaultValue: USER_ROLES.RIDER
        },
        imageUrl: {
            type: type.STRING,
            unique: true
        },
        country: {
            type: type.STRING,
        },
        state: {
            type: type.STRING,
        },
        city: {
            type: type.STRING,
        },
        addressOrZip: {
            type: type.STRING,
        },
        salt: type.STRING,
        currentLocation: {
            type: type.STRING,
            defaultValue: "0,0"
        },
        currentLocationAddress: type.STRING
    }, {
        hooks: {
            async beforeCreate(instance, options) {
                // ID
                instance.id = uuid();
                try {
                    let foundUser;
                    if(instance.email){
                        foundUser = await User.findOne({
                            where: {
                                email: instance.email,
                            }
                        });
                        if(foundUser) throwNonUniqueError('email');
                    }
                    foundUser = await User.findOne({
                        where: {
                            phoneNumber: instance.phoneNumber,
                        }
                    });
                    if(foundUser) throwNonUniqueError('phoneNumber');

                } catch(error) {
                    console.log(error)
                    throw error;
                }
            },
            async afterCreate(instance, options) {

            }
        }
    })

    /*** Instance methods ***/

    /**
     * toJSON
     * @description: override default toJSON to omit private fields
     */
    User.prototype.toJSON = function() {
        return _.omit(this.get(), USER_PRIVATE_FIELDS);
    }

    return User
}


/*** Private methods ***/

/**
 * getDigest - create encrypted digest
 * @param {string} string
 * @param {string} salt
 * @returns {string} the digest string
 */
const getDigest = (string, salt) => bcrypt.hashSync(string, salt);

/**
 * throwMissingFieldError
 * @param {string} fieldName
 */
const throwMissingFieldError = (fieldName) => {
    throw {
        error: new Error(),
        status: 400,
        name: 'MissingField',
        msg: `The \`${fieldName}\` field is required.`,
        field: fieldName
    }
}

/**
 * throwNonUniqueError
 * @param {string} fieldName
 */
const throwNonUniqueError = (fieldName) => {
    throw {
        error: new Error(),
        status: 400,
        name: 'SequelizeUniqueConstraintError',
        msg: `A user with this ${fieldName} already exists`,
        field: fieldName
    }
}
