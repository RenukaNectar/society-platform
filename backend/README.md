lsof -ti:3000
kill -9 44086

npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
npx sequelize-cli db:seed --seed 20250818125321-default-auditors.js
npx sequelize-cli db:seed:undo --seed 20240101000001-default-roles.js

# undo and run again migration
npx sequelize-cli db:migrate:undo --name 20250814000000-create-annual-forms-table.js
npx sequelize-cli db:migrate --to 20250814000000-create-annual-forms-table.js

# Society Backend API

A secure, scalable REST API for Society Management System built with TypeScript, Express.js, and MySQL. Features comprehensive authentication, role-based access control, and API versioning support.

## 🚀 Features

- **TypeScript Support**: Full TypeScript implementation with strict type checking
- **API Versioning**: Built-in support for multiple API versions (v1, v2, v3)
- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Security**: Helmet, CORS, rate limiting, input validation, and XSS protection
- **Database**: MySQL with connection pooling and transaction support
- **Logging**: Winston logger with daily rotation and structured logging
- **Email Support**: Nodemailer integration for verification and notification emails
- **Error Handling**: Comprehensive error handling with custom error classes
- **Testing**: Jest testing framework with TypeScript support
- **Documentation**: Auto-generated API documentation

## 📋 Prerequisites

- Node.js >= 18.0.0
- MySQL >= 8.0
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd society-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=3000
   
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=society_db
   DB_CONNECTION_LIMIT=10
   
   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key
   SESSION_SECRET=your_session_secret
   
   # Security Configuration
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   
   # Email Configuration (Optional)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   FRONTEND_URL=http://localhost:3000
   ```

4. **Database Setup**
   ```bash
   # Create database
   mysql -u root -p -e "CREATE DATABASE society_db;"
   
   # Run migrations
   npm run migrate
   
   # Seed initial data
   npm run seed
   ```

## 🚀 Usage

### Development
```bash
# Start development server with hot reload
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix
```

### Production
```bash
# Build the project
npm run build

# Start production server
npm start
```

### Testing
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test -- --coverage
```

## 📁 Project Structure

```
src/
├── config/           # Configuration files
│   └── database.ts   # Database configuration
├── database/         # Database related files
│   ├── models/       # Database models
│   ├── migrations/   # Database migrations
│   └── seeds/        # Database seeders
├── middleware/       # Express middleware
│   ├── auth.ts       # Authentication middleware
│   └── notFound.ts   # 404 handler
├── routes/           # API routes
│   └── v1/          # Version 1 API routes
│       ├── auth.ts   # Authentication routes
│       ├── users.ts  # User management routes
│       ├── roles.ts  # Role management routes
│       ├── permissions.ts # Permission management routes
│       └── admin.ts  # Admin routes
├── types/            # TypeScript type definitions
│   └── index.ts      # Main types file
├── utils/            # Utility functions
│   ├── errors.ts     # Error handling utilities
│   ├── logger.ts     # Logging utilities
│   └── email.ts      # Email utilities
└── server.ts         # Main application file
```

## 🔐 API Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 📚 API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /register` - Register a new user
- `POST /login` - Authenticate user
- `POST /logout` - Logout user
- `GET /me` - Get current user profile
- `POST /refresh` - Refresh JWT token
- `POST /verify-email` - Verify email address
- `POST /forgot-password` - Send password reset email

### Users (`/api/v1/users`)
- `GET /` - Get all users (Admin only)
- `GET /:id` - Get user by ID
- `PUT /:id` - Update user
- `DELETE /:id` - Delete user (Admin only)
- `PATCH /:id/status` - Toggle user status (Admin only)
- `GET /stats` - Get user statistics (Admin only)

### Roles (`/api/v1/roles`)
- `GET /` - Get all roles (Admin only)
- `GET /:id` - Get role by ID (Admin only)
- `POST /` - Create new role (Admin only)
- `PUT /:id` - Update role (Admin only)
- `DELETE /:id` - Delete role (Admin only)

### Permissions (`/api/v1/permissions`)
- `GET /` - Get all permissions (Admin only)
- `GET /:id` - Get permission by ID (Admin only)
- `POST /` - Create new permission (Admin only)
- `PUT /:id` - Update permission (Admin only)
- `DELETE /:id` - Delete permission (Admin only)
- `GET /resources` - Get available resources (Admin only)
- `GET /actions` - Get available actions (Admin only)

### Admin (`/api/v1/admin`)
- `GET /dashboard` - Get admin dashboard (Admin only)
- `GET /logs` - Get system logs (Admin only)
- `POST /system/restart` - Restart system (Admin only, Dev only)
- `GET /system/health` - Get system health (Admin only)
- `POST /backup` - Create system backup (Admin only)
- `GET /backups` - Get backup list (Admin only)
- `DELETE /backups/:id` - Delete backup (Admin only)

## 🔧 API Versioning

The API supports versioning through URL paths:
- `v1` - Current stable version
- Future versions (v2, v3) can be added easily

Example:
```
/api/v1/auth/login
/api/v2/auth/login (future)
```

## 🛡️ Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Request rate limiting
- **Input Validation**: Express-validator for request validation
- **XSS Protection**: XSS attack prevention
- **SQL Injection Protection**: Parameterized queries
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Granular permission system

## 📊 Logging

The application uses Winston for logging with the following features:
- Console and file logging
- Daily log rotation
- Different log levels (error, warn, info, debug)
- Structured logging with metadata

## 🧪 Testing

The project includes comprehensive testing with Jest:
- Unit tests for utilities and models
- Integration tests for API endpoints
- Test coverage reporting
- Mock database for testing

## 📦 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@society.com or create an issue in the repository.

## 🔄 Changelog

### v1.0.0
- Initial release with TypeScript support
- API versioning implementation
- Comprehensive authentication and authorization
- Role-based access control
- Admin dashboard and system management
- Email integration
- Comprehensive testing setup 