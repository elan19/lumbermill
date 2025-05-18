const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http'); // For WebSocket integration
const { Server } = require('socket.io'); // WebSocket library
const jwt = require('jsonwebtoken');

const Role = require('./models/Role');

const authRoutes = require('./routes/auth');
const ordersRoutes = require('./routes/orders');
const priListaRoutes = require('./routes/pri-lista');
const lagerplatsRoute = require('./routes/lagerplats');
const kantListaRoutes = require('./routes/kant-lista');
const kluppListaRoutes = require('./routes/klupp-lista');
const logRoutes = require('./routes/log'); // Import the log routes
const authenticateToken = require('./routes/authMiddleware'); // Import the middleware
const adminRoutes = require('./routes/adminRoutes');

dotenv.config();
connectDB();

const devOrigins = ['http://localhost:3000', 'http://localhost:5000'];
const productionRegex = /^https:\/\/[a-zA-Z0-9-]+\.ansvabsagverk\.pages\.dev$/;
const frontendUrlFromEnv = process.env.FRONTEND_URL;

const allowedOrigins = [...devOrigins];
if (frontendUrlFromEnv) {
    allowedOrigins.push(frontendUrlFromEnv);
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || productionRegex.test(origin)) {
      callback(null, true); // Origin is allowed
    } else {
      console.warn(`CORS: Origin ${origin} not allowed.`);
      callback(new Error('Not allowed by CORS')); // Origin is not allowed
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], // Explicitly allow OPTIONS
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"], // Ensure Authorization is allowed
};

// Create the Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions
});

app.set('io', io);

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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
app.use('/api/admin', authenticateToken, adminRoutes);


/*const definedPermissions = [
  // Orders
  "orders:create", "orders:read", "orders:readOwn", "orders:update", "orders:delete", "orders:markDelivered",
  // Prilista
  "prilista:create", "prilista:read", "prilista:update", "prilista:delete", "prilista:markComplete", "prilista:reorder",
  // Kantlista
  "kantlista:create", "kantlista:read", "kantlista:update", "kantlista:delete", "kantlista:markComplete", "kantlista:reorder", "kantlista:toggleActive",
  // Klupplista
  "klupplista:create", "klupplista:read", "klupplista:update", "klupplista:delete", "klupplista:reorder", "klupplista:changeStatus",
  // Lagerplats
  "lagerplats:create", "lagerplats:read", "lagerplats:update", "lagerplats:delete",
  // Users (Admin only usually)
  "users:create", "users:read", "users:update", "users:delete", "users:manageRoles",
  // Settings
  "settings:read", "settings:update",
  // Admin Area
  "admin:access", // General access to admin sections
  "admin:managePermissions"
];

const rolesToSeed = [
  {
    name: 'admin',
    description: 'Administrator with full access.',
    permissions: definedPermissions, // Admin gets all defined permissions
  },
  {
    name: 'employee',
    description: 'Standard employee access.',
    permissions: [
      "orders:create", "orders:read", "orders:update",
      "prilista:create", "prilista:read", "prilista:update", "prilista:markComplete", "prilista:reorder",
      "kantlista:create", "kantlista:read", "kantlista:update", "kantlista:markComplete", "kantlista:reorder", "kantlista:toggleActive",
      "klupplista:create", "klupplista:read", "klupplista:update", "klupplista:changeStatus", "klupplista:reorder",
      "lagerplats:create", "lagerplats:read", "lagerplats:update", "lagerplats:delete",
      "settings:read", "settings:update", // Allow employees to change their own settings
    ],
  },
  {
    name: 'truck',
    description: 'Truck driver access, limited view.',
    permissions: [
      "orders:readOwn", // Example: Maybe only see orders assigned to them
      "orders:markDelivered",
      // Potentially read-only access to certain list types if needed for delivery
      "prilista:read",
      "kantlista:read",
    ],
  },
];*/

/*const seedDB = async () => {
  await connectDB();
  try {
    await Role.deleteMany({}); // Clear existing roles (optional, careful in production)
    console.log('Existing roles cleared.');

    for (const roleData of rolesToSeed) {
      const existingRole = await Role.findOne({ name: roleData.name });
      if (!existingRole) {
        const role = new Role(roleData);
        await role.save();
        console.log(`Role '${role.name}' created with ${role.permissions.length} permissions.`);
      } else {
        // Optionally update permissions for existing roles
        // existingRole.permissions = roleData.permissions;
        // await existingRole.save();
        // console.log(`Role '${roleData.name}' already exists. Permissions updated (if logic included).`);
        console.log(`Role '${roleData.name}' already exists. Skipping creation.`);

      }
    }
    console.log('Database seeded with roles and permissions!');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    mongoose.disconnect();
  }
};

seedDB();*/


// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
