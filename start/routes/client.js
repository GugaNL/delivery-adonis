'use strict'

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')

/**
 * Client routes
 */
Route.group(() => {

    /**
     * Product resource routes
     */
    //Route.get('products', 'ProductController.index').apiOnly() // O cliente vai apenas consumir o produto, nao vai cadastrar ou alterar
    //Route.get('products/:id', 'ProductController.show').apiOnly()
    Route.get('products', 'ProductController.index')
    Route.get('products/:id', 'ProductController.show')

    /**
     * Order resource routes
     */
    /*Route.get('orders', 'OrderController.index').apiOnly() // O cliente vai ter limitadas operações com o pedido
    Route.get('orders/:id', 'OrderController.show').apiOnly()
    Route.post('orders', 'OrderController.store').apiOnly()
    Route.post('orders/:id', 'OrderController.put').apiOnly()*/
    
    Route.get('listorders', 'OrderController.index').middleware(['auth'])
    Route.get('orders/:id', 'OrderController.show').middleware(['auth'])
    Route.post('orders', 'OrderController.store')
    Route.put('orders/:id', 'OrderController.put')

    // Obs.: O cliente nao deleta o pedido, apenas cancela, por isso nao foi implementado

}).prefix('v1') // apenas v1 porque o client nao vai acessar essa api por um painel, é apenas pra diferenciar a role de quem está acessando 
.namespace('Client')