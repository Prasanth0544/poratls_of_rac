# Initialization Checklist - Step by Step

## What You Should See After Clicking "Apply Configuration"

### **Step 1: Configuration Form Submitted**
You enter:
- ✏️ Train Number: `17225`
- ✏️ Passengers Collection: `17225_passengers`
- 📅 Journey Date: `2025-11-28`

Plus auto-populated:
- 🔄 Train Name: `Amaravathi Express`
- 🔄 Stations Collection: `17225_NEW_ROUTE`

### **Step 2: API Calls Executed**
```
1. POST /api/config/setup
   - Backend stores: mongoUri, stationsDb, stationsCollection, etc.
   - Response: ✅ Configuration applied

2. POST /api/train/initialize (trainNo=17225, journeyDate=2025-11-28)
   - Backend loads train details, stations, passengers, allocates berths
   - Response: ✅ Train initialized with summary data

3. GET /api/train/state
   - Backend returns full train state with all stations, coaches, passengers
   - Frontend sets trainData = response.data
```

### **Step 3: Frontend Navigation**
- ConfigPage closes
- App navigates to Home page (currentPage = 'home')
- `trainData` is populated with:
  ```javascript
  {
    trainNo: 17225,
    trainName: "Amaravathi Express",
    journeyDate: "2025-11-28",
    currentStationIdx: 0,
    stations: [...],        // 18 stations with timings
    coaches: [...],         // 13 coaches with berths
    racQueue: [...],        // RAC passengers
    stats: {...}            // Totals
  }
  ```

### **Step 4: Home Page Renders**
Header should show:
```
🚂 RAC Reallocation System
Amaravathi Express (#17225) | 2025-11-28
Station_Name → Final_Station
```

---

## Troubleshooting: What To Check

### ❌ **Still shows "Loading stations..."**

**Cause 1: trainData is null**
- Solution: Check browser Network tab
  - Open DevTools (F12) → Network tab
  - Click "Apply Configuration"
  - Look for these API calls:
    - ✅ `POST /api/config/setup` → Status 200
    - ✅ `POST /api/train/initialize` → Status 200
    - ✅ `GET /api/train/state` → Status 200
  - If any shows ❌, click it and check the Response tab

**Cause 2: Authorization missing**
- Solution: Check if you're logged in
  1. Open DevTools Console (F12 → Console)
  2. Paste: `localStorage.getItem('token')`
  3. Should return a long string starting with `eyJ...`
  4. If empty, login first at http://localhost:3000

**Cause 3: Backend error**
- Solution: Check backend logs
  1. Open backend terminal
  2. Look for errors like "Train not initialized"
  3. Or look for MongoDB connection errors

### ❌ **Shows error: "Train is not initialized"**

**Cause:** initializeTrain endpoint failed
- Solution:
  1. Check if the passengers collection exists in PassengersDB
  2. Check if Journey_Date format is correct
  3. Check if Train_Details has the right station collection name
  4. Open backend terminal and look for error messages

### ❌ **API calls succeed but frontend still blank**

**Cause:** Timing issue or state update delayed
- Solution: Already fixed - added 300ms delay before closing ConfigPage
- Try refreshing the page (F5) after initialization

---

## Expected Values After Initialization

### Home Page Header
| Field | Value |
|-------|-------|
| Train Name | Amaravathi Express |
| Train No | 17225 |
| Journey Date | 2025-11-28 |
| Current Station | (first station from DB) |
| Route | First Station → Last Station |

### Train Simulation Section
| Section | Should Show |
|---------|------------|
| Train Controls | "Next Station" and "Reset" buttons |
| Phase 1 | "Initial reallocation phase" box |
| Reallocation | "Upgrade RAC passengers" box |
| No-Show | Input field to enter PNR |
| Statistics | Total passengers, CNF, RAC counts |

### Bottom of Page
| Metric | Should Show |
|--------|------------|
| Total Passengers | Count from passengers collection |
| CNF Passengers | Count of PNR_Status = "CNF" |
| RAC Passengers | Count of PNR_Status = "RAC" |
| Current Onboard | Total passengers |
| Vacant Berths | Calculated from coaches |

---

## Quick Debug Commands

**In browser console:**
```javascript
// Check if logged in
localStorage.getItem('token')  // Should return token

// Check stored user
JSON.parse(localStorage.getItem('user'))
// Should show: {username: "...", role: "ADMIN", ...}
```

**In backend terminal:**
```powershell
# Watch logs while initializing
# Should see:
# 🔄 Loading train data...
# 📍 Loading stations...
# 🚃 Initializing coaches...
# 👥 Loading passengers...
# 🎫 Allocating passengers...
# 🎯 Building RAC queue...
```

---

## If Nothing Works

**Step 1:** Verify all 4 servers are running
```powershell
# In terminal, check:
Get-Process node
# Should show multiple node processes
```

**Step 2:** Check backend logs for errors
- Stop backend: `Ctrl + C`
- Start again: `npm run dev`
- Look for error messages

**Step 3:** Check MongoDB connection
- Verify MongoDB is running locally
- Verify databases exist: `rac`, `PassengersDB`
- Verify collections exist

**Step 4:** Clear browser cache
- In DevTools: Application → Storage → Clear All
- Refresh page
- Try initialization again

---

## What Data Flows Where

```
Config Form Submission
    ↓
POST /api/config/setup (store config in memory)
    ↓
POST /api/train/initialize (load train data, allocate passengers)
    ↓
GET /api/train/state (get full state)
    ↓
Frontend sets trainData = response.data
    ↓
ConfigPage closes
    ↓
App navigates to Home page
    ↓
Home page renders all train details
```

Each step must complete successfully for the next to work!

