exports.SESSION_INPUT_FIELDS = [
    'phoneNumber',
    'mac',
    'currentLocation'
];

exports.USER_INPUT_FIELDS = [
    'firstName',
    'lastName',
    'email',
    'phoneNumber',
    'mac',
    'role',
    'imageUrl',
    'password',
    'country',
    'state',
    'city',
    'addressOrZip',
    "shiftId"
];
exports.UPDATE_USER_INPUT_FIELDS = [
    'firstName',
    'lastName',
    'email',
    'phoneNumber',
    'role',
    'imageUrl',
    'password',
    'country',
    'state',
    'city',
    'addressOrZip',
    'currentLocation',
    "shiftId",
    "status"
];

exports.SHIFT_INPUT_FIELDS = [
    'category',
    'start',
    'end'
]

exports.ONLINE_INPUT = [
    'isOnline',
    'currentLocation',
    'zone'
]

exports.OFFLINE_INPUT = [
    'isOnline',
    'currentLocation',
    'recordId'
]

exports.BULK_USERS = [
    'bulk'
]
