const ENV_VARS = require('./env');
const inputFields = require('./inputFields');
const privateFields = require('./privateFields');
const publicFields = require('./publicFields');
const constantFields = require('./constants');
const enums = require('./enums');

module.exports = {
    ...inputFields,
    ...privateFields,
    ...publicFields,
    ...constantFields,
    ...enums,
    ENV_VARS
};

