const AWS = require('aws-sdk');
const multer = require('multer')
const multerS3 = require('multer-s3');
const { v4 } = require('uuid');
const { ENV_VARS } = require('../../config');

AWS.config.update({
    accessKeyId: 'AKIA5TW2Y7HIMRXOMHJW',
    secretAccessKey: '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',
    region: 'ap-south-1'
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
        bucket: 'consigna-riders',
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