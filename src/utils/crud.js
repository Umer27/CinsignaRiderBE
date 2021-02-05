const _ = require('lodash');
const {
    errorHandler,
    assertExistence,
    getRequestQueryInfo,
    getResponseQueryInfo,
    getQueryAttributes
} = require('./helpers');

/**
 * getInstance - general single-GET request handler
 * @param {object} req - the request object
 * @param {object} res - the response object
 * @param {class} Model - the sequelize Model class
 * @param {array} includes - collection of associated models to include
 * @param {array} exclude - (optional) an array of attributes to exclude from query
 */
exports.getInstance = async function(req, res, Model, include, exclude = undefined) {
    const id = req.params.id;
    let attributes = getQueryAttributes(req);
    attributes = attributes ? attributes : { exclude };
    try {
        let instance = await Model.findOne({
            where: { id },
            attributes,
            include
        });
        assertExistence(instance);
        res.json(instance);
    } catch(error) {
        errorHandler(res, error);
    }
}

/**
 * getInstances - general multi-GET request handler
 * @param {object} req - the request object
 * @param {object} res - the response object
 * @param {class} Model - the sequelize Model class
 * @param {array} exclude - (optional) an array of attributes to exclude from query
 */
exports.getInstances = async function(req, res, Model, include, exclude) {
    let { where, limit, offset, order, attributes = undefined } = getRequestQueryInfo(req);
    attributes = attributes ? attributes : { exclude };
    try {
        const count = await Model.count({ where });
        const { pages, page, newOffset } = getResponseQueryInfo(count, limit, offset);
        let instances = await Model.findAll({
            where,
            order,
            include,
            attributes,
            limit,
            offset: newOffset
        });
        res.json({
            result: instances,
            count,
            page,
            pages
        });
    } catch(error) {
        errorHandler(res, error);
    }
}

/**
 * postInstance - general POST request handler
 * @param {object} req - the request object
 * @param {object} res - the response object
 * @param {class} Model - the sequelize Model class
 * @param {array} INPUT_FIELDS - the allowed fields for the request body
 */
exports.postInstance = async function(req, res, Model, INPUT_FIELDS) {
    const body = _.pick(req.body, INPUT_FIELDS);
    try {
        const instance = await Model.create(body);
        res.json(instance);
    } catch(error) {
        errorHandler(res, error);
    }
}

/**
 * patchInstance - general PATCH request handler
 * @param {object} req - the request object
 * @param {object} res - the response object
 * @param {class} Model - the sequelize Model class
 * @param {array} INPUT_FIELDS - the allowed fields for the request body
 */
exports.patchInstance = async function(req, res, Model, INPUT_FIELDS) {
    const id = req.params.id;
    const body = _.pick(req.body, INPUT_FIELDS);
    try {
        let instance = await Model.findByPk(id);
        assertExistence(instance);
        // Apply the updates
        await instance.update(body);
        instance = instance.toAsyncJSON ? await instance.toAsyncJSON() : instance.toJSON();
        res.json(instance);
    } catch(error) {
        errorHandler(res, error);
    }
}

/**
 * deleteInstance - general single-DELETE request handler
 * @param {object} req - the request object
 * @param {object} res - the response object
 * @param {class} Model - the sequelize Model class
 */
exports.deleteInstance = async function(req, res, Model) {
    const id = req.params.id;
    try {
        let instance = await Model.findByPk(id);
        assertExistence(instance);
        // Destroy the instance
        await instance.destroy();
        res.send();
    } catch(error) {
        errorHandler(res, error);
    }
}

/**
 * deleteInstances - general multi-DELETE request handler
 * @param {object} req - the request object
 * @param {object} res - the response object
 * @param {class} Model - the sequelize Model class
 */
exports.deleteInstances = async function(req, res, Model) {
    const where = req.query;
    try {
        assertExistence(where);
        // Destroy all instances that match query
        const result = await Model.destroy({ where });
        res.json({ result });
    } catch(error) {
        errorHandler(res, error);
    }
}