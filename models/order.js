const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Order = sequelize.define('order', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    }
});

module.exports = Order;
/*An order, in the end, is just an in between table bw a USER to which the order belongs and then multiple PRODUCTS
which are a part of the order, these products, again, have a quantity attached to them */