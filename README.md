# Attendance Android Backend

Backend server for validating college details from Android app.

## Features

- College details validation (email, name, activation code)
- MongoDB integration
- RESTful API
- Secure with Helmet.js
- CORS enabled
- Request logging

## Setup

1. Install dependencies:

```bash
npm install
```

2. Environment variables are already configured in `.env`

3. Start the server:

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## API Endpoints

### 1. Validate College Details

**POST** `/api/validate`

Request body:

```json
{
  "collegeEmail": "college@example.com",
  "collegeName": "Example College",
  "activationCode": "ABC123"
}
```

Success response:

```json
{
  "success": true,
  "message": "College details validated successfully",
  "data": {
    "collegeId": "...",
    "collegeName": "Example College",
    "validated": true
  }
}
```

Failure response:

```json
{
  "success": false,
  "message": "Invalid college details...",
  "data": {
    "validated": false
  }
}
```

### 2. Register College (Admin/Testing)

**POST** `/api/register`

Request body:

```json
{
  "collegeEmail": "college@example.com",
  "collegeName": "Example College",
  "activationCode": "ABC123"
}
```

### 3. Get All Colleges (Admin/Testing)

**GET** `/api/colleges`

### 4. Health Check

**GET** `/health`

## Testing

1. First, register a test college:

```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d "{\"collegeEmail\":\"test@college.edu\",\"collegeName\":\"Test College\",\"activationCode\":\"TEST123\"}"
```

2. Then validate it:

```bash
curl -X POST http://localhost:3000/api/validate \
  -H "Content-Type: application/json" \
  -d "{\"collegeEmail\":\"test@college.edu\",\"collegeName\":\"Test College\",\"activationCode\":\"TEST123\"}"
```

## Android Integration

Use this endpoint in your Android app:

```
POST http://YOUR_SERVER_IP:3000/api/validate
```

Example with Retrofit/OkHttp or Volley to send college details and receive validation response.
