'use strict'

const OrderItemHook = exports = module.exports = {}

const Product = use('App/Models/Product')

OrderItemHook.updateSubtotal = async model => {
   let product = await Product.find(model.product_id) // Busca o produto pelo id que ja tem, e carrega as informações na variável product
   model.subtotal = model.quantity * product.price // Faz o calculo
}
