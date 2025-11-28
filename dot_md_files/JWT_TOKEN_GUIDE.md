# 🔐 JWT TOKEN GUIDE - How to Get & Use API Authorization

**Date:** November 28, 2025  
**API Version:** 1.0.0 (OpenAPI 3.0)  
**Authentication:** JWT Bearer Token

---

## 📋 QUICK START

### Get a JWT Token in 3 Steps:

1. **Choose your role:** Admin/TTE OR Passenger
2. **Use login endpoint** with credentials
3. **Copy the token** returned in response
4. **Use token** in Swagger or API calls

---

## 🔑 LOGIN ENDPOINTS

### Option 1: Staff Login (Admin/TTE)
**Endpoint:** `POST /api/auth/staff/login`  
**Base URL:** `http://localhost:5000`

**Request Body:**
```json
{
  "employeeId": "EMP001",
  "password": "password123"
}
```

**Example with cURL:**
```bash
curl -X POST http://localhost:5000/api/auth/staff/login \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMP001",
    "password": "password123"
  }'
```

**Example with Swagger UI:**
1. Go to http://localhost:5000/api-docs
2. Find "Configuration" → "POST /auth/staff/login"
3. Click "Try it out"
4. Enter employeeId and password
5. Click "Execute"

---

### Option 2: Passenger Login
**Endpoint:** `POST /api/auth/passenger/login`  
**Base URL:** `http://localhost:5000`

**Request Body (using IRCTC ID):**
```json
{
  "irctcId": "P123456789",
  "password": "password123"
}
```

**Or (using Email):**
```json
{
  "email": "passenger@example.com",
  "password": "password123"
}
```

**Example with cURL:**
```bash
curl -X POST http://localhost:5000/api/auth/passenger/login \
  -H "Content-Type: application/json" \
  -d '{
    "irctcId": "P123456789",
    "password": "password123"
  }'
```

---

## 📌 SAMPLE CREDENTIALS

### Staff Credentials (for testing)
```
Employee ID:   EMP001
Password:      password123
Role:          ADMIN

Employee ID:   TTE001
Password:      password123
Role:          TTE
```

### Passenger Credentials (for testing)
```
IRCTC ID:      P123456789
Password:      password123

Email:         passenger@example.com
Password:      password123
```

**Note:** These are test credentials. Create actual users in your database.

---

## 📬 LOGIN RESPONSE FORMAT

### Success Response (Staff):
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "employeeId": "EMP001",
    "name": "John Admin",
    "email": "admin@railway.com",
    "role": "ADMIN",
    "trainAssigned": "12345",
    "permissions": ["view_all", "manage_allocation", "edit_config"]
  }
}
```

### Success Response (Passenger):
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "irctcId": "P123456789",
    "name": "Jane Passenger",
    "email": "jane@example.com",
    "phone": "9876543210",
    "role": "PASSENGER"
  },
  "tickets": [
    {
      "pnr": "5021234567",
      "trainNumber": "12345",
      "trainName": "Express",
      "from": "Delhi",
      "to": "Mumbai",
      "journeyDate": "2025-11-28",
      "status": "CONFIRMED",
      "racStatus": "RAC",
      "coach": "A1",
      "berth": "42",
      "class": "SL"
    }
  ]
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

## 🎯 HOW TO USE TOKEN IN SWAGGER UI

### Step 1: Get Token
1. Go to `http://localhost:5000/api-docs`
2. Scroll to "Configuration" section
3. Click "POST /auth/staff/login" or "POST /auth/passenger/login"
4. Click "Try it out"
5. Enter credentials
6. Click "Execute"
7. Copy the `token` value from the response

### Step 2: Authorize in Swagger
1. Look for "Available authorizations" dialog (or Authorize button at top)
2. Click "Authorize" button (top-right in Swagger UI)
3. For "bearerAuth":
   - Paste your JWT token in the "Value" field
   - **Don't** include "Bearer " prefix - Swagger adds it automatically
   - Just paste: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
4. Click "Authorize"
5. Click "Close"

### Step 3: Make API Calls
1. Now all API endpoints will automatically include your token
2. Try any endpoint marked with 🔒 (requires authentication)
3. Click "Try it out" and "Execute"
4. Token will be sent as: `Authorization: Bearer <your_token>`

---

## 🔌 HOW TO USE TOKEN IN CODE/API CALLS

### Using fetch() in JavaScript/React:
```javascript
// 1. Get token from login
const loginResponse = await fetch('http://localhost:5000/api/auth/staff/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    employeeId: 'EMP001',
    password: 'password123'
  })
});

const loginData = await loginResponse.json();
const token = loginData.token;

// 2. Use token in API calls
const apiResponse = await fetch('http://localhost:5000/api/train/state', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});

const data = await apiResponse.json();
console.log(data);
```

### Using axios in JavaScript:
```javascript
const axios = require('axios');

// 1. Get token
const loginResponse = await axios.post(
  'http://localhost:5000/api/auth/staff/login',
  {
    employeeId: 'EMP001',
    password: 'password123'
  }
);

const token = loginResponse.data.token;

// 2. Use token in requests
const apiResponse = await axios.get(
  'http://localhost:5000/api/train/state',
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

console.log(apiResponse.data);
```

### Using cURL:
```bash
# 1. Get token
TOKEN=$(curl -X POST http://localhost:5000/api/auth/staff/login \
  -H "Content-Type: application/json" \
  -d '{"employeeId":"EMP001","password":"password123"}' \
  | jq -r '.token')

# 2. Use token in API calls
curl -X GET http://localhost:5000/api/train/state \
  -H "Authorization: Bearer $TOKEN"
```

