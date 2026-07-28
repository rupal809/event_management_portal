const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB, getDbStatus } = require('./config/db');

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Import Mongoose Models
const Event = require('./models/Event');
const Registration = require('./models/Registration');

// Mock database arrays for testing without a running MongoDB local service
let MOCK_EVENTS = [
  {
    _id: "evt-001",
    title: "NextGen Web Summit 2026",
    category: "Conference",
    date: "2026-09-15",
    time: "09:00",
    location: "Metropolitan Tech Center, San Francisco, CA",
    capacity: 250,
    price: 199.00,
    banner: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop&q=80",
    description: "Join industry leaders and developers worldwide to discuss the future of the decentralized web, next-generation frameworks, CSS Houdini, and advanced performance optimizations.",
    tags: ["tech", "frontend", "nextjs", "performance"]
  },
  {
    _id: "evt-002",
    title: "Generative AI Developers Workshop",
    category: "Workshop",
    date: "2026-10-02",
    time: "10:30",
    location: "Silicon Valley Innovation Lab, San Jose, CA",
    capacity: 60,
    price: 299.00,
    banner: "https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=600&auto=format&fit=crop&q=80",
    description: "A hands-on technical workshop focused on integrating large language models, training vector indexes, tuning prompts, and deploying autonomous agent systems securely.",
    tags: ["ai", "python", "agents", "machine-learning"]
  },
  {
    _id: "evt-003",
    title: "Creative UI/UX & Glassmorphism Design",
    category: "Webinar",
    date: "2026-08-20",
    time: "15:00",
    location: "Zoom Virtual Broadcast Room 4",
    capacity: 500,
    price: 0.00,
    banner: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=80",
    description: "Learn custom layout design, CSS variables architectures, HSL-based styling, glassmorphic backdrop-filter behaviors, and micro-interaction animations that elevate standard web projects.",
    tags: ["design", "css", "figma", "usability"]
  },
  {
    _id: "evt-004",
    title: "Distributed Cloud Architecture Seminar",
    category: "Conference",
    date: "2026-11-12",
    time: "09:30",
    location: "Grand Cloud Hall & Online Stream",
    capacity: 150,
    price: 89.50,
    banner: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80",
    description: "Explore advanced multi-region architectures, serverless runtimes, high-availability data systems, edge computing structures, and disaster recovery strategies.",
    tags: ["cloud", "devops", "kubernetes", "security"]
  },
  {
    _id: "evt-005",
    title: "Global Developer Social & Networking Party",
    category: "Party",
    date: "2026-09-16",
    time: "19:00",
    location: "The Neon Rooftop Lounge, San Francisco, CA",
    capacity: 200,
    price: 25.00,
    banner: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600&auto=format&fit=crop&q=80",
    description: "After-hours social event following the Web Summit. Mingle with developers, startup founders, and design specialists. Refreshments, live music, and mocktail bars included.",
    tags: ["networking", "social", "community"]
  }
];

let MOCK_REGISTRATIONS = [
  {
    _id: "reg-9281",
    eventId: "evt-001",
    name: "Alex Rivera",
    email: "alex@example.com",
    ticketType: "VIP",
    pricePaid: 298.50,
    dateRegistered: "2026-07-25T14:32:00.000Z",
    checkedIn: true
  },
  {
    _id: "reg-4829",
    eventId: "evt-001",
    name: "Sophia Chen",
    email: "sophia@example.com",
    ticketType: "Standard",
    pricePaid: 199.00,
    dateRegistered: "2026-07-26T09:12:00.000Z",
    checkedIn: false
  },
  {
    _id: "reg-1082",
    eventId: "evt-002",
    name: "Marcus Vance",
    email: "marcus@example.com",
    ticketType: "Standard",
    pricePaid: 299.00,
    dateRegistered: "2026-07-24T18:45:00.000Z",
    checkedIn: true
  },
  {
    _id: "reg-3041",
    eventId: "evt-003",
    name: "Elena Rostova",
    email: "elena@example.com",
    ticketType: "Standard",
    pricePaid: 0.00,
    dateRegistered: "2026-07-27T11:20:00.000Z",
    checkedIn: false
  },
  {
    _id: "reg-7592",
    eventId: "evt-004",
    name: "Devon Miller",
    email: "devon@example.com",
    ticketType: "Early Bird",
    pricePaid: 76.08,
    dateRegistered: "2026-07-26T16:05:00.000Z",
    checkedIn: false
  }
];

// Database mode toggle helper
const useMock = () => !getDbStatus();

// API Endpoints
// Check system status
app.get('/api/status', (req, res) => {
  res.json({
    status: "online",
    database: useMock() ? "simulated-in-memory" : "mongodb-connected",
    timestamp: new Date()
  });
});

// --- EVENTS ROUTING ---

