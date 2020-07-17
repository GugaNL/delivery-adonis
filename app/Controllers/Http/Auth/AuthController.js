'use strict'

const Database = use('Database')
const User = use('App/Models/User')
const Role = use('Role')
const Ws = use('Ws')

class AuthController {
    async register({ request, response }) {
        const trx = await Database.beginTransaction() // Criação da transaction

        try {
            const { name, surname, email, password } = request.all() // Retorna os dados enviados para a requisição
            const user = await User.create({ name, surname, email, password }, trx)
            const userRole = await Role.findBy('slug', 'client')
            await user.roles().attach([userRole.id], null, trx)  // Atribui a role para o user
            await trx.commit()
            const topic = Ws.getChannel('notifications').topic('notifications')
            if (topic) {
                topic.broadcast('new:user')
            }
            return response.status(201).send({ data: user }) // 201 é padrão restful
        } catch (error) {
            trx.rollback()
            return response.status(400).send({ message: 'Erro ao realizar cadastro' })  // 400 é padrão restful
        }
    }


    async login({ request, response, auth }) {
        const { email, password } = request.all()
        let data = await auth.withRefreshToken().attempt(email, password)
        return response.send({ data })
    }


    async refresh({ request, response, auth }) {
        let refresh_token = request.input('refreshToken') // o request input é outra forma de pegar o valor enviado a requisição

        if (!refresh_token) { // Caso nao seja enviado o token pelo body então pega do header
            refresh_token = request.header('refreshToken')
        }

        const user = await auth.newRefreshToken().generateForRefreshToken(refresh_token)  // Gera um novo token para o refresh_token acima
        return response.send({ data: user })
    }

    async logout({ request, response, auth }) {
        let refresh_token = request.input('refresh_token')

        if (!refresh_token) { // Caso nao seja enviado o token pelo body então pega do header
            refresh_token = request.header('refresh_token')
        }

        await auth.authenticator('jwt').revokeTokens([refresh_token], true)  // Deleta da base o token armazenado, pois nao vai precisar mais ao deslogar

        return response.status(204).send({})  // 204 informa ao usuario que nao tem body de retorno para enviar

    }

    async forgot({ request, response }) {
        //
    }

    async remember({ request, response }) {
        //
    }

    async reset({ request, response }) {
        //
    }

}

module.exports = AuthController