### Using Postman:
1. **Get Token:**
   - Method: POST
   - URL: `http://localhost:5000/api/auth/staff/login`
   - Body (JSON):
     ```json
     {
       "employeeId": "EMP001",
       "password": "password123"
     }
     ```
   - Send
   - Copy token from response

2. **Use Token:**
   - Method: GET
   - URL: `http://localhost:5000/api/train/state`
   - Headers:
     - Key: `Authorization`
     - Value: `Bearer <token>`
   - Send

---

## 🔄 TOKEN MANAGEMENT

### Token Details:
```
Validity Period:  48 hours
Type:             JWT (JSON Web Token)
Algorithm:        HS256
Secret:           Environment variable (production)
```

### What's Inside Your Token?
```json
{
  "userId": "EMP001",
  "role": "ADMIN",
  "trainAssigned": "12345",
  "permissions": ["view_all", "manage_allocation"],
  "iat": 1732827600,
  "exp": 1732914000
}
```

### Token Refresh:
- Tokens are valid for **48 hours**
- After expiry, you need to **login again** to get a new token
- There's no token refresh endpoint - just login again
- Each login generates a fresh token

### Logout:
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer <token>"
```

---

## ⚠️ COMMON ERRORS

### Error: "Invalid credentials"
**Cause:** Wrong employeeId, IRCTC ID, or password  
**Solution:** Check credentials, try again

### Error: "Account is deactivated"
**Cause:** User account is inactive  
**Solution:** Contact administrator to activate account

### Error: "Invalid token" (when using token)
**Cause:** Token expired or malformed  
**Solution:** Login again to get a fresh token

### Error: "Missing Authorization header"
**Cause:** Not including `Authorization: Bearer <token>` header  
**Solution:** Add header to all API calls

### Error: "Token validation failed"
**Cause:** Token corrupted or JWT_SECRET mismatch  
**Solution:** Login again

---

## 🛡️ SECURITY BEST PRACTICES

### For Development:
✅ Use HTTP (localhost:5000)  
✅ Keep tokens in localStorage or sessionStorage  
✅ Use default credentials for testing

### For Production:
⚠️ **CHANGE JWT_SECRET** in environment variables
```bash
JWT_SECRET=your-super-secure-random-key-here
```

⚠️ Use HTTPS only  
⚠️ Store tokens in secure httpOnly cookies (not localStorage)  
⚠️ Implement token refresh mechanism  
⚠️ Add CORS restrictions  
⚠️ Monitor failed login attempts  
⚠️ Use strong passwords  

---

## 📊 AUTHORIZATION LEVELS

### ADMIN Role:
- Full API access
- Can view all data
- Can modify configuration
- Can manage allocations
- Can view analytics

### TTE Role:
- Limited API access
- Can mark no-shows
- Can manage passengers
- Can view train status
- Cannot modify system config

### PASSENGER Role:
- Minimal API access
- Can view own tickets
- Can view booking status
- Cannot modify anything

---

## 🔗 RELATED ENDPOINTS

### Authentication:
- `POST /api/auth/staff/login` - Login as staff
- `POST /api/auth/passenger/login` - Login as passenger
- `GET /api/auth/verify` - Verify token validity
- `POST /api/auth/logout` - Logout

### Protected Endpoints (require token):
- `GET /api/train/state` - Get train state
- `GET /api/passengers/all` - Get all passengers
- `POST /api/train/next-station` - Move to next station
- `POST /api/passenger/no-show` - Mark no-show
- All other operational endpoints

---

## 💡 TIPS & TRICKS

### Tip 1: Save Token Locally
```javascript
// After successful login
localStorage.setItem('token', loginData.token);
localStorage.setItem('user', JSON.stringify(loginData.user));

// Use later
const token = localStorage.getItem('token');
```

### Tip 2: Auto-Inject Token
```javascript
// Set default header for all axios requests
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

### Tip 3: Handle Token Expiry
```javascript
// Check if token is about to expire
function isTokenExpiring(token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  const expiry = payload.exp * 1000;
  return Date.now() > expiry - 3600000; // 1 hour before expiry
}
```

### Tip 4: Create Test Users
```bash
# In MongoDB shell
db.tte_users.insertOne({
  employeeId: "TEST001",
  name: "Test Admin",
  email: "test@railway.com",
  passwordHash: "$2b$10$...", // bcrypt hash of "test123"
  role: "ADMIN",
  active: true
})
```

---

## 🚀 QUICK REFERENCE

| What | How |
|------|-----|
| Get token | POST /api/auth/staff/login (or passenger) |
| Use token in API call | Add header: `Authorization: Bearer <token>` |
| Authorize in Swagger | Click "Authorize", paste token value |
| Token valid for | 48 hours |
| Token expired | Login again to get new token |
| Check token in Swagger | Look at response from login endpoint |

---

## 📞 SUPPORT

### API Documentation:
- Full API docs: http://localhost:5000/api-docs
- Try-it-out in Swagger: http://localhost:5000/api-docs

### Troubleshooting:
1. Check backend logs in Terminal 1
2. Verify MongoDB is running
3. Confirm credentials are correct
4. Check browser console for errors

### Test the Flow:
1. Go to Swagger UI: http://localhost:5000/api-docs
2. Login to get token: POST /api/auth/staff/login
3. Authorize with token: Click "Authorize" button
4. Try an API endpoint: GET /api/train/state
5. Success! ✅

---

**Last Updated:** November 28, 2025  
**Status:** ✅ Production Ready  
**Support:** Check API docs at /api-docs

