const _ = require('lodash');
const { Op } = require("sequelize");

module.exports = {

    /**
     * getRandomNumPin - create
     * @param {*} length
     */
    getRandomNumPin: function(length) {
        const randInt = Math.round(Math.random() * 10 ** length).toString();
        return randInt.padStart(length, '0');
    },

    /**
     * formattedPhoneNumber
     * @param {String} phoneNumber - the phone number
     * @returns {String} the phone number in a better format
     */
    formattedPhoneNumber: function(phoneNumber) {
        const x = phoneNumber.match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
        const formatted = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
        return formatted;
    },

    /**
     * errorHandler - catch errors and send status to clients
     * @param {object} res - the response object
     * @param {object} error - the error object
     */
    errorHandler: function(res, error) {
        // Output all errors except UNAUTHORIZED
        // TODO put all errors into an enum file
        if(error.name === 'Unauthorized'){
            console.log({ error: 'Unauthorized' });
        } else {
            if(error.errors) error.errors.forEach(e => console.log({ errorItem: e }));
            console.log({ error });
        }
        /* Catch Sequelize field errors */
        if(error.errors && error.errors[0].path){
            error.field = error.errors[0].path;
        }
        if(!error.status) error.status = 500;
        if(error.name === 'SequelizeDatabaseError'){
            error.name = 'InvalidFormat';
            error.msg = 'The query data is in an incorrect format.'
        }
        res.status(error.status).json({
            name: error.name,
            msg: error.msg,
            field: error.field
        });
    },

    /**
     * assertExistence - make sure the instance is not empty
     * @param {object} instance
     * @returns {boolean} is instance valid?
     */
    assertExistence: function(instance) {
        if(_.isEmpty(instance)){
            throw {
                error: new Error(),
                status: 404,
                name: 'NotFound',
                msg: 'The requested object was not found.'
            }
        }
        return true;
    },

    /**
     * getRequestQueryInfo - split query object as `where` (model params), `limit`, and `offset`
     * @param {object} req.query - the query object
     * @returns {object} all query params into object
     */
    getRequestQueryInfo: function({ query }) {
        const where = _.isEmpty(query) ? {} : _.omit(query, [ 'offset', 'limit', 'order', 'attributes', 'resendVerification' ]);
        // Split arrays in string form  
        for(let [ key, val ] of Object.entries(where)) {
            if(typeof val === 'string' && val.indexOf(',') >= 0){
                where[key] = val.split(',');
            }
        }
        const limit = parseInt(_.get(query, 'limit')) || 50; // default 50
        const offset = parseInt(_.get(query, 'offset')) || 0; // default 0
        const orderString = _.get(query, 'order');
        let order;
        if(orderString){
            const [ field, direction ] = JSON.parse(orderString);
            order = [ [ field, direction ], [ 'id', direction ] ];
        }
        let attributes = getQueryAttributes(query);
        return { where, limit, offset, order, attributes };
    },

    /**
     * getResponseQueryInfo - update query info and return to client
     * @param {number} count - the number of records
     * @param {number} limit - the query limit
     * @param {number} offset - the query offset
     * @return {object} the updated query variables
     */
    getResponseQueryInfo: function(count, limit, offset) {
        const pages = Math.ceil(count / limit);
        const page = offset >= 0 ? offset + 1 : 0;
        let newOffset = limit * offset;
        return { pages, page, newOffset };
    },

    /**
     * getQueryAttributes
     * @param {object} req.query - the query object
     * @returns {object} all query params into object
     */
    getQueryAttributes: function({ query }) {
        return getQueryAttributes(query);
    },
};


/**
 * getQueryAttributes
 * @param {*} query.attributes - the attributes query param
 * @returns {Array} the attributes array
 */
const getQueryAttributes = ({ attributes }) => {
    if(attributes){
        try {
            attributes = JSON.parse(attributes);
            if(!Array.isArray(attributes)){
                attributes = attributes.split(',');
            }
        } catch(error) {
            attributes = attributes.split(',');
        }
    }
    return attributes;
}