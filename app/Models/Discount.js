'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Discount extends Model {

    static boot() {
        super.boot()
        this.addHook('beforeSave', 'DiscountHook.calculateValues')
        this.addHook('afterSave', 'DiscountHook.decrementCoupons') // Ao ser usado o cupom então será decrementado da quantidade disponível
        this.addHook('afterDelete', 'DiscountHook.incrementCoupons') // 
    }

    /**
     * Se liga com a tabela coupon_order, pois nao existe a tabela discounts
     */
    static get table() {
        return 'coupon_order'
    }

    /**
     * Relacionamento com Order
     */
    order() {
        return this.belongsTo('App/Models/Order', 'order_id', 'id')
    }

    /**
     * Relacionamento com Coupon
     */
    coupon() {
        return this.belongsTo('App/Models/Coupon', 'coupon_id', 'id')
    }
}

module.exports = Discount
