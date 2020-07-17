'use strict'

const BumblebeeTransformer = use('Bumblebee/Transformer')
const CouponTransformer = use('App/Transformers/Admin/CouponTransformer')


/**
 * DiscountTransformer class
 *
 * @class DiscountTransformer
 * @constructor
 */
class DiscountTransformer extends BumblebeeTransformer {

  static get defaultInclude() {
     return ['coupon']  
  }

  /**
   * This method is used to transform the data.
   */
  transform (model) {
    return {
     // add your transformation object here
     id: model.id,
     amount: model.discount
    }
  }

  includeCoupon() {
     return this.item(model.getRelated('coupoun'), CouponTransformer)
  }

}

module.exports = DiscountTransformer
