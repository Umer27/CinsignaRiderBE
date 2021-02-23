const _ = require('lodash');
const crudMethods = require('./crud');
const helperMethods = require('./helpers');
const jwtClient = require('./jwt');
const geocoder = require('./geocoder');
const mediaUpload = require('./mediaUpload');

module.exports = {
    ...crudMethods,
    ...helperMethods,
    jwtClient,
    geocoder,
    ...mediaUpload
};