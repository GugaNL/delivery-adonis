'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Order extends Model {

    /**
     * Criado para referenciar o hook de order
     */
    static boot() {
        super.boot()
        this.addHook('afterFind', 'OrderHook.updateValues')
        this.addHook('afterPaginate', 'OrderHook.updateCollectionValues') // É criado outro hook aqui pois o de cima recebe como parametro apenas 1 model
    }

    items() {
        return this.hasMany('App/Models/OrderItem') //hasMany pois 1 item de pedido somente pertence a uma order, mas uma order pode ter mais que 1 item
    }

    coupons() {
        return this.belongsToMany('App/Models/Coupon')
    }

    discounts() {
        return this.hasMany('App/Models/Discount')
    }

    user() {
        return this.belongsTo('App/Models/User', 'user_id', 'id')
    }
    
}

module.exports = Order