// 1. GET ALL EVENTS
app.get('/api/events', async (req, res) => {
  try {
    if (useMock()) {
      return res.json(MOCK_EVENTS);
    }
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. CREATE A NEW EVENT
app.post('/api/events', async (req, res) => {
  try {
    const { title, category, date, time, location, capacity, price, banner, description, tags } = req.body;
    
    // Parse values
    const eventTags = typeof tags === 'string' 
      ? tags.split(',').map(t => t.trim()).filter(t => t) 
      : tags || [];

    const newEventData = {
      title,
      category,
      date,
      time,
      location,
      capacity: parseInt(capacity) || 50,
      price: parseFloat(price) || 0,
      banner: banner || '',
      description,
      tags: eventTags
    };

    if (useMock()) {
      const mockEvent = {
        _id: "evt-" + Math.floor(1000 + Math.random() * 9000),
        ...newEventData
      };
      MOCK_EVENTS.push(mockEvent);
      return res.status(201).json(mockEvent);
    }

    const event = await Event.create(newEventData);
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 3. UPDATE AN EVENT
app.put('/api/events/:id', async (req, res) => {
  try {
    const { title, category, date, time, location, capacity, price, banner, description, tags } = req.body;
    
    const eventTags = typeof tags === 'string' 
      ? tags.split(',').map(t => t.trim()).filter(t => t) 
      : tags || [];

    const updatedData = {
      title,
      category,
      date,
      time,
      location,
      capacity: parseInt(capacity) || 50,
      price: parseFloat(price) || 0,
      banner: banner || '',
      description,
      tags: eventTags
    };

    if (useMock()) {
      const index = MOCK_EVENTS.findIndex(e => e._id === req.params.id);
      if (index === -1) return res.status(404).json({ error: 'Event not found' });
      MOCK_EVENTS[index] = { ...MOCK_EVENTS[index], ...updatedData };
      return res.json(MOCK_EVENTS[index]);
    }

    const event = await Event.findByIdAndUpdate(req.params.id, updatedData, { new: true, runValidators: true });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 4. DELETE AN EVENT (Cascade registrations removal)
app.delete('/api/events/:id', async (req, res) => {
  try {
    if (useMock()) {
      MOCK_EVENTS = MOCK_EVENTS.filter(e => e._id !== req.params.id);
      MOCK_REGISTRATIONS = MOCK_REGISTRATIONS.filter(r => r.eventId !== req.params.id);
      return res.json({ success: true, message: "Event & Registrations purged." });
    }

    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    // Cascade delete registrations associated with this event
    await Registration.deleteMany({ eventId: req.params.id });
    
    res.json({ success: true, message: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- REGISTRATIONS ROUTING ---

// 1. GET ALL REGISTRATIONS
app.get('/api/registrations', async (req, res) => {
  try {
    if (useMock()) {
      return res.json(MOCK_REGISTRATIONS);
    }
    const regs = await Registration.find().sort({ createdAt: -1 });
    res.json(regs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. CREATE A REGISTRATION (Seats check & dynamic pricing)
app.post('/api/registrations', async (req, res) => {
  try {
    const { eventId, name, email, ticketType } = req.body;
    
    let event;
    let currentRegsCount = 0;

    // Check capacity depending on database mode
    if (useMock()) {
      event = MOCK_EVENTS.find(e => e._id === eventId);
      if (!event) return res.status(404).json({ error: 'Event not found' });
      currentRegsCount = MOCK_REGISTRATIONS.filter(r => r.eventId === eventId).length;
    } else {
      event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ error: 'Event not found' });
      currentRegsCount = await Registration.countDocuments({ eventId });
    }

    if (currentRegsCount >= event.capacity) {
      return res.status(400).json({ error: 'Event has reached maximum seat capacity limit.' });
    }

    // Pricing math
    let finalPrice = event.price;
    if (ticketType === "VIP") {
      finalPrice = event.price * 1.5;
    } else if (ticketType === "Early Bird") {
      finalPrice = event.price * 0.85;
    }
    finalPrice = parseFloat(finalPrice.toFixed(2));

    const registrationData = {
      eventId,
      name,
      email,
      ticketType,
      pricePaid: finalPrice,
      checkedIn: false
    };

    if (useMock()) {
      const mockReg = {
        _id: "reg-" + Math.floor(1000 + Math.random() * 9000),
        dateRegistered: new Date().toISOString(),
        ...registrationData
      };
      MOCK_REGISTRATIONS.push(mockReg);
      return res.status(201).json(mockReg);
    }

    const reg = await Registration.create(registrationData);
    res.status(201).json(reg);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 3. TOGGLE CHECK-IN STATUS
app.put('/api/registrations/:id/checkin', async (req, res) => {
  try {
    if (useMock()) {
      const index = MOCK_REGISTRATIONS.findIndex(r => r._id === req.params.id);
      if (index === -1) return res.status(404).json({ error: 'Registration not found' });
      MOCK_REGISTRATIONS[index].checkedIn = !MOCK_REGISTRATIONS[index].checkedIn;
      return res.json(MOCK_REGISTRATIONS[index]);
    }

    const reg = await Registration.findById(req.params.id);
    if (!reg) return res.status(404).json({ error: 'Registration not found' });
    
    reg.checkedIn = !reg.checkedIn;
    await reg.save();
    
    res.json(reg);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 4. CANCEL/DELETE A REGISTRATION
app.delete('/api/registrations/:id', async (req, res) => {
  try {
    if (useMock()) {
      MOCK_REGISTRATIONS = MOCK_REGISTRATIONS.filter(r => r._id !== req.params.id);
      return res.json({ success: true, message: "Registration cancelled." });
    }

    const reg = await Registration.findByIdAndDelete(req.params.id);
    if (!reg) return res.status(404).json({ error: 'Registration not found' });
    
    res.json({ success: true, message: "Registration cancelled successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await connectDB();
});
