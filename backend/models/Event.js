const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add an event title'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: ['Conference', 'Webinar', 'Workshop', 'Meetup', 'Party']
  },
  date: {
    type: String,
    required: [true, 'Please add a date (YYYY-MM-DD)']
  },
  time: {
    type: String,
    required: [true, 'Please add a start time (HH:MM)']
  },
  location: {
    type: String,
    required: [true, 'Please specify a location or virtual URL']
  },
  capacity: {
    type: Number,
    required: [true, 'Please specify seat capacity'],
    min: [1, 'Capacity must be at least 1']
  },
  price: {
    type: Number,
    required: [true, 'Please specify ticket price'],
    min: [0, 'Price cannot be negative']
  },
  banner: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    required: [true, 'Please add an event description']
  },
  tags: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Event', EventSchema);
