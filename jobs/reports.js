const _ = require('lodash');
const moment = require('moment-timezone');
const { Op } = require('sequelize');
const { Order, User, Product } = require('../src/models');
const { ENV_VARS, ORDER_STATUS, USER_ROLES, REPORT_TYPES } = require('../config');
const { COMPLETED, IN_REVIEW } = ORDER_STATUS;
const { TIME_ZONE } = ENV_VARS;
const { sendReportEmail } = require('../src/mailers/reportMailer');

/**
 * getReportData 
 * @description: return report data from a collection of Orders
 * @param {Array} orders - collection of orders
 * @returns <Promise> {Object} totalAmount, cashAmount, cardAmount, productNameCounts
 */
const getReportData = (orders) => {
    return new Promise(async(resolve, reject) => {
        try { 
            const totalAmount = _.sum(orders.map(o => o.totalPrice));
            const cashAmount = _.sum(orders.map(o => o.cashPaymentAmount));
            const cardAmount = _.sum(orders.map(o => o.cardPaymentAmount));
            const surge1Amount = _.sum(orders.map(o => o.surgeLevel === 1 ? o.surgeAmount : 0));
            const surge2Amount = _.sum(orders.map(o => o.surgeLevel === 2 ? o.surgeAmount : 0));
            const surge1Count = _.filter(orders, { surgeLevel: 1 }).length;
            const surge2Count = _.filter(orders, { surgeLevel: 2 }).length;
            const allProductIds = _.flatten(orders.map(o => o.productIds));
            const productIdCounts = _.countBy(allProductIds);
            const products = await Product.findAll({ where: {
                id: Object.keys(productIdCounts)
            }});
            const productNameCounts = {
                Zen: 0,
                Excite: 0,
                Inspire: 0,
                Power: 0,
                Care: 0
            };

            // Show Product count by Product name for display
            Object.entries(productIdCounts).forEach(([ key, val ]) => {
                const product = _.find(products, { id: key });
                productNameCounts[product.name] = val;
            });

            // Remove products with zero sold count
            Object.entries(productNameCounts).map(([key, val]) => {
                if (val === 0) delete productNameCounts[key];
            });

            resolve({ 
                totalAmount, 
                cashAmount, 
                cardAmount, 
                surge1Amount,
                surge2Amount,
                surge1Count,
                surge2Count,
                productNameCounts
            });

        } catch (error) {
            console.log({ error });
            reject(error);
        }
    });
}

/**
 * generateReport
 * @description: generate the report for team and individual workers
 * @param {Array} orders - all of the order data to use in the report
 * @returns <Promise> {Object} teamReportData object, workerReportDataCollection collection
 */
const generateReport = (orders) => {
    return new Promise(async(resolve, reject) => {
        try {
            // Get All Workers
            const workers = await User.findAll({ 
                where: {
                    role: USER_ROLES.WORKER
                }
            });

            // Get data for the team
            const teamReportData = await getReportData(orders);

            // Get data for individual workers
            const workerReportDataCollection = [];
            const orderIds = orders.map(o => o.id);
            for (let worker of workers) {
                const workerOrders = await Order.findAll({
                    where: {
                        id: orderIds,
                        workerId: worker.id
                    }
                });
                const workerReportData = await getReportData(workerOrders);
                workerReportData.ordersCount = workerOrders.length;  
                workerReportData.workerName = `${worker.firstName} ${worker.lastName}`;
                workerReportDataCollection.push(workerReportData);
            };

            resolve({
                teamReportData,
                workerReportDataCollection
            });

        } catch (error) {
            console.log({error});
            reject(error);
        }
    });
}


/**
 * runDailyReport
 * @description: daily report gets generated and sent to admin emails
 * @param {Object} todayStartDate - moment object start time of day
 * @param {Object} todayEndDate - moment object end time of day
 * @returns <Promise>
 */
const runDailyReport = (todayStartDate, todayEndDate) => {
    return new Promise(async(resolve, reject) => {
        console.log('--- SENDING DAILY REPORT ---');
        try {
            // Get previous day's completed orders
            const orders = await Order.findAll({ 
                where: {
                    status: {
                        [Op.or]: [ COMPLETED, IN_REVIEW ]
                    },
                    completedAt: {
                        [Op.gt]: todayStartDate,
                        [Op.lt]: todayEndDate
                    }
                }
            });

            // Generate the report
            const { teamReportData, workerReportDataCollection } = await generateReport(orders);

            // Send the report
            await sendReportEmail({
                reportType: REPORT_TYPES.DAILY, 
                data: {                   
                    teamReportData,
                    workerReportDataCollection
                }
            });

            resolve();

        } catch (error) {
            console.log({error});
            reject(error);
        }
    });
}


/**
 * runMonthlyReport
 * @description: monthly report gets generated and sent to admin emails
 * @param {Object} monthStartDate - moment object first day of month
 * @param {Object} monthEndDate - moment object last day of month
 */
const runMonthlyReport = (monthStartDate, monthEndDate) => {
    return new Promise(async(resolve, reject) => {
        console.log('--- SENDING MONTHLY REPORT ---');
        try {
            // Get previous day's completed orders
            const orders = await Order.findAll({ 
                where: {
                    status: {
                        [Op.or]: [ COMPLETED, IN_REVIEW ]
                    },
                    completedAt: {
                        [Op.gt]: monthStartDate,
                        [Op.lt]: monthEndDate
                    }
                }
            });

            // Generate the report
            const { teamReportData, workerReportDataCollection } = await generateReport(orders);

            // Send the report
            await sendReportEmail({
                reportType: REPORT_TYPES.MONTHLY, 
                data: {                   
                    teamReportData,
                    workerReportDataCollection
                }
            });

            resolve();
        } catch (error) {
            console.log({error});
            reject(error);
        }
    });
}

// Set dates objects for yesterday
const now = moment().tz(TIME_ZONE);
const yesterdayStartDate = now.clone().subtract(1, 'day').startOf('day');
const yesterdayEndDate = now.clone().subtract(1, 'day').endOf('day');
const monthStartDate = now.clone().subtract(1, 'day').startOf('month');
const monthEndDate = now.clone().subtract(1, 'day').endOf('month');

console.log({ 
    yesterdayStartDate: yesterdayStartDate.toString(), 
    yesterdayEndDate: yesterdayEndDate.toString(),
    monthStartDate: monthStartDate.toString(),
    monthEndDate: monthEndDate.toString()
});

// Run Daily Report always
setTimeout(() => runDailyReport(yesterdayStartDate, yesterdayEndDate), 1000);

// Run Monthly Report if it's the first of the month
if (now.month() !== yesterdayStartDate.month()) {  
    setTimeout(() => runMonthlyReport(monthStartDate, monthEndDate), 2000);
}
