'use strict'

class AdminStoreUser {
  get rules () {
    let userId = this.ctx.params.id 
    let rule = ''

    // se preencher entao o usuario está sendo atualizado
    if (userId) { // A rota users.update entra aqui
      rule `unique:users,email,id,${userId}` // Verifica se o email é unico comparando o id, sendo o mesmo id que foi passado como parametro entao ignora já que é uma atualização
    } else { // A rota users.store entra aqui
      rule `unique:users,email|required` //
    }

    return {
      // validation rules
      email: rule,
      image_id: 'exists:images,id'
    }
  }
}

module.exports = AdminStoreUser
