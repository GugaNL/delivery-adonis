'use strict'

const DB = use('Database')

class DashBoardController {

    /**
     * Informações que aparecem na dashboard 
     */
    async index({ response }) {
        const users = await DB.from('users').getCount()
        const orders = await DB.from('orders').getCount()
        const products = await DB.from('products').getCount()
        const subtotal = await DB.from('order_items').getSum('subtotal')
        const discounts = await DB.from('coupon_order').getSum('discount')
        const revenue = subtotal - discounts
        return response.send({ users, orders, products, revenue })
    }

}

module.exports = DashBoardController
