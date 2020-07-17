'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Order = use('App/Models/Order')
const Database = use('Database')
const Service = use('App/Services/Order/OrderService')
const Coupon = use('App/Models/Coupon')
const Discount = use('App/Models/Discount')
const Transformer = use('App/Transformers/Admin/OrderTransformer')


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
  async index({ request, response, pagination, transform }) {
    try {
      const { status, id } = request.only(['status', 'id'])
      const query = Order.query()

      if (status && id) {
        query.where('status', status)
        query.orWhere('id', 'LIKE', `%${id}%`)
      } else if (status) {
        query.where('status', status)
      } else if (id) {
        query.orWhere('id', 'LIKE', `%${id}%`)
      }

      var orders = await query.paginate(pagination.page, pagination.limit)
      orders = await transform.paginate(orders, Transformer)
      return response.send(orders)
    } catch (error) {
      return response.send({ message: 'Não foi possível listar os pedidos' })
    }


  }

  /**
   * Render a form to be used for creating a new order.
   * GET orders/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create({ request, response, view }) {
  }

  /**
   * Create/save a new order.
   * POST orders
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response, transform }) {
    const trx = await Database.beginTransaction()
    try {
      const { user_id, items, status } = request.all()

      var order = await Order.create({ user_id, status }, trx)
      const service = new Service(order, trx)

      if (items && items.length > 0) {
        await service.syncItems(items)
      }
      await trx.commit()
      order = await Order.find(order.id) // Vai buscar as informações do pedido para que dispare os hooks dos calculos de desconto, subtotal, etc.
      order = await transform.include('user,items').item(order, Transformer)
      return response.status(201).send(order)
    } catch (error) {
      await trx.rollback()
      return response.status(400).send({ message: 'Não foi possível criar o pedido' })
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
  async show({ params, request, response, transform }) {
    try {
      var order = await Order.findOrFail(params.id)
      order = await transform.include('items,user,discounts,coupons').item(order, Transformer)
      return response.send(order)
    } catch (error) {
      return response.send({ message: 'Não foi possível exibir o pedido' })
    }

  }

  /**
   * Render a form to update an existing order.
   * GET orders/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit({ params, request, response, view }) {
  }

  /**
   * Update order details.
   * PUT or PATCH orders/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response, transform }) {
    var order = await Order.findOrFail(params.id)
    const trx = await Database.beginTransaction()
    try {
      const { user_id, items, status } = request.all()
      order.merge({ user_id, status })
      const service = new Service(order, trx)
      await service.updateItems(items)
      await order.save()
      trx.commit()
      order = await transform.include('items,user,discounts,coupons').item(order, Transformer)
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
    const order = await Order.findOrFail(params.id)

    //Deletar os relacionamentos (Conforme tem no model)
    const trx = await Database.beginTransaction()
    try {
      await order.items().delete(trx)
      await order.coupons().delete(trx)
      // Não precisa do discount pois ele ja esta relacionado com o coupon
      //O user nao precisa porque ele tem um campo
      await order.delete(trx)
      await trx.commit()
      return response.status(204).send({ success: true })
    } catch (error) {
      await trx.rollback()
      return response.status(400).send({ message: 'Não foi possível deletar o pedido' })
    }
  }

  async applyDiscount({ params, request, response, transform }) {
    const { code } = request.all() // Código do desconto
    const coupon = await Coupon.findByOrFail('code', code.toUpperCase()) // o 'By' é quando compara com outro campo que não é primarykey, pegando apenas um registro
    var order = await Order.findOrFail(params.id)

    var discount, info = {}

    try {
      const service = new Service(order)
      const canAddDiscount = await service.canApplyDiscount(coupon) // Verifica se pode aplicar o cupom ao pedido atual
      const orderDiscounts = await order.coupons().getCount()  // Verifica se ja houve algum disconto

      const canApplyToOrder = orderDiscounts < 1 || (orderDiscounts >= 1 && coupon.recursive) // Verifica se ainda não existe cupom aplicado ao pedido ou se existe cupom aplicado mas pode ser aplicado mais de uma vez (recursive)

      if (canAddDiscount && canApplyToOrder) {
        const discount = await Discount.findOrCreate({  // Verifica se nao vai ser aplicado um duplo cupom
          order_id: order.id,
          coupon_id: coupon.id
        })
        info.message = 'Cupom aplicado com sucesso'
        info.success = true
      } else {
        info.message = 'Não foi possível aplicar o cupom'
        info.success = false
      }
      order = await transform.include('items,user,discounts,coupons').item(order, Transformer)
      return response.send({ order, info })
    } catch (error) {
      return response.status(400).send({ message: 'Erro ao aplicar o cupom' })
    }
  }


  async removeDiscount({ params, request, response }) {
    const { discount_id } = request.all()
    try {
      const discount = await Discount.findOrFail(discount_id)
      await discount.delete()
      return response.status(204).send()
    } catch (error) {
      return response.send({ message: 'Erro ao remover cupom' })
    }
  }

}


module.exports = OrderController
