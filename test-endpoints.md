# API Endpoints Test Guide

## Authentication Endpoints

### 1. Register User
```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "123456"
}
```

### 2. Login User
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "123456"
}
```

### 3. Upload Profile Picture
```bash
PATCH http://localhost:3000/api/auth/upload-profile-pic
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

file: [your-image-file]
```

### 4. Forgot Password
```bash
POST http://localhost:3000/api/auth/forget-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### 5. Reset Password
```bash
POST http://localhost:3000/api/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newpassword123"
}
```

### 6. Logout
```bash
POST http://localhost:3000/api/auth/logout
Authorization: Bearer YOUR_JWT_TOKEN
```

## Notes Endpoints

### 1. Create Note
```bash
POST http://localhost:3000/api/notes
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "title": "Meeting",
  "content": "Today we discussed..."
}
```

### 2. Get All Notes with GraphQL Filters
```bash
GET http://localhost:3000/api/notes?title=meeting&page=1&limit=10&createdFrom=2023-01-01&createdTo=2023-12-31
Authorization: Bearer YOUR_JWT_TOKEN
```

### 3. Search Notes
```bash
GET http://localhost:3000/api/notes/search?search=meeting
Authorization: Bearer YOUR_JWT_TOKEN
```

### 4. Get Note by ID
```bash
GET http://localhost:3000/api/notes/60d5ecb74b24a1234567890a
Authorization: Bearer YOUR_JWT_TOKEN
```

### 5. Update Note
```bash
PUT http://localhost:3000/api/notes/60d5ecb74b24a1234567890a
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "title": "Updated Meeting",
  "content": "Updated content..."
}
```

### 6. Delete Note
```bash
DELETE http://localhost:3000/api/notes/60d5ecb74b24a1234567890a
Authorization: Bearer YOUR_JWT_TOKEN
```

## GraphQL Endpoint

### Direct GraphQL Query
```bash
POST http://localhost:3000/graphql
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "query": "query GetNotes($title: String, $page: Int, $limit: Int) { notes(title: $title, page: $page, limit: $limit) { notes { id title content owner { id email isVerified } createdAt updatedAt } totalCount currentPage totalPages hasNextPage hasPrevPage } }",
  "variables": {
    "title": "meeting",
    "page": 1,
    "limit": 10
  }
}
```

## Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

### GraphQL Notes Response with Pagination
```json
{
  "data": {
    "notes": {
      "notes": [
        {
          "id": "60d5ecb74b24a1234567890a",
          "title": "Meeting",
          "content": "Today we discussed...",
          "owner": {
            "id": "60d5ecb74b24a1234567890b",
            "email": "user@example.com",
            "isVerified": "false"
          },
          "createdAt": "2023-06-25T10:00:00.000Z",
          "updatedAt": "2023-06-25T10:00:00.000Z"
        }
      ],
      "totalCount": 25,
      "currentPage": 1,
      "totalPages": 3,
      "hasNextPage": "true",
      "hasPrevPage": "false"
    }
  }
}
```
