const _ = require('lodash');
const uuid = require('uuid/v4');
const { ATTENDANCE_STATUS } = require('../../config');

module.exports = (sequelize, type) => {
    /*** Instance methods ***/

    return sequelize.define('attendance', {
        id: {
            type: type.UUID,
            primaryKey: true
        },
        status: {
            type: type.STRING,
            defaultValue: ATTENDANCE_STATUS.ACTIVE
        },
        isLate: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        LateValue: {
            type: type.STRING,
            defaultValue: '0'
        },
        dayEnd: {
            type: type.STRING,
            defaultValue: "00:00"
        },
        dayTotalTime: {
            type: type.TIME,
            defaultValue: "00:00"
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
}

