const { ENV_VARS } = require('../../config');
const distance = require('google-distance-matrix');
const { GOOGLE_API_KEY } = ENV_VARS;

const distanceMatrix = function() {
    distance.key(GOOGLE_API_KEY);
    distance.units('metric');

    let callDistanceMatrixAPI = function(origins, destinations, callback) {
        distance.matrix(origins, destinations, callback)
    }
    this.etaOrders = (origins, destinations) => {
        return new Promise(async(resolve, reject) => {
            const eta = []
            callDistanceMatrixAPI(origins, destinations, async(err, distances) => {
                    if(err){
                        reject({
                            err: err,
                            name: 'Distance Matrix API',
                            msg: 'Distance Matrix API not working'
                        })
                    }
                    if(!distances){
                        console.warn('Distance Matrix API returns no distances');
                    }

                    if(distances.status === 'OK'){

                        for(let i = 0; i < origins.length; i++) {
                            for(let j = 0; j < destinations.length; j++) {
                                let origin = distances.origin_addresses[i];
                                let destination = distances.destination_addresses[j];
                                if(distances.rows[0].elements[j].status === 'OK'){
                                    let duration = distances.rows[i].elements[j].duration.text;
                                    eta.push(duration)
                                } else {
                                    //destination + ' is not reachable by land from ' + origin
                                    eta.push("-1")
                                }
                            }
                        }
                        resolve(eta)
                    } else {
                        console.warn('Distance Matrix API ends with different statusCode', distances.status);
                        reject({
                            err: err,
                            name: 'Distance Matrix API',
                            msg: 'Distance Matrix API not working'
                        })
                    }
                }
            )
        })
    }
}

module.exports = new distanceMatrix()