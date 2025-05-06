const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http'); // For WebSocket integration
const { Server } = require('socket.io'); // WebSocket library
const jwt = require('jsonwebtoken');


const authRoutes = require('./routes/auth');
const ordersRoutes = require('./routes/orders');
const priListaRoutes = require('./routes/pri-lista');
const lagerplatsRoute = require('./routes/lagerplats');
const kantListaRoutes = require('./routes/kant-lista');
const kluppListaRoutes = require('./routes/klupp-lista');
const logRoutes = require('./routes/log'); // Import the log routes
const authenticateToken = require('./routes/authMiddleware'); // Import the middleware

dotenv.config();
connectDB();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://elan19.github.io/',
  process.env.FRONTEND_URL,
];

// Create the Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // Update this to match your frontend URL
    methods: ["GET", "POST", "PUT"],
  },
});

app.set('io', io);

const corsOptions = {
  origin: allowedOrigins, // Your frontend URL
  credentials: true, // Allow cookies to be sent
};

app.use(cors(corsOptions));

app.use(express.json()); // Middleware to parse JSON

// WebSocket Connection
io.use((socket, next) => {
  const token = socket.handshake.auth.token; // Get token from handshake auth object
  
  if (!token) {
    console.log("No token found, disconnecting socket.");
    return next(new Error("Authentication error"));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log("Invalid or expired token, disconnecting socket.");
      return next(new Error("Authentication error"));
    }

    // Attach user to the socket object for use in event handlers
    socket.user = user;
    console.log("Authenticated socket with ID:", socket.id);
    next(); // Proceed with the connection
  });
});

io.on("connection", (socket) => {
  console.log("Connected to server with ID:", socket.id);
  
  // Now you can use socket.user to access authenticated user data
  socket.on("some-event", (data) => {
    // You can use socket.user here to access user data
  });
});

io.on("disconnect", () => {
    console.log("Disconnected from server.");
});

// Middleware to emit order updates
app.use((req, res, next) => {
  res.locals.io = io;
  next();
});

// Routes
app.get('/', (req, res) => {
  res.send('Server is running');
});

app.use('/api/auth', authRoutes);


// Apply the middleware to protect the routes
app.use('/api/orders', authenticateToken, ordersRoutes);
app.use('/api/prilista', authenticateToken, priListaRoutes);
app.use('/api/lagerplats', authenticateToken, lagerplatsRoute);
app.use('/api/kantlista', authenticateToken, kantListaRoutes);
app.use('/api/klupplista', authenticateToken, kluppListaRoutes);
app.use('/api/log', authenticateToken, logRoutes); // Add authentication here as well

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
