const unflatten = require('flat').unflatten;

const envs = Object.entries(process.env);
const obj = {};

for (let [key, val] of envs) {
    key = key.replace(/___/g, '.');
    obj[key] = val;
}

module.exports = unflatten(obj);