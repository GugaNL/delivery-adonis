'use strict'

/*
|--------------------------------------------------------------------------
| ClientSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')

const Role = use('Role')  // Não coloca o endereço completo do Role pois já foi definido um alias para isso em start/app.js

const User = use('App/Models/User')


class ClientSeeder {
  async run () {
      const role = await Role.findBy('slug', 'client') // Traz do banco as informações de acordo com o campo parametro slug, que foi setado como client

      const clients = await Factory.model('App/Models/User').createMany(20)

      console.log('Lista de clients no console: ', clients)
      
      await Promise.all(clients.map(async client => {
        await client.roles().attach([role.id]) // Mesmo passando só 1 tem que ser como array, e role.id porque quero apenas com role client
      }))

      
      const user = await User.create({ // Criando user sem papel(role) ainda
        name: 'Gustavo',
        surname: 'Lucena',
        email: 'gugakaruaru@gmail.com',
        password: 'secret'
      })

      const adminRole = await Role.findBy('slug', 'admin')
      await user.roles().attach([adminRole.id]) // Usa colchetes pois é passado como array, agora sim referencia esse user como role admin
  }
}

module.exports = ClientSeeder
