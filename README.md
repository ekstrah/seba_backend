# Backend API

A Node.js/Express backend API for an e-commerce platform with farmer and consumer features.

## Tech Stack
- Node.js with Express
- MongoDB (Mongoose)
- JWT Authentication
- Docker support
- Winston & Morgan for logging
- ESLint for code quality
- Babel for modern JavaScript support

## Features
- User authentication and authorization
- Role-based access control (Farmer/Consumer)
- Product management
- Category management
- Shopping cart functionality
- Order management
- Comprehensive logging system
- Docker containerization
- Environment-based configuration

## Quick Start

### Local Development
```bash
# Install dependencies
npm install

# Development
npm run dev

# Production
npm start
```

### Docker Development
```bash
# Build and start the development container
docker-compose up --build

# Stop the container
docker-compose down
```

## API Endpoints
- `/api/auth` - Authentication
  - POST `/register` - User registration
  - POST `/login` - User login
  - POST `/logout` - User logout
- `/api/product` - Product management
- `/api/category` - Category management
- `/api/cart` - Shopping cart
- `/api/order-item` - Order management
- `/api/farmer` - Farmer management
- `/api/consumer` - Consumer management

## Environment Setup
1. Copy `example.env` to `.env`
2. Configure your environment variables:
   - `PORT` - Server port (default: 8080)
   - `MONGODB_URI` - MongoDB connection string
   - `JWT_SECRET` - JWT secret key
   - `NODE_ENV` - Environment (development/production)

## Logging
The application uses a hybrid logging system:
- Console logging for development
- File logging for production
- Log files are stored in the `logs` directory
- Log levels: error, warn, info, debug

## Project Structure
```
├── controllers/    # Business logic
├── models/        # Database schemas
├── routes/        # API endpoints
├── middleware/    # Custom middleware
├── utils/         # Helper functions
├── logs/          # Log files
├── docker/        # Docker configuration
│   ├── dev.Dockerfile
│   └── prod.Dockerfile
└── tests/         # Test files
```

## Docker Configuration
- Development: Uses `docker/dev.Dockerfile`
- Production: Uses `docker/prod.Dockerfile`
- Image: `git.ailaplacelab.com/seba22/backend:dev`
- Port: 8080

## Contributing
1. Create your feature branch
2. Commit your changes
3. Push to the branch
4. Create a Pull Request

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.