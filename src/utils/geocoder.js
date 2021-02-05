const NodeGeocoder = require('node-geocoder');
const { ENV_VARS } = require('../../config');
const { GOOGLE_API_KEY } = ENV_VARS;

const options = {
    provider: 'google',
    apiKey: GOOGLE_API_KEY
};

const geocoder = NodeGeocoder(options);

module.exports = geocoder;