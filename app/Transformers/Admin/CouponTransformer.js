'use strict'

const BumblebeeTransformer = use('Bumblebee/Transformer')
const UserTransformer = use('App/Transformers/Admin/UserTransformer')
const OrderTransformer = use('App/Transformers/Admin/OrderTransformer')


/**
 * CouponTransformer class
 *
 * @class CouponTransformer
 * @constructor
 */
class CouponTransformer extends BumblebeeTransformer {

  static get availableInclude() {
    return ['users', 'products', 'orders']
  }

  /**
   * This method is used to transform the data.
   */
  transform(model) { // Nesse caso deseja tudo menos o created_at e updated_at
    model = model.toJSON() // Transforma o sideloaded do Models/Hooks/OrderHook em objeto json
    delete model.created_at
    delete model.updated_at
    return {
      // add your transformation object here
      model
    }
  }


  includeUsers(model) {
    return this.collection(model.getRelated('users'), UserTransformer)
  }


  includeProducts(model) {
    return this.collection(model.getRelated('products'), ProductTransformer)
  }


  includeOrders(model) {
    return this.collection(model.getRelated('orders'), OrderTransformer)
  }

}

module.exports = CouponTransformer
