process.env.TESTENV = true

let Message = require('../app/models/message.js')
let User = require('../app/models/user')

const crypto = require('crypto')

let chai = require('chai')
let chaiHttp = require('chai-http')
let server = require('../server')
chai.should()

chai.use(chaiHttp)

const token = crypto.randomBytes(16).toString('hex')
let userId
let messageId

describe('Messages', () => {
  const messageParams = {
    title: '13 JavaScript tricks WDI instructors don\'t want you to know',
    text: 'You won\'believe number 8!'
  }

  before(done => {
    Message.deleteMany({})
      .then(() => User.create({
        email: 'caleb1',
        hashedPassword: '12345',
        token
      }))
      .then(user => {
        userId = user._id
        return user
      })
      .then(() => Message.create(Object.assign(messageParams, {owner: userId})))
      .then(record => {
        messageId = record._id
        done()
      })
      .catch(console.error)
  })

  describe('GET /messages', () => {
    it('should get all the messages', done => {
      chai.request(server)
        .get('/messages')
        .set('Authorization', `Token token=${token}`)
        .end((e, res) => {
          res.should.have.status(200)
          res.body.messages.should.be.a('array')
          res.body.messages.length.should.be.eql(1)
          done()
        })
    })
  })

  describe('GET /messages/:id', () => {
    it('should get one message', done => {
      chai.request(server)
        .get('/messages/' + messageId)
        .set('Authorization', `Token token=${token}`)
        .end((e, res) => {
          res.should.have.status(200)
          res.body.message.should.be.a('object')
          res.body.message.title.should.eql(messageParams.title)
          done()
        })
    })
  })

  describe('DELETE /messages/:id', () => {
    let messageId

    before(done => {
      Message.create(Object.assign(messageParams, { owner: userId }))
        .then(record => {
          messageId = record._id
          done()
        })
        .catch(console.error)
    })

    it('must be owned by the user', done => {
      chai.request(server)
        .delete('/messages/' + messageId)
        .set('Authorization', `Bearer notarealtoken`)
        .end((e, res) => {
          res.should.have.status(401)
          done()
        })
    })

    it('should be succesful if you own the resource', done => {
      chai.request(server)
        .delete('/messages/' + messageId)
        .set('Authorization', `Bearer ${token}`)
        .end((e, res) => {
          res.should.have.status(204)
          done()
        })
    })

    it('should return 404 if the resource doesn\'t exist', done => {
      chai.request(server)
        .delete('/messages/' + messageId)
        .set('Authorization', `Bearer ${token}`)
        .end((e, res) => {
          res.should.have.status(404)
          done()
        })
    })
  })

  describe('POST /messages', () => {
    it('should not POST an message without a title', done => {
      let noTitle = {
        text: 'Untitled',
        owner: 'fakedID'
      }
      chai.request(server)
        .post('/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: noTitle })
        .end((e, res) => {
          res.should.have.status(422)
          res.should.be.a('object')
          done()
        })
    })

    it('should not POST an message without text', done => {
      let noText = {
        title: 'Not a very good message, is it?',
        owner: 'fakeID'
      }
      chai.request(server)
        .post('/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: noText })
        .end((e, res) => {
          res.should.have.status(422)
          res.should.be.a('object')
          done()
        })
    })

    it('should not allow a POST from an unauthenticated user', done => {
      chai.request(server)
        .post('/messages')
        .send({ message: messageParams })
        .end((e, res) => {
          res.should.have.status(401)
          done()
        })
    })

    it('should POST an message with the correct params', done => {
      let validMessage = {
        title: 'I ran a shell command. You won\'t believe what happened next!',
        text: 'it was rm -rf / --no-preserve-root'
      }
      chai.request(server)
        .post('/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: validMessage })
        .end((e, res) => {
          res.should.have.status(201)
          res.body.should.be.a('object')
          res.body.should.have.property('message')
          res.body.message.should.have.property('title')
          res.body.message.title.should.eql(validMessage.title)
          done()
        })
    })
  })

  describe('PATCH /messages/:id', () => {
    let messageId

    const fields = {
      title: 'Find out which HTTP status code is your spirit animal',
      text: 'Take this 4 question quiz to find out!'
    }

    before(async function () {
      const record = await Message.create(Object.assign(messageParams, { owner: userId }))
      messageId = record._id
    })

    it('must be owned by the user', done => {
      chai.request(server)
        .patch('/messages/' + messageId)
        .set('Authorization', `Bearer notarealtoken`)
        .send({ message: fields })
        .end((e, res) => {
          res.should.have.status(401)
          done()
        })
    })

    it('should update fields when PATCHed', done => {
      chai.request(server)
        .patch(`/messages/${messageId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ message: fields })
        .end((e, res) => {
          res.should.have.status(204)
          done()
        })
    })

    it('shows the updated resource when fetched with GET', done => {
      chai.request(server)
        .get(`/messages/${messageId}`)
        .set('Authorization', `Bearer ${token}`)
        .end((e, res) => {
          res.should.have.status(200)
          res.body.should.be.a('object')
          res.body.message.title.should.eql(fields.title)
          res.body.message.text.should.eql(fields.text)
          done()
        })
    })

    it('doesn\'t overwrite fields with empty strings', done => {
      chai.request(server)
        .patch(`/messages/${messageId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ message: { text: '' } })
        .then(() => {
          chai.request(server)
            .get(`/messages/${messageId}`)
            .set('Authorization', `Bearer ${token}`)
            .end((e, res) => {
              res.should.have.status(200)
              res.body.should.be.a('object')
              // console.log(res.body.message.text)
              res.body.message.title.should.eql(fields.title)
              res.body.message.text.should.eql(fields.text)
              done()
            })
        })
    })
  })
})
