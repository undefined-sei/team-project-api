const mongoose = require('mongoose')


const messageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    autopopulate: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: false
  }
}, {
  timestamps: true
})

messageSchema.plugin(require('mongoose-autopopulate'))

module.exports = mongoose.model('Message', messageSchema)
