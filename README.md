# 📝 Smart Note App

A modern, secure note-taking application built with Node.js, Express, MongoDB, and GraphQL. Features user authentication, file uploads, and a powerful GraphQL API for flexible data querying.

## 🚀 Features

- **🔐 Secure Authentication**: JWT-based authentication with password reset via email
- **📝 Note Management**: Create, read, update, and delete notes
- **🔍 Advanced Search**: Full-text search with filters and pagination
- **📊 GraphQL API**: Flexible data querying with GraphQL
- **📁 File Uploads**: Profile picture upload functionality
- **📧 Email Integration**: Password reset with OTP verification
- **🛡️ Security**: Rate limiting, CORS, and input validation
- **📱 RESTful API**: Traditional REST endpoints for easy integration

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **API**: REST + GraphQL
- **File Upload**: Multer
- **Email**: Nodemailer
- **Security**: Helmet, Rate Limiting, CORS
- **Validation**: Joi

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Git

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Smart-Note-App
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database
   MONGODB_URI=mongodb://localhost:27017/smart-note-app

   # JWT Configuration
   JWT_PRIVATE_KEY_PATH=./keys/private.pem
   JWT_PUBLIC_KEY_PATH=./keys/public.pem
   JWT_AUDIENCE=smart-note-app-users
   JWT_ISSUER=smart-note-app
   JWT_EXPIRES_IN=24h

   # Email Configuration (for password reset)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=your-email@gmail.com
   ```

4. **Generate JWT Keys** (if not provided)
   ```bash
   # Create keys directory
   mkdir keys
   
   # Generate private key
   openssl genrsa -out keys/private.pem 2048
   
   # Generate public key
   openssl rsa -in keys/private.pem -pubout -out keys/public.pem
   ```

5. **Start the server**
   ```bash
   npm start
   ```

The server will start on `http://localhost:3000`

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Forgot Password
```http
POST /api/auth/forget-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newpassword123"
}
```

#### Upload Profile Picture
```http
PATCH /api/auth/upload-profile-pic
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data

file: [image-file]
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <JWT_TOKEN>
```

### Notes Endpoints

#### Create Note
```http
POST /api/notes
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "title": "Meeting Notes",
  "content": "Discussion points from today's meeting..."
}
```

#### Get All Notes (with filters)
```http
GET /api/notes?title=meeting&page=1&limit=10&createdFrom=2023-01-01
Authorization: Bearer <JWT_TOKEN>
```

#### Search Notes
```http
GET /api/notes/search?search=meeting
Authorization: Bearer <JWT_TOKEN>
```

#### Get Note by ID
```http
GET /api/notes/:noteId
Authorization: Bearer <JWT_TOKEN>
```

#### Update Note
```http
PUT /api/notes/:noteId
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "title": "Updated Meeting Notes",
  "content": "Updated content..."
}
```

#### Delete Note
```http
DELETE /api/notes/:noteId
Authorization: Bearer <JWT_TOKEN>
```

### GraphQL Endpoint

#### GraphQL Query
```http
POST /graphql
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "query": "query GetNotes($title: String, $page: Int, $limit: Int) { 
    notes(title: $title, page: $page, limit: $limit) { 
      notes { 
        id 
        title 
        content 
        owner { 
          id 
          email 
        } 
        createdAt 
        updatedAt 
      } 
      totalCount 
      currentPage 
      totalPages 
      hasNextPage 
      hasPrevPage 
    } 
  }",
  "variables": {
    "title": "meeting",
    "page": 1,
    "limit": 10
  }
}
```

## 🧪 Testing

Use the provided `test-api.http` file to test all endpoints:

1. **Install REST Client extension** in VS Code (if using VS Code)
2. **Get a fresh JWT token** by running the login request
3. **Replace token placeholders** in the test file
4. **Run individual requests** to test functionality

### Test Authentication
```http
GET /test-auth
Authorization: Bearer <JWT_TOKEN>
```

## 📁 Project Structure

```
Smart Note App/
├── index.js                 # Server entry point
├── src/
│   ├── app.js              # Express app configuration
│   ├── config/
│   │   ├── database.js     # MongoDB connection
│   │   ├── email.config.js # Email configuration
│   │   └── jwt.config.js   # JWT configuration
│   ├── middleware/
│   │   ├── auth.middleware.js    # Authentication middleware
│   │   ├── upload.middleware.js  # File upload middleware
│   │   └── validation.middleware.js # Input validation
│   ├── models/
│   │   ├── Note.model.js   # Note schema
│   │   ├── Token.model.js  # Token schema
│   │   └── User.model.js   # User schema
│   └── modules/
│       ├── auth/
│       │   ├── auth.controller.js # Auth logic
│       │   └── auth.routes.js     # Auth routes
│       └── notes/
│           ├── notes.controller.js # Notes logic
│           ├── notes.graphql.js    # GraphQL schema
│           └── notes.routes.js     # Notes routes
├── keys/                   # JWT keys directory
├── uploads/               # File uploads directory
├── test-api.http         # API testing file
└── package.json
```

## 🔧 Configuration

### Database Configuration
The app uses MongoDB with Mongoose. Configure your connection in `src/config/database.js`.

### JWT Configuration
JWT tokens are used for authentication. Configure keys and options in `src/config/jwt.config.js`.

### Email Configuration
Email service is used for password reset. Configure SMTP settings in `src/config/email.config.js`.

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt password hashing
- **Rate Limiting**: Prevents abuse with request limiting
- **CORS Protection**: Cross-origin resource sharing protection
- **Input Validation**: Joi schema validation
- **Helmet Security**: Security headers middleware
- **File Upload Security**: Secure file upload handling

## 📊 GraphQL Schema

The app provides a GraphQL API with the following types:

- **User**: User information
- **Note**: Note data with owner information
- **PaginatedNotes**: Paginated note results

### Available Queries
- `notes`: Get paginated notes with filters

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=your-production-mongodb-uri
JWT_PRIVATE_KEY_PATH=./keys/private.pem
JWT_PUBLIC_KEY_PATH=./keys/public.pem
EMAIL_HOST=your-smtp-host
EMAIL_USER=your-email
EMAIL_PASS=your-password
```

### PM2 Deployment
```bash
npm install -g pm2
pm2 start index.js --name "smart-note-app"
pm2 save
pm2 startup
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Include error logs and steps to reproduce

## 🔄 Changelog

### Version 1.0.0
- Initial release
- User authentication with JWT
- Note CRUD operations
- GraphQL API
- File upload functionality
- Email-based password reset
- Security middleware implementation

---

**Happy Note Taking! 📝✨**
