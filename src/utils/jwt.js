const fs = require('fs');
const jwt = require('jsonwebtoken');
const { ENV_VARS } = require('../../config');
const { PRIVATE_KEY, PUBLIC_KEY } = ENV_VARS;

module.exports = {

    /**
     * sign
     * @param {*} obj.payload
     * @param {string} obj.expiresIn
     */
    sign: ({ payload, expiresIn }) => {
        const signOptions = {
            algorithm: 'RS256',
            expiresIn
        };
        return jwt.sign({ data: payload }, process.env.PRIVATE_KEY.replace(/\\n/gm, '\n'), signOptions);
    },

    /**
     * verify
     * @param {string} token - the JWT to check
     * @param {string} secretKey - (optional) the unlock key - default as public key
     */
    verify: (token, secretKey = undefined) => {
        let decoded;
        // Use Public Key if no secret key passed
        if(secretKey){
            decoded = jwt.verify(token, secretKey);
        } else {
            const verifyOptions = { algorithm: [ 'RS256' ] };
            decoded = jwt.verify(token, process.env.PUBLIC_KEY.replace(/\\n/gm, '\n'), verifyOptions)
        }
        try {
            return decoded.data;
        } catch(error) {
            throw error;
        }
    }
}