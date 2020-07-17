'use strict'

const UserTransformer = use('App/Transformers/Admin/UserTransformer')

class UserController {

    //Método que vai retornar as informações do usuário para exibir na pagina principal do dashboard
    async me({ response, transform, auth}) {
        var user = await auth.getUser() // Pega as informações do usuário logado
        const userData = await transform.item(user, UserTransformer)
        userData.roles = await user.getRoles() // Pega as credenciais do user
        return response.send(userData) 
    }

}

module.exports = UserController
