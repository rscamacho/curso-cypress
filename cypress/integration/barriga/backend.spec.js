/// <reference types='cypress' />

import formatDateString from "../../support/formatDateString"

describe('Should test at a functional level', () => {
    before(() => {
        cy.getToken('umemailqualquer@gmail.com', 'b!!^9@bK')
    })
    
    beforeEach(() => {
        cy.resetRest()
    })

    it('Should create an account', () => {
        cy.request({
            method: 'POST',
            url: '/contas',
            body: {
                nome: 'Nova conta criada'
            }
        }).as('response')

        cy.get('@response').then(res => {
            expect(res.status).to.be.equal(201)
            expect(res.body).to.have.property('id')
            expect(res.body).to.have.property('nome', 'Nova conta criada')
        })
    })

    it('Should edit an account', () => {
        cy.getAccountByName('Conta para alterar')
            .then( ([ conta ]) => {
                cy.request({
                    method: 'PUT',
                    url: `/contas/${conta.id}`,
                    body: {
                        nome: 'Conta para alterada via API'
                    }
                }).as('response')
            })
        
        cy.get('@response').then(({ status, body: conta }) => {
            expect(status).to.be.equal(200)
            expect(conta.nome).to.be.equal('Conta para alterada via API')
        })
    })

    it('Should not create an account with same name', () => {
        cy.request({
            method: 'POST',
            url: '/contas',
            body: {
                nome: 'Conta para alterar'
            },
            failOnStatusCode: false
        }).as('response')

        cy.get('@response').then(({status, body}) => {
            expect(status).to.be.equal(400)
            expect(body.error).to.be.equal('Já existe uma conta com esse nome!')
        })
    })

    it('Should create a transaction', () => {
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        
        const transacao = {
            tipo: "REC",
            status: true,
            conta_id: undefined,
            descricao: "Transacao inseria via API",
            valor: 32.99,
            envolvido: "Nome do interessado",
            data_transacao: formatDateString(today, 'DD/MM/YYYY'),
            data_pagamento: formatDateString(tomorrow, 'DD/MM/YYYY')
        }

        cy.getAccountByName('Conta para movimentacoes')
            .then( ([ conta ]) => {
                transacao.conta_id = conta.id
            })
        
        cy.request({
            method: 'POST',
            url: '/transacoes',
            body: transacao
        }).as('response')
        .then(({ status, body }) => {
            expect(status).to.be.equal(201)
            expect(body.descricao).to.be.equal(transacao.descricao)
            expect(body.valor).to.be.equal(`${transacao.valor}`)
        })
    })

    it('Should edit a transaction and get balance', () => {
        const contaParaBuscar = 'Conta para saldo'
        const movimentacao = 'Movimentacao 1, calculo saldo'
        const saldoAntes = '534.00'
        const saldoDepois = '4034.00'

        let contaRecuperada;
        let transacaoRecuperada;

        cy.request({
            method: 'GET',
            url: '/saldo'
        })
        .then(({ status, body }) => {
            expect(status).to.be.equal(200)
            contaRecuperada = body.find(conta => conta.conta === contaParaBuscar)
            expect(contaRecuperada.saldo).to.be.equal(saldoAntes)
        }).as('preCheck')
        
        cy.request({
            method: 'GET',
            url: '/transacoes',
            qs: { descricao: movimentacao }
        }).then(({status, body: [transacao]}) => {
            expect(status).to.be.equal(200)
            transacaoRecuperada = transacao
        }).then(() => {
            cy.request({
                method: 'PUT',
                url: `/transacoes/${transacaoRecuperada.id}`,
                body: {
                    ...transacaoRecuperada,
                    data_transacao: formatDateString(
                        new Date(transacaoRecuperada.data_transacao),
                        'DD/MM/YYYY'
                    ),
                    data_pagamento: formatDateString(
                        new Date(transacaoRecuperada.data_pagamento),
                        'DD/MM/YYYY'
                    ),
                    status: true
                }
            }).its('status').should('be.equal', 200)
        })

        cy.request({
            method: 'GET',
            url: '/saldo'
        })
        .then(({ status, body }) => {
            expect(status).to.be.equal(200)
            contaRecuperada = body.find(conta => conta.conta === contaParaBuscar)
            expect(contaRecuperada.saldo).to.be.equal(saldoDepois)
        }).as('postCheck')
    })

    it('Should delete a transaction', () => {
        const contaParaBuscar = 'Conta para saldo'
        const movimentacao = 'Movimentacao 2, calculo saldo'
        const saldoAntes = '534.00'
        const saldoDepois = '1534.00'

        let contaRecuperada;
        let transacaoRecuperada;

        cy.request({
            method: 'GET',
            url: '/saldo'
        })
        .then(({ status, body }) => {
            expect(status).to.be.equal(200)
            contaRecuperada = body.find(conta => conta.conta === contaParaBuscar)
            expect(contaRecuperada.saldo).to.be.equal(saldoAntes)
        }).as('preCheck')
        
        cy.request({
            method: 'GET',
            url: '/transacoes',
            qs: { descricao: movimentacao }
        }).then(({status, body: [transacao]}) => {
            expect(status).to.be.equal(200)
            transacaoRecuperada = transacao
        }).then(() => {
            cy.request({
                method: 'DELETE',
                url: `/transacoes/${transacaoRecuperada.id}`
            }).its('status').should('be.equal', 204)
        })

        cy.request({
            method: 'GET',
            url: '/saldo'
        })
        .then(({ status, body }) => {
            expect(status).to.be.equal(200)
            contaRecuperada = body.find(conta => conta.conta === contaParaBuscar)
            expect(contaRecuperada.saldo).to.be.equal(saldoDepois)
        }).as('postCheck')
    })
})