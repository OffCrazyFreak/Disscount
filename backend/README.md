# Croatian Price Comparison Shopping App - Backe## API Endpoints

### Authentication (`/api/auth`) - Open Endpoints

- `POST /register` - Register new user
- `POST /login` - Login with credentials
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout from current session
- `POST /logout-all` - Logout from all sessions
- (cleanup endpoint removed) expired tokens are deleted per-user on login

### User Management (`/api/users`)

**Open Endpoints (No Authentication Required):**

- `GET /` - Get all users (for testing purposes)
- `GET /exists/email/{email}` - Check if email exists
- `GET /exists/username/{username}` - Check if username exists

**Protected Endpoints (Require JWT Authentication):**

- `GET /{id}` - Get user by ID (own profile only)
- `PATCH /{id}` - Update username, stayLoggedInDays and notification settings (own profile only)
- `DELETE /{id}` - Soft delete user (own account only)

## Security

All endpoints except authentication, user existence checks, and get all users (for testing) require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Users can only access and modify their own data. The JWT token contains the user ID which is used to enforce this restriction.ackend for a Croatian price comparison shopping app that helps users create shopping lists and compare prices across different stores using the cijene.dev API.

## Features Implemented

### User Management

- ✅ User registration with email/username and password
- ✅ User login with credentials
- ✅ JWT-based authentication (Access + Refresh tokens)
- ✅ User profile management
- ✅ Soft delete for users
- ✅ Google Auth support (structure ready)

### Database Schema

#### Users (`app_user`)

| Field                 | Type      | Description                    |
| --------------------- | --------- | ------------------------------ |
| id                    | UUID      | Primary key                    |
| username              | VARCHAR   | Unique username                |
| email                 | VARCHAR   | Unique email                   |
| passwordHash          | VARCHAR   | Hashed password                |
| googleId              | VARCHAR   | Google OAuth ID                |
| lastLoginAt           | TIMESTAMP | Last login time                |
| stayLoggedInDays      | INT       | Stay logged in preference      |
| notificationsPush     | BOOLEAN   | Push notifications enabled     |
| notificationsEmail    | BOOLEAN   | Email notifications enabled    |
| subscriptionTier      | ENUM      | FREE/PRO subscription          |
| subscriptionStartDate | DATE      | Subscription start date        |
| numberOfAiPrompts     | INT       | AI prompts used in last 7 days |
| lastAiPromptAt        | TIMESTAMP | Last AI prompt time            |
| createdAt             | TIMESTAMP | Account creation time          |
| deletedAt             | TIMESTAMP | Soft delete timestamp          |

#### Refresh Tokens (`refresh_token`)

| Field     | Type      | Description           |
| --------- | --------- | --------------------- |
| id        | UUID      | Primary key           |
| userId    | UUID      | Foreign key to user   |
| tokenHash | VARCHAR   | Hashed token          |
| expiresAt | TIMESTAMP | Token expiration      |
| createdAt | TIMESTAMP | Token creation time   |
| deletedAt | TIMESTAMP | Soft delete timestamp |

## API Endpoints

### Authentication (`/api/auth`)

- `POST /register` - Register new user
- `POST /login` - Login with credentials
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout from current session
- `POST /logout-all` - Logout from all sessions
- `POST /cleanup` - Clean expired tokens

### User Management (`/api/users`)

- `GET /{id}` - Get user by ID
- `GET /` - Get all users
- `PATCH /{id}` - Update username, stayLoggedInDays and notification settings
- `DELETE /{id}` - Soft delete user
- `GET /exists/email/{email}` - Check if email exists
- `GET /exists/username/{username}` - Check if username exists

## Technology Stack

- **Java 21**
- **Spring Boot 3.1.0**
- **Spring Data JPA**
- **Spring Security**
- **PostgreSQL**
- **JWT (JSON Web Tokens)**
- **BCrypt** for password hashing
- **Lombok** for reducing boilerplate
- **OpenAPI/Swagger** for documentation

## Getting Started

1. **Prerequisites:**

   - Java 21
   - Maven 3.9+
   - PostgreSQL database

2. **Environment Variables:**

   ```bash
   SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/your_database
   SPRING_DATASOURCE_USERNAME=your_username
   SPRING_DATASOURCE_PASSWORD=your_password
   JWT_SECRET=your_very_long_jwt_secret_key
   ```

   You can copy `.env.example` to `.env` for local development and fill in the values. `.env` is included in `.gitignore` so secrets won't be committed.

3. **Run the application:**

   ```bash
   mvn spring-boot:run
   ```

4. **Access Swagger UI:**
   - http://localhost:8080/api-docs

## Next Steps

The following features need to be implemented for the full shopping app:

### Immediate (Shopping Lists & Products)

- Shopping Lists entity with items
- Product management
- Store/chain management
- Price tracking
- Pinned stores for users
- User locations/settlements

### Future Features

- Loyalty/Gift card management
- Product watchlist with notifications
- Price alerts
- Mobile PWA support
- Barcode scanning integration
- AI shopping assistant
- cijene.dev API integration

### Security Enhancements

- JWT token blacklisting
- Rate limiting
- Google OAuth implementation
- Email verification
- Password reset functionality

## Database Structure

The application uses PostgreSQL with Hibernate for ORM. The database schema is automatically created/updated using `spring.jpa.hibernate.ddl-auto=update`.

## Configuration

Key configuration properties in `application.properties`:

- Database connection
- JWT token settings
- Security configurations
- Swagger documentation path

## Error Handling

Global exception handling with custom exceptions:

- `BadRequestException` - 400 errors
- `UnauthorizedException` - 401 errors
- Validation errors with field-specific messages
- Generic server error handling
