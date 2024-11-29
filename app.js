const express = require("express");
const cors = require("cors");
const { port } = require("./src/config/config.js");
const authRoutes = require("./src/routes/auth.js");
const useremailroute = require("./src/routes/UserDetails.js");
const recipedataRotes = require("./src/routes/recipeData.js");
const authenticateToken = require("./src/middlewares/jwt_auth");
const http = require("http");
const path = require('path');

const app = express();

// Configure CORS
const corsOptions = {
  origin: ["http://localhost:5173", "https://0fpkc4g9-5173.inc1.devtunnels.ms"], // Specify your frontend URL
  methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
  allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
  credentials: true,
  optionsSuccessStatus: 200, // Ensure successful status for OPTIONS preflight
  maxAge: 6000, // Cache preflight response for 10 minutes
};

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api", authRoutes);
app.use("/api/data", authenticateToken, useremailroute, recipedataRotes);
app.use('/uploads', express.static(path.join(__dirname, 'src/uploads')));
// app.use("/api/test", authenticateToken, authRoutes);
// app.use("/api", projectRoutes);

const server = http.createServer(app);

// Increase server timeout to 20 minutes
server.timeout = 20 * 60 * 1000;

// Keep the connection alive for 2 minutes
server.keepAliveTimeout = 2 * 60 * 1000;
server.headersTimeout = 2 * 60 * 1000;

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
