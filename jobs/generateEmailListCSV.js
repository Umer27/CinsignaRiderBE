"use strict";

const _ = require('lodash');
const fs = require('fs');
const { User } = require('../src/models');
const { USER_ROLES } = require('../config');
const { sendCustomerEmailList } = require('../src/mailers/emailListMailer');

const emailListFields = [ 'firstName', 'lastName', 'email' ];

/**
 * generateEmailListCSV
 */
const generateEmailListCSV = async () => {
    try {
        const customers = await User.findAll({
            where: {
                role: USER_ROLES.CUSTOMER,
                phoneNumberVerified: true,
                emailVerified: true
            }
        });

        const customerList = customers.map(customer => {
            const pickedData = _.pick(customer, emailListFields);
            return Object.values(pickedData).join(',');
        });

        const customerListCSV = customerList.join('\n');

        fs.writeFileSync('customer_email_list.csv', customerListCSV, 'utf8', (err) => {
            if (err) {
              console.log('Some error occured - file either not saved or corrupted file saved.');
              process.exit();
            }
        });

        await sendCustomerEmailList(customerListCSV);

        process.exit();

    } catch (error) {
        console.log({error});
    }
}

generateEmailListCSV();