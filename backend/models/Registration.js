const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({
  eventId: {
    type: String, // String to easily support both mongoose ObjectIds and string identifiers
    required: [true, 'Please specify an event ID']
  },
  name: {
    type: String,
    required: [true, 'Please add attendee name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add attendee email address'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  ticketType: {
    type: String,
    required: [true, 'Please specify a ticket type'],
    enum: ['Standard', 'VIP', 'Early Bird']
  },
  pricePaid: {
    type: Number,
    required: [true, 'Please specify price paid'],
    min: [0, 'Price paid cannot be negative']
  },
  dateRegistered: {
    type: Date,
    default: Date.now
  },
  checkedIn: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Registration', RegistrationSchema);
