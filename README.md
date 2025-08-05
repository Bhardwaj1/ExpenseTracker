# Personal Finance Tracker

A comprehensive full-stack personal finance tracking application built with React, Node.js, PostgreSQL, and Redis.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, User, Read-only)
- Secure password hashing with bcrypt
- Protected routes and API endpoints

### 💰 Transaction Management
- Add, edit, delete income/expense transactions
- Categorize transactions with predefined categories
- Search and filter transactions
- Pagination for large transaction lists
- Role-based permissions (read-only users can only view)

### 📊 Analytics & Dashboard
- Monthly/yearly spending overview
- Category-wise expense breakdown
- Income vs Expense trends
- Interactive charts using Recharts
- Real-time financial insights

### ⚡ Performance Features
- Redis caching for frequently accessed data
- Rate limiting for API endpoints
- Lazy loading for React components
- Optimized database queries with indexes
- Virtual scrolling for large lists

### 🛡️ Security Features
- XSS protection with Helmet.js
- SQL injection prevention with parameterized queries
- Input validation and sanitization
- CORS configuration
- Secure HTTP headers

## Tech Stack

### Frontend
- **React 18+** with TypeScript
- **Next.js 14** with App Router
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Recharts** for data visualization
- **Axios** for API calls

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **Redis** for caching
- **JWT** for authentication
- **bcrypt** for password hashing

### DevOps
- **Docker** & Docker Compose
- **PostgreSQL** with optimized schema
- **Redis** for session management

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git

### 1. Clone the Repository
\`\`\`bash
git clone <repository-url>
cd personal-finance-tracker
\`\`\`

### 2. Environment Setup
Create `.env` files:

**Frontend (.env.local):**
\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
\`\`\`

**Backend (server/.env):**
\`\`\`env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/finance_tracker
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
FRONTEND_URL=http://localhost:3000
\`\`\`

### 3. Start with Docker (Recommended)
\`\`\`bash
docker-compose up -d
\`\`\`

This will start:
- PostgreSQL database on port 5432
- Redis cache on port 6379
- Backend API on port 3001
- Frontend app on port 3000

### 4. Manual Setup (Alternative)

**Start Database & Redis:**
\`\`\`bash
docker-compose up postgres redis -d
\`\`\`

**Backend:**
\`\`\`bash
cd server
npm install
npm run dev
\`\`\`

**Frontend:**
\`\`\`bash
npm install
npm run dev
\`\`\`

## Demo Accounts

The application comes with pre-configured demo accounts:

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| Admin | admin@demo.com | admin123 | Full access to all features |
| User | user@demo.com | user123 | Manage own transactions |
| Read-only | readonly@demo.com | readonly123 | View-only access |

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Transaction Endpoints
- `GET /api/transactions` - Get user transactions (paginated)
- `POST /api/transactions` - Create transaction (user/admin only)
- `PUT /api/transactions/:id` - Update transaction (user/admin only)
- `DELETE /api/transactions/:id` - Delete transaction (user/admin only)

### Analytics Endpoints
- `GET /api/analytics/overview` - Get financial overview
- `GET /api/analytics/detailed` - Get detailed analytics

### User Management (Admin Only)
- `GET /api/users` - Get all users

## Architecture

### Frontend Architecture
\`\`\`
src/
├── app/                 # Next.js App Router
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard components
│   ├── transactions/   # Transaction management
│   ├── analytics/      # Charts and analytics
│   └── ui/            # Reusable UI components
├── contexts/           # React contexts
├── hooks/             # Custom React hooks
└── lib/               # Utilities and API client
\`\`\`

### Backend Architecture
\`\`\`
server/
├── index.js           # Main server file
├── middleware/        # Custom middleware
├── routes/           # API routes
├── models/           # Database models
└── utils/            # Utility functions
\`\`\`

### Database Schema
\`\`\`sql
users
├── id (UUID, Primary Key)
├── name (VARCHAR)
├── email (VARCHAR, Unique)
├── password (VARCHAR, Hashed)
├── role (ENUM: admin, user, read-only)
└── timestamps

transactions
├── id (UUID, Primary Key)
├── user_id (UUID, Foreign Key)
├── type (ENUM: income, expense)
├── amount (DECIMAL)
├── description (VARCHAR)
├── category (VARCHAR)
├── date (DATE)
└── timestamps
\`\`\`

## Performance Optimizations

### Frontend
- **Code Splitting**: Lazy loading with React.lazy()
- **Memoization**: useMemo and useCallback for expensive operations
- **Virtual Scrolling**: For large transaction lists
- **Optimized Re-renders**: Proper dependency arrays

### Backend
- **Redis Caching**: 15-minute cache for analytics, 1-hour for categories
- **Database Indexes**: Optimized queries for common operations
- **Rate Limiting**: Prevents API abuse
- **Connection Pooling**: Efficient database connections

### Caching Strategy
- **Analytics Data**: Cached for 15 minutes
- **Category Lists**: Cached for 1 hour
- **Cache Invalidation**: Automatic on data updates

## Security Measures

### Frontend Security
- **XSS Prevention**: Input sanitization and validation
- **CSRF Protection**: Token-based authentication
- **Secure Storage**: JWT tokens in localStorage with expiration

### Backend Security
- **SQL Injection Prevention**: Parameterized queries
- **Password Security**: bcrypt with salt rounds
- **Rate Limiting**: Different limits per endpoint type
- **CORS Configuration**: Restricted origins
- **Security Headers**: Helmet.js implementation

## Rate Limiting

| Endpoint Type | Limit | Window |
|---------------|-------|---------|
| Authentication | 5 requests | 15 minutes |
| Transactions | 100 requests | 1 hour |
| Analytics | 50 requests | 1 hour |

## Development

### Running Tests
\`\`\`bash
# Backend tests
cd server
npm test

# Frontend tests
npm test
\`\`\`

### Code Quality
\`\`\`bash
# Linting
npm run lint

# Type checking
npm run type-check
\`\`\`

### Database Migrations
\`\`\`bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d finance_tracker

# Run schema updates
\i database/migrations/001_add_new_column.sql
\`\`\`

## Deployment

### Production Environment Variables
\`\`\`env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
JWT_SECRET=your-production-secret
FRONTEND_URL=https://your-domain.com
\`\`\`

### Docker Production Build
\`\`\`bash
docker-compose -f docker-compose.prod.yml up -d
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the demo accounts for testing

## Roadmap

- [ ] Mobile app with React Native
- [ ] Advanced reporting features
- [ ] Budget planning and goals
- [ ] Multi-currency support
- [ ] Bank account integration
- [ ] Export to CSV/PDF
- [ ] Email notifications
- [ ] Advanced user roles
