const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const { Pool } = require("pg")
const Redis = require("ioredis")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { body, validationResult } = require("express-validator")
require("dotenv").config()

const app = express()
const PORT = process.env.PORT || 3001

// Database connection with better error handling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/finance_tracker",
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Redis connection with fallback for development
let redis = null
try {
  redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  })

  redis.on("error", (err) => {
    console.warn("Redis connection error (falling back to memory cache):", err.message)
    redis = null
  })

  redis.on("connect", () => {
    console.log("Redis connected successfully")
  })
} catch (error) {
  console.warn("Redis initialization failed, using memory cache:", error.message)
  redis = null
}

// In-memory cache fallback for development
const memoryCache = new Map()
const CACHE_TTL = 15 * 60 * 1000 // 15 minutes

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }),
)

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
)

app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: { error: "Too many authentication attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
})

const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 requests per hour
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
})

const analyticsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 requests per hour
  message: { error: "Too many analytics requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
})

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "Access token required" })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
    const user = await pool.query("SELECT id, email, name, role FROM users WHERE id = $1", [decoded.userId])

    if (user.rows.length === 0) {
      return res.status(401).json({ error: "Invalid token" })
    }

    req.user = user.rows[0]
    next()
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" })
  }
}

// Role-based access control middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" })
    }

    next()
  }
}

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array(),
    })
  }
  next()
}

// Cache helper functions with fallback
const getCacheKey = (prefix, userId, params = "") => {
  return `${prefix}:${userId}${params ? ":" + params : ""}`
}

const getFromCache = async (key) => {
  try {
    if (redis && redis.status === "ready") {
      const cached = await redis.get(key)
      return cached ? JSON.parse(cached) : null
    } else {
      // Fallback to memory cache
      const cached = memoryCache.get(key)
      if (cached && cached.expires > Date.now()) {
        return cached.data
      }
      memoryCache.delete(key)
      return null
    }
  } catch (error) {
    console.error("Cache get error:", error)
    return null
  }
}

const setCache = async (key, data, ttl = 900) => {
  try {
    if (redis && redis.status === "ready") {
      await redis.setex(key, ttl, JSON.stringify(data))
    } else {
      // Fallback to memory cache
      memoryCache.set(key, {
        data,
        expires: Date.now() + ttl * 1000,
      })
    }
  } catch (error) {
    console.error("Cache set error:", error)
  }
}

const invalidateCache = async (pattern) => {
  try {
    if (redis && redis.status === "ready") {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(keys)
      }
    } else {
      // Fallback to memory cache
      for (const key of memoryCache.keys()) {
        if (key.includes(pattern.replace("*", ""))) {
          memoryCache.delete(key)
        }
      }
    }
  } catch (error) {
    console.error("Cache invalidation error:", error)
  }
}

