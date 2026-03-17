require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/carbooking';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.log('MongoDB connection error:', err));

// Routes
// Mock endpoint to fetch prices across platforms based on mode
app.get('/api/quotes', (req, res) => {
  const { source, destination, mode } = req.query;
  // Generate a mock distance
  const mockDistanceKm = Math.floor(Math.random() * 20) + 5; 

  const baseRates = {
    'Bike': 4,
    'Auto': 6,
    'Auto Priority': 8,
    'Car Economy': 10,
    'Car Priority': 13,
    'Car Premium': 16,
    'Cab XL': 20,
    'Auto Pet': 9
  };

  const selectedRate = baseRates[mode] || 10;

  const quotes = [
    { provider: 'Our Platform', price: Math.floor(mockDistanceKm * selectedRate), timeStr: '5 mins' },
    { provider: 'Ola', price: Math.floor(mockDistanceKm * selectedRate * 1.15), timeStr: '8 mins' },
    { provider: 'Uber', price: Math.floor(mockDistanceKm * selectedRate * 1.2), timeStr: '7 mins' },
    { provider: 'Rapido', price: Math.floor(mockDistanceKm * selectedRate * 0.95), timeStr: '4 mins' }
  ];

  res.json({ distance: mockDistanceKm, mode, quotes });
});

// Mock endpoint for intercity trips
app.get('/api/intercity', (req, res) => {
  const options = [
    { mode: 'Bus', provider: 'RedBus', price: 800, duration: '6 hours' },
    { mode: 'Train', provider: 'IRCTC', price: 400, duration: '8 hours' },
    { mode: 'Flight', provider: 'IndiGo', price: 3500, duration: '1.5 hours' },
    { mode: 'Cab', provider: 'Our Platform Intercity', price: 2500, duration: '5 hours' }
  ];
  res.json({ options });
});

// A simple profile mock API
app.get('/api/user', (req, res) => {
  res.json({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+91 9876543210',
    preferredLanguage: 'en',
    rides: 12
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
