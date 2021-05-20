const _ = require('lodash');
const uuid = require('uuid/v4');
const { RECORD_STATUS } = require('../../config');

module.exports = (sequelize, type) => {
    const Record = sequelize.define('record', {
        id: {
            type: type.UUID,
            primaryKey: true
        },
        status: {
            type: type.STRING,
            defaultValue: RECORD_STATUS.ACTIVE
        },
        startLocation: {
            type: type.STRING,
            defaultValue: ""
        },
        startLocationAddress: {
            type: type.STRING,
            defaultValue: ""
        },
        endLocation: {
            type: type.STRING,
            defaultValue: ""
        },
        endLocationAddress: {
            type: type.STRING,
            defaultValue: ""
        },
        recordedTime: {
            type: type.TIME,
            defaultValue: "00:00"
        },
        recordEnd: {
            type: type.TIME,
            defaultValue: "00:00"
        },
        job: {
            type: type.BOOLEAN,
            defaultValue: false
        }
    }, {
        hooks: {
            async beforeCreate(instance, options) {
                // ID
                try {
                    instance.id = uuid();
                } catch(e) {
                    console.log(e)
                }


            },
            async afterCreate(instance, options) {

            }
        }
    })

    /*** Instance methods ***/

    return Record
}