// Database initialization
const initializeDatabase = async () => {
  try {
    // Test database connection
    await pool.query("SELECT NOW()")
    console.log("Database connected successfully")

    // Create tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'read-only')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
        amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
        description VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        date DATE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `)

    // Insert demo users if they don't exist
    const adminExists = await pool.query("SELECT id FROM users WHERE email = 'admin@demo.com'")
    if (adminExists.rows.length === 0) {
      const hashedPassword = await bcrypt.hash("admin123", 12)
      await pool.query("INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)", [
        "Admin User",
        "admin@demo.com",
        hashedPassword,
        "admin",
      ])

      const userPassword = await bcrypt.hash("user123", 12)
      await pool.query("INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)", [
        "Regular User",
        "user@demo.com",
        userPassword,
        "user",
      ])

      const readOnlyPassword = await bcrypt.hash("readonly123", 12)
      await pool.query("INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)", [
        "Read Only User",
        "readonly@demo.com",
        readOnlyPassword,
        "read-only",
      ])

      console.log("Demo users created successfully")
    }
  } catch (error) {
    console.error("Database initialization error:", error)
    process.exit(1)
  }
}

// Auth routes
app.post(
  "/api/auth/register",
  authLimiter,
  [
    body("name").trim().isLength({ min: 2, max: 50 }).escape(),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6, max: 128 }),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, email, password } = req.body

      // Check if user already exists
      const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [email])
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: "User already exists" })
      }

      // Hash password
      const saltRounds = 12
      const hashedPassword = await bcrypt.hash(password, saltRounds)

      // Create user
      const result = await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at",
        [name, email, hashedPassword, "user"],
      )

      const user = result.rows[0]

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "7d" },
      )

      res.status(201).json({
        message: "User created successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.created_at,
        },
        token,
      })
    } catch (error) {
      console.error("Registration error:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },
)

app.post(
  "/api/auth/login",
  authLimiter,
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body

      // Find user
      const result = await pool.query(
        "SELECT id, name, email, password, role, created_at FROM users WHERE email = $1",
        [email],
      )

      if (result.rows.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" })
      }

      const user = result.rows[0]

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" })
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "7d" },
      )

      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.created_at,
        },
        token,
      })
    } catch (error) {
      console.error("Login error:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },
)

app.get("/api/auth/me", authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  })
})

// Transaction routes
app.get("/api/transactions", authenticateToken, apiLimiter, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query
    const offset = (page - 1) * limit
    const userId = req.user.id

    let query = `
      SELECT id, type, amount, description, category, date, created_at 
      FROM transactions 
      WHERE user_id = $1
    `
    const params = [userId]

    if (search) {
      query += ` AND (description ILIKE $${params.length + 1} OR category ILIKE $${params.length + 1})`
      params.push(`%${search}%`)
    }

    query += ` ORDER BY date DESC, created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const result = await pool.query(query, params)

    // Get total count for pagination
    let countQuery = "SELECT COUNT(*) FROM transactions WHERE user_id = $1"
    const countParams = [userId]

    if (search) {
      countQuery += ` AND (description ILIKE $2 OR category ILIKE $2)`
      countParams.push(`%${search}%`)
    }

    const countResult = await pool.query(countQuery, countParams)
    const totalCount = Number.parseInt(countResult.rows[0].count)
    const totalPages = Math.ceil(totalCount / limit)

    res.json({
      transactions: result.rows,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("Get transactions error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.post(
  "/api/transactions",
  authenticateToken,
  requireRole(["admin", "user"]),
  apiLimiter,
  [
    body("type").isIn(["income", "expense"]),
    body("amount").isFloat({ min: 0.01 }),
    body("description").trim().isLength({ min: 1, max: 255 }).escape(),
    body("category").trim().isLength({ min: 1, max: 100 }).escape(),
    body("date").isISO8601(),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { type, amount, description, category, date } = req.body
      const userId = req.user.id

      const result = await pool.query(
        "INSERT INTO transactions (user_id, type, amount, description, category, date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [userId, type, amount, description, category, date],
      )

      // Invalidate cache
      await invalidateCache(`analytics:${userId}`)
      await invalidateCache(`overview:${userId}`)

      res.status(201).json({
        message: "Transaction created successfully",
        transaction: result.rows[0],
      })
    } catch (error) {
      console.error("Create transaction error:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },
)

app.put(
  "/api/transactions/:id",
  authenticateToken,
  requireRole(["admin", "user"]),
  apiLimiter,
  [
    body("type").isIn(["income", "expense"]),
    body("amount").isFloat({ min: 0.01 }),
    body("description").trim().isLength({ min: 1, max: 255 }).escape(),
    body("category").trim().isLength({ min: 1, max: 100 }).escape(),
    body("date").isISO8601(),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params
      const { type, amount, description, category, date } = req.body
      const userId = req.user.id

      // Check if transaction belongs to user (unless admin)
      let checkQuery = "SELECT id FROM transactions WHERE id = $1"
      const checkParams = [id]

      if (req.user.role !== "admin") {
        checkQuery += " AND user_id = $2"
        checkParams.push(userId)
      }

      const checkResult = await pool.query(checkQuery, checkParams)
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: "Transaction not found" })
      }

      const result = await pool.query(
        "UPDATE transactions SET type = $1, amount = $2, description = $3, category = $4, date = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *",
        [type, amount, description, category, date, id],
      )

      // Invalidate cache
      await invalidateCache(`analytics:${userId}`)
      await invalidateCache(`overview:${userId}`)

      res.json({
        message: "Transaction updated successfully",
        transaction: result.rows[0],
      })
    } catch (error) {
      console.error("Update transaction error:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },
)

app.delete("/api/transactions/:id", authenticateToken, requireRole(["admin", "user"]), apiLimiter, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // Check if transaction belongs to user (unless admin)
    let checkQuery = "SELECT id FROM transactions WHERE id = $1"
    const checkParams = [id]

    if (req.user.role !== "admin") {
      checkQuery += " AND user_id = $2"
      checkParams.push(userId)
    }

    const checkResult = await pool.query(checkQuery, checkParams)
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Transaction not found" })
    }

    await pool.query("DELETE FROM transactions WHERE id = $1", [id])

    // Invalidate cache
    await invalidateCache(`analytics:${userId}`)
    await invalidateCache(`overview:${userId}`)

    res.json({ message: "Transaction deleted successfully" })
  } catch (error) {
    console.error("Delete transaction error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Analytics routes
app.get("/api/analytics/overview", authenticateToken, analyticsLimiter, async (req, res) => {
  try {
    const userId = req.user.id
    const cacheKey = getCacheKey("overview", userId)

    // Try to get from cache first
    const cached = await getFromCache(cacheKey)
    if (cached) {
      return res.json(cached)
    }

    // Get overview data
    const overviewQuery = `
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
        COUNT(*) as transaction_count
      FROM transactions 
      WHERE user_id = $1
    `

    const overviewResult = await pool.query(overviewQuery, [userId])
    const overview = overviewResult.rows[0]

    const totalIncome = Number.parseFloat(overview.total_income) || 0
    const totalExpenses = Number.parseFloat(overview.total_expenses) || 0
    const balance = totalIncome - totalExpenses

    // Get monthly trend (last 6 months)
    const trendQuery = `
      SELECT 
        TO_CHAR(date, 'YYYY-MM') as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
      FROM transactions 
      WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month
    `

    const trendResult = await pool.query(trendQuery, [userId])

    const data = {
      totalIncome,
      totalExpenses,
      balance,
      transactionCount: Number.parseInt(overview.transaction_count),
      monthlyTrend: trendResult.rows.map((row) => ({
        month: row.month,
        income: Number.parseFloat(row.income) || 0,
        expenses: Number.parseFloat(row.expenses) || 0,
      })),
    }

    // Cache for 15 minutes
    await setCache(cacheKey, data, 900)

    res.json(data)
  } catch (error) {
    console.error("Analytics overview error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.get("/api/analytics/detailed", authenticateToken, analyticsLimiter, async (req, res) => {
  try {
    const userId = req.user.id
    const { timeRange = "12months" } = req.query
    const cacheKey = getCacheKey("analytics", userId, timeRange)

    // Try to get from cache first
    const cached = await getFromCache(cacheKey)
    if (cached) {
      return res.json(cached)
    }

    // Determine date range
    let dateFilter = ""
    switch (timeRange) {
      case "3months":
        dateFilter = "AND date >= CURRENT_DATE - INTERVAL '3 months'"
        break
      case "6months":
        dateFilter = "AND date >= CURRENT_DATE - INTERVAL '6 months'"
        break
      case "12months":
        dateFilter = "AND date >= CURRENT_DATE - INTERVAL '12 months'"
        break
      case "2years":
        dateFilter = "AND date >= CURRENT_DATE - INTERVAL '2 years'"
        break
      default:
        dateFilter = "AND date >= CURRENT_DATE - INTERVAL '12 months'"
    }

    // Monthly trends
    const trendsQuery = `
      SELECT 
        TO_CHAR(date, 'YYYY-MM') as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
      FROM transactions 
      WHERE user_id = $1 ${dateFilter}
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month
    `

    // Category breakdown (expenses only)
    const categoryQuery = `
      SELECT 
        category,
        SUM(amount) as amount,
        COUNT(*) as count
      FROM transactions 
      WHERE user_id = $1 AND type = 'expense' ${dateFilter}
      GROUP BY category
      ORDER BY amount DESC
    `

    const [trendsResult, categoryResult] = await Promise.all([
      pool.query(trendsQuery, [userId]),
      pool.query(categoryQuery, [userId]),
    ])

    // Calculate percentages for categories
    const totalExpenses = categoryResult.rows.reduce((sum, row) => sum + Number.parseFloat(row.amount), 0)
    const categoryBreakdown = categoryResult.rows.map((row) => ({
      category: row.category,
      amount: Number.parseFloat(row.amount),
      percentage: totalExpenses > 0 ? (Number.parseFloat(row.amount) / totalExpenses) * 100 : 0,
      count: Number.parseInt(row.count),
    }))

    const data = {
      monthlyTrends: trendsResult.rows.map((row) => ({
        month: row.month,
        income: Number.parseFloat(row.income) || 0,
        expenses: Number.parseFloat(row.expenses) || 0,
      })),
      categoryBreakdown,
      yearlyComparison: [], // Could be implemented for yearly data
    }

    // Cache for 15 minutes
    await setCache(cacheKey, data, 900)

    res.json(data)
  } catch (error) {
    console.error("Detailed analytics error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// User management routes (admin only)
app.get("/api/users", authenticateToken, requireRole(["admin"]), apiLimiter, async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id, u.name, u.email, u.role, u.created_at,
        COUNT(t.id) as transaction_count
      FROM users u
      LEFT JOIN transactions t ON u.id = t.user_id
      GROUP BY u.id, u.name, u.email, u.role, u.created_at
      ORDER BY u.created_at DESC
    `

    const result = await pool.query(query)

    const users = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      createdAt: row.created_at,
      transactionCount: Number.parseInt(row.transaction_count),
    }))

    res.json({ users })
  } catch (error) {
    console.error("Get users error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: "Connected",
    cache: redis ? "Redis" : "Memory fallback",
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err)
  res.status(500).json({ error: "Internal server error" })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" })
})

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`)
    console.log(`Cache: ${redis ? "Redis" : "Memory fallback"}`)
  })
})

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully")
  await pool.end()
  if (redis) await redis.quit()
  process.exit(0)
})

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully")
  await pool.end()
  if (redis) await redis.quit()
  process.exit(0)
})
