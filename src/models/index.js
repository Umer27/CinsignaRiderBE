const SessionModel = require('./session');
const UserModel = require('./user');
const ShiftModel = require('./shift');
const AttendanceModel = require('./attendance');
const RecordModel = require('./record');
const { ENV_VARS } = require('../../config');

const { DATABASE_URL } = ENV_VARS;


const Sequelize = require('sequelize');
const sequelize = new Sequelize(DATABASE_URL, {
        logging: false,
        dialect: 'postgresql',
        timezone: 'utc',
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        dialectOptions: {
            // heroku db
            // ssl: {
            //     require: true,
            //     rejectUnauthorized: false
            // }
            //local db
            ssl: false,
        }
    }
);

/*** Initialize Models ***/
const User = UserModel(sequelize, Sequelize);
const Session = SessionModel(sequelize, Sequelize);
const Shift = ShiftModel(sequelize, Sequelize);
const Attendance = AttendanceModel(sequelize, Sequelize);
const Record = RecordModel(sequelize, Sequelize);

/*** Set Relationships ***/
//User
User.hasMany(Session, { onDelete: 'cascade', hooks: true })
User.hasMany(Attendance, {
    foreignKey: 'riderId',
    as: 'attendance',
    onDelete: 'cascade',
    hooks: true
})
User.belongsTo(Shift, { as: 'shift' })
//Session
Session.belongsTo(User)
//attendance
Attendance.belongsTo(User, {
    foreignKey: 'riderId',
    as: 'rider'
})
Attendance.belongsTo(Shift)
Attendance.hasMany(Record, { as: 'record', onDelete: 'cascade', hooks: true })
//record
Record.belongsTo(User, { foreignKey: 'riderId', as: 'rider' })
Record.belongsTo(Attendance)

/**
 * Set up database
 */
const syncDb = async() => {
    const resetDB = false;
    await sequelize.sync({ force: resetDB });
    console.log(`\nDatabase & tables created!`);
    console.log(`resetting database?: ${resetDB}\n`)
}
syncDb();

module.exports = {
    sequelize,
    Session,
    User,
    Shift,
    Attendance,
    Record
}
