'use strict'

class AuthRegister {
  get rules () {
    return {
      // validation rules
      name: 'required',
      surname: 'required',
      email: 'required|email|unique:users,email',
      password: 'required|confirmed' // confirmed porque vai validar com um campo chamado password_confirmed
    }
  }


  get messages() {
    return {
      'named.required': 'O nome é obrigatório',
      'surname.required': 'O sobrenome é obrigatório',
      'email.required': 'O email é obrigatório',
      'email.email': 'Email inválido',
      'email.unique': 'Email já cadastrado',
      'password.required': 'Senha obrigatória',
      'password.confirmed': 'As senhas não são iguais'
    }
  }

}

module.exports = AuthRegister
