const _ = require('lodash');
const uuid = require('uuid/v4');
const moment = require('moment')

module.exports = (sequelize, type) => {
    const Shift = sequelize.define('shift', {
        id: {
            type: type.UUID,
            primaryKey: true
        },
        category: {
            type: type.STRING,
            allowNull: false
        },
        start: {
            type: type.TIME,
            allowNull: false
        },
        end: {
            type: type.TIME,
            allowNull: false
        },
        workingHours: {
            type: type.TIME,
        }
    }, {
        hooks: {
            async beforeCreate(instance, options) {
                // ID
                try {
                    instance.id = uuid();
                    let ms = moment(instance.end, "HH:mm").diff(moment(instance.start, "HH:mm"));
                    instance.workingHours = moment.utc(ms).format("hh:mm");
                } catch(e) {
                    console.log(e)
                }


            },
            async afterCreate(instance, options) {

            }
        }
    })

    /*** Instance methods ***/

    return Shift
}

