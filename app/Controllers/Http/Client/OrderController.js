'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Order = use('App/Models/Order')
const Transformer = use('App/Transformers/Admin/OrderTransformer')
const Database = use('Database')
const Service = use('App/Services/Order/OrderService')
const Ws = use('Ws')
const Coupon = use('App/Models/Coupon')
const Discount = use('App/Models/Discount')



/**
 * Resourceful controller for interacting with orders
 */
class OrderController {
  /**
   * Show a list of all orders.
   * GET orders
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ request, response, pagination, transform, auth }) {
    const client = await auth.getUser() // Pega o usuário para poder filtrar as ordens, exibindo apenas as dele
    // order number
    const number = request.input('number')

    try {
      const query = Order.query()

      if (number) {
        query.where('id', 'LIKE', `${number}`)
      }

      query.where('user_id', client.id) // Faz o filtro por usuário

      const results = await query.orderBy('id', 'DESC').paginate(pagination.page, pagination.limit)
      const orders = await transform.paginate(results, Transformer)

      return response.send(orders)
    } catch (error) {
      return response.send({ message: 'Não foi possível listar seus pedidos' })
    }

  }



  /**
   * Create/save a new order.
   * POST orders
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response, auth, transform }) {
    const trx = await Database.beginTransaction()
    try {
      const client = await auth.getUser() // Pega o usuario
      const items = request.input('items') //Array
      var order = await Order.create({ user_id: client.is }, trx)
      const service = new Service(order, trx)

      if (items.length > 0) {
        await service.syncItems(items)
      }

      await trx.commit()

      // Instancia os hooks de cálculos dos subtotais
      order = await Order.find(order.id)
      order = await transform.include('items').item(order, Transformer)

      //Emite um broadcast no websocket
      const topic = Ws.getChannel('notifications').topic('notifications')

      if (topic) {
        topic.broadcast('new:order', order)
      }

      return response.status(201).send(order)
    } catch (error) {
      await trx.rollback()
      return response.send({ message: 'Não foi possível realizar o pedido' })
    }
  }

  /**
   * Display a single order.
   * GET orders/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, transform, auth }) {
    try {
      const client = await auth.getUser() // Pega o usuario logado
      //const result = await Order.findOrFail(params.id)
      const result = await Order.query().where('user_id', client.id).where('id', params.id).firstOrFail() // Filtrando por usuario simples logado
      const order = await transform.item(result, Transformer)
      return response.send(order)
    } catch (error) {
      return response.send({ message: 'Não foi possível exibir o pedido' })
    }
  }


  /**
   * Update order details.
   * PUT or PATCH orders/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response, transform, auth }) {
    const client = await auth.getUser()

    var order = await Order.query().where('user_id', client.id).where('id', params.id).firstOrFail()

    const trx = await Database.beginTransaction()
    try {
      const { items, status } = request.all()
      order.merge({ user_id: client.id, status })
      const service = new Service(order, trx)
      await service.updateItems(items)
      await order.save(trx)
      await trx.commit()
      order = await transform.include('items, coupons, discounts').item(order, Transformer)
      return response.send(order)
    } catch (error) {
      await trx.rollback()
      return response.status(400).send({ message: 'Não foi possível atualizar o pedido' })
    }

  }

  /**
   * Delete a order with id.
   * DELETE orders/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {
  }


  /**
   * 
   * Aplicando desconto no pedido 
   */
  async applyDiscount({ params, request, response, transform, auth }) {
    const client = await auth.getUser()
    const { code } = request.all() // Código do desconto
    const coupon = await Coupon.findByOrFail('code', code.toUpperCase())  // findByOrFail porque vai buscar por outro campo e nao pelo id
    var order = await Order.query().where('user_id', client.id).where('id', params.id).firstOrFail()

    var discount, info = {}

    try {
      const service = new Service(order)
      const canAddDiscount = await service.canApplyDiscount(coupon)
      const orderDiscounts = await order.coupons().getCount()

      const canApplyToOrder = orderDiscounts < 1 || (orderDiscounts >= 1 && coupon.recursive)

      if (canAddDiscount && canApplyToOrder) {
        discount = await Discount.findOrCreate({
          order_id: order.id,
          coupon_id: coupon.id
        })

        info.message = 'Cupom aplicado com sucesso'
        info.success = true
      } else {
        info.message = 'Não foi possível aplicar o cupom'
        info.success = false
      }

      order = await transform.include('coupons, items, discounts').item(order, Transformer)
      return response.send({ order, info })
    } catch (error) {
      return response.status(400).send({ message: 'Erro', info: info })
    }
  }


  async removeDiscount({ params, request, response, auth }) {
      const { discount_id } = request.all()
      
      try {
        const discount = await Discount.findOrFail(discount_id)
        await discount.delete()
        return response.status(204).send()
      } catch (error) {
        return response.send({ message: 'Não foi possível remover o desconto' })
      }

  }

}

module.exports = OrderController
