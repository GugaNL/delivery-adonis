'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Coupon = use('App/Models/Coupon')
const Database = use('Database')
const Service = use('App/Services/Coupon/CouponService')
const Transformer = use('App/Transformers/Admin/CouponTransformer')



/**
 * Resourceful controller for interacting with coupons
 */
class CouponController {
  /**
   * Show a list of all coupons.
   * GET coupons
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {object} ctx.pagination
   */
  async index({ request, response, pagination, transform }) {
    try {
      const query = Coupon.query()
      const code = request.input('code')

      if (code) {
        query.where('code', 'LIKE', `%${code}%`)
      }

      var coupons = await query.paginate(pagination.page, pagination.limit)
      coupons = await transform.paginate(coupons, Transformer)
      return response.send(coupons)
    } catch (error) {
      return response.send({ message: 'Não foi possível listar os cupons' })
    }
  }

  /**
   * Render a form to be used for creating a new coupon.
   * GET coupons/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create({ request, response, view }) {

  }

  /**
   * Create/save a new coupon.
   * POST coupons
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response, transform }) {
    /**
     * 1 - product - O cupom pode ser usado apenas em produtos específicos
     * 2 - clients - pode ser utilizado apenas por clientes específicos
     * 3 - clients e products - pode ser utilizado somente em clientes e produtos específicos
     * 4 - Pode ser utilizado por qualquer cliente em qualquer pedido 
     */

    var canUseFor = { client: false, product: false }
    const trx = await Database.beginTransaction()

    try {
      const couponData = request.only(['code', 'discount', 'valid_from', 'valid_until', 'quantity', 'type'])
      const { users, produtcs } = request.only(['users', 'products'])
      var coupon = await Coupon.create(couponData, trx)

      //Starts service layer
      const service = new Service(coupon, trx)

      // Insere os relacionamentos no DB
      if (users && users.length > 0) { // O admin passou alguns clientes e só para eles que servirá o cupom
        await service.syncUsers(users)
        canUseFor.client = true
      }

      if (produtcs && produtcs.length > 0) { // O admin passou alguns produtos e só para eles que servirá o cupom
        await service.syncProducts(produtcs)
        canUseFor.product = true
      }

      if (canUseFor.client && canUseFor.product) {
        coupon.can_use_for = 'product_client'
      } else if (canUseFor.product && !canUseFor.client) {
        coupon.can_use_for = 'product'
      } else if (!canUseFor.product && canUseFor.client) {
        coupon.can_use_for = 'client'
      } else {
        coupon.can_use_for = 'all'
      }

      await coupon.save(trx)
      await trx.commit()
      coupon = await transform.include('users,products').item(coupon, Transformer)
      return response.status(201).send(coupon)
    } catch (error) {
      await trx.rollback()
      return response.status(400).send({ message: 'Não foi possível criar o cupom' })
    }
  }

  /**
   * Display a single coupon.
   * GET coupons/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, transform }) {
    try {
      var coupon = await Coupon.findOrFail(params.id)
      coupon = await transform.include('products,users,orders').item(coupon, Transformer)
      return response.send(coupon)
    } catch (error) {
      return response.send({ message: 'Não foi possível recuperar o cupom' })
    }
  }

  /**
   * Render a form to update an existing coupon.
   * GET coupons/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit({ params, request, response, view }) {
  }

  /**
   * Update coupon details.
   * PUT or PATCH coupons/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response, transform }) {
    const trx = await Database.beginTransaction()
    var coupon = await Coupon.findOrFail(params.id)

    var canUseFor = { client: false, product: false }

    try {
      const couponData = request.only(['code', 'discount', 'valid_from', 'valid_until', 'quantity', 'type'])
      coupon.merge(couponData)

      const { users, products } = request.only(['users', 'products'])

      const service = new Service(coupon, trx)

      // Insere os relacionamentos no DB
      if (users && users.length > 0) {
        await service.syncUsers(users)
        canUseFor.client = true
      }

      if (products && products.length > 0) {
        await service.syncProducts(products)
        canUseFor.product = true
      }


      if (canUseFor.client && canUseFor.product) {
        coupon.can_use_for = 'product_client'
      } else if (canUseFor.product && !canUseFor.client) {
        coupon.can_use_for = 'product'
      } else if (!canUseFor.product && canUseFor.client) {
        coupon.can_use_for = 'client'
      } else {
        coupon.can_use_for = 'all'
      }

      await coupon.save(trx)
      await trx.commit()
      coupon = await transform.item(coupon, Transformer)
      return response.send(coupon)
    } catch (error) {
      await trx.rollback()
      return response.status(400).send({ message: 'Não foi possível alterar o cupom' })
    }
  }

  /**
   * Delete a coupon with id.
   * DELETE coupons/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {
    const trx = await Database.beginTransaction()
    const coupon = await Coupon.findOrFail(params.id)
    try {
      //Além de fazer o delete do cupom, também apaga os registros de relacionamentos
      await coupon.products().detach([], trx)
      await coupon.orders().detach([], trx)
      await coupon.users().detach([], trx)
      await coupon.delete(trx)
      await trx.commit()
      return response.status(204).send({ message: 'Success' })
    } catch (error) {
      await trx.rollback()
      return response.status(400).send({ message: 'Não foi possível deletar o cupom' })
    }
  }
}

module.exports = CouponController
