const AWS = require('aws-sdk');
const multer = require('multer')
const multerS3 = require('multer-s3');
const { v4 } = require('uuid');
const { ENV_VARS } = require('../../config');

console.log()

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_S3_REGION
});

const S3 = new AWS.S3();
const isAllowedMimetype = (mime) => [ 'image/png', 'image/jpg', 'image/jpeg' ].includes(mime.toString());
const fileFilter = (req, file, callback) => {
    const fileMime = file.mimetype;
    if(isAllowedMimetype(fileMime)){
        callback(null, true)
    } else {
        callback(null, false)
    }
}
const getUniqFileName = (originalname) => {
    const name = v4();
    const ext = originalname.split('.').pop();
    return `${name}.${ext}`;
}

const handleUploadMiddleware = multer({
    fileFilter,
    storage: multerS3({
        s3: S3,
        bucket: process.env.AWS_BUCKET_NAME,
        acl: 'public-read',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function(req, file, cb) {
            const fileName = getUniqFileName(file.originalname);
            const s3_inner_directory = 'public_asset';
            const finalPath = `${s3_inner_directory}/${fileName}`;

            file.newName = fileName;

            cb(null, finalPath);
        }
    })
});

module.exports.S3 = S3
module.exports.handleUploadMiddleware = handleUploadMiddleware