'use strict'

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')

/**
 * Admin Routes
 */
Route.group(() => {

    /**
     * Category resources routes
     */
    // O resource ja cria os métodos principais de um CRUD
    Route.resource('categories', 'CategoryController').apiOnly()
    .validator(new Map([
       [['categories.store'], ['Admin/StoreCategory']],
       [['categories.update'], ['Admin/StoreCategory']]
    ]))  // Indica que essas 2 rotas (categories.store e categories.update) vao utilizar o validator

    /**
     * Products resource routes
     */
    Route.resource('products', 'ProductController').apiOnly()

    /**
     * Coupon resource routes
     */
    Route.resource('coupons', 'CouponController').apiOnly()

    /**
     * Order resource routes
     */
    Route.post('orders/:id/discount', 'OrderController.applyDiscount')  // Tem que vir antes do resource, pois após ele o adonis nao permite adicionar mais nada nesse prefixo
    Route.delete('orders/:id/discount', 'OrderController.removeDiscount')
    Route.resource('orders', 'OrderController').apiOnly().validator(new Map([
        [['orders.store'], ['Admin/StoreOrder']] // A primeira coluna é sempre a rota e a segunda coluna o metodo a ser utilizado
    ]))

    /**
     * Image resource routes
     */
    Route.resource('images', 'ImageController').apiOnly()

    /**
     * User resource routes
     */
    Route.resource('users', 'UserController').apiOnly().validator(new Map([
        [['users.store'], ['Admin/StoreUser']],
        [['users.update'], ['Admin/StoreUser']]
    ]))

    /**
     * Dashboard route
     */
    Route.get('dashboard', 'DashBoardController.index').as('dashboard')
})
.prefix('v1/admin')
.namespace('Admin')
.middleware(['auth', 'is:(admin || manager)']) //Middleare do ACL. Se for uma das duas roles (slug) então permite acessar