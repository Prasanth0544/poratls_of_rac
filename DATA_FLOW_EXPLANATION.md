# Complete Data Flow in RAC System

## Configuration Page Data Sources

### 1. **Train Number & Train Name**
**Sources:**
- `trainNo` - **User enters manually** in Config Page
- `trainName` - **Auto-fetched from `Train_Details` collection**

**Flow:**
```
User enters trainNo (e.g., "17225")
  ↓
ConfigPage calls getTrains() → reads from rac.Trains_Details
  ↓
Matches trainNo and auto-populates trainName
  ↓
Example: trainNo "17225" → trainName "Amaravathi Express"
```

**Code Location:** `frontend/src/pages/ConfigPage.jsx` lines 54-65
```javascript
const item = trainList.find((t) => String(t.trainNo) === no);
update("trainNo", no);
if (item) {
  update("trainName", item.trainName || "");
  if (item.stationCollectionName) {
    update("stationsCollection", item.stationCollectionName);
  }
}
```

---

### 2. **Journey Date**
**Source:** **User enters manually** in Config Page

**Purpose:**
- Used to query passenger data from the passengers collection
- Converts format: `YYYY-MM-DD` (frontend) → `DD-MM-YYYY` (MongoDB)

**Flow:**
```
User selects date (e.g., 2025-11-28)
  ↓
Sent to backend as part of payload
  ↓
Used in DataService.loadPassengers() to query:
  passengers collection with Journey_Date = "28-11-2025"
```

**Code Location:** `backend/services/DataService.js` lines 72-80
```javascript
let queryDate = journeyDate;
if (journeyDate && /^\d{4}-\d{2}-\d{2}$/.test(journeyDate)) {
  const [year, month, day] = journeyDate.split("-");
  queryDate = `${day}-${month}-${year}`;  // Convert to DD-MM-YYYY
}
```

---

### 3. **Stations Collection Name**
**Source:** **Auto-fetched from `Train_Details` collection**

**Flow:**
```
User selects trainNo
  ↓
ConfigPage auto-populates stationsCollection from Train_Details.stationCollectionName
  ↓
Example: trainNo "17225" → stationCollectionName "17225_NEW_ROUTE"
  ↓
Backend uses this to load stations data
```

---

### 4. **MongoDB Defaults**
**Sources:**
| Field | Default Value | Source |
|-------|---------------|--------|
| `mongoUri` | `mongodb://localhost:27017` | Hardcoded in ConfigPage.jsx |
| `stationsDb` | `rac` | Hardcoded in ConfigPage.jsx |
| `passengersDb` | `PassengersDB` | Hardcoded in ConfigPage.jsx |
| `passengersCollection` | User enters manually | Required field in form |

---

## Complete Data Initialization Flow

### Step 1: Configuration Setup
```
User fills Config Form:
├── trainNo: 17225 (manual entry)
├── journeyDate: 2025-11-28 (manual entry)
├── trainName: Amaravathi Express (auto from Train_Details)
├── stationsCollection: 17225_NEW_ROUTE (auto from Train_Details)
├── passengersCollection: 17225_passengers (manual entry)
└── mongoUri, stationsDb, passengersDb (defaults)
    ↓
POST /api/config/setup
    ↓
Backend stores in global.RAC_CONFIG
```

### Step 2: Train Initialization
```
POST /api/initialize-train with trainNo=17225, journeyDate=2025-11-28
    ↓
Backend calls DataService.loadTrainData(trainNo, journeyDate)
    ↓
├─ Load Train_Details for:
│  ├── Sleeper coach count
│  ├── 3A coach count
│  └── Train name (fallback)
│  
├─ Load Stations from configured stationsCollection
│  └── Creates station list with SNO, code, name, timings
│  
├─ Load Passengers from passengers collection WHERE:
│  ├── Train_Number = 17225
│  └── Journey_Date = "28-11-2025"
│  
├─ Allocate passengers to berths
│  ├── Match boarding/deboarding stations
│  ├── Find available berths in coaches
│  └── Mark as CNF (Confirmed) or RAC (Reservation Against Cancellation)
│  
└─ Build RAC Queue
   └── Sorted by RAC number (priority)
```

### Step 3: System Ready
```
Frontend receives initialized trainState:
├── stations: [18 stations with timings]
├── coaches: [13 coaches - 9 SL, 0 3A, 4 others]
├── passengers: Allocated to berths (CNF)
├── racQueue: Waiting list (RAC)
└── stats: Updated totals
    ↓
Display train visualization with all data
```

---

## Data Source Summary

| Data Point | Source | Entry Method | Used For |
|-----------|--------|--------------|----------|
| **Train Number** | User | Manual entry | Identifier for all queries |
| **Train Name** | Train_Details | Auto-fetch | Display only |
| **Journey Date** | User | Manual entry (date picker) | Query passengers for this date |
| **Stations List** | Station collection (referenced in Train_Details) | Auto-load | Journey routing |
| **Coach Counts** | Train_Details | Auto-load | Initialize coach structure |
| **Passengers** | Passengers collection | Auto-load | Allocate to berths |
| **Station Collection Name** | Train_Details.stationCollectionName | Auto-fetch | Know which collection has stations |
| **Passengers Collection** | User | Manual entry | Know which collection has passengers |
| **MongoDB Connection** | Hardcoded default | Provided | Connection to database |

---

## Key Points

✅ **Train No & Journey Date**: User enters manually - these are **identifiers** for the train journey
✅ **Train Name & Station Collection**: Auto-fetched from `Train_Details` collection
✅ **Passengers Data**: Queried based on Train_Number AND Journey_Date
✅ **Stations Data**: Loaded from collection specified in Train_Details
✅ **Coach Details**: Fetched from Train_Details for accurate coach configuration

---

## Database Collections Used

1. **`rac.Trains_Details`** - Contains:
   - Train_No
   - Train_Name
   - Sleeper_Coaches_Count
   - Three_TierAC_Coaches_Count
   - stationCollectionName (which collection has the stations)

2. **`rac.<stationCollectionName>`** (e.g., `rac.17225_NEW_ROUTE`) - Contains:
   - SNO (Station Number)
   - Station_Code
   - Station_Name
   - Arrival_Time
   - Departure_Time
   - Distance, Day, Halt_Duration, etc.

3. **`PassengersDB.<passengersCollection>`** (e.g., `PassengersDB.17225_passengers`) - Contains:
   - Train_Number (must match trainNo entered)
   - Journey_Date (must match date entered - format DD-MM-YYYY)
   - Assigned_Coach
   - Assigned_berth
   - PNR_Status (CNF or RAC)
   - Boarding_Station, Deboarding_Station
   - Passenger details (Name, Age, Gender, etc.)

---

## Example Configuration

**User Input:**
```
mongoUri: mongodb://localhost:27017
stationsDb: rac
stationsCollection: (auto: 17225_NEW_ROUTE)
passengersDb: PassengersDB
passengersCollection: 17225_passengers (user enters)
trainNo: 17225 (user enters)
trainName: (auto: Amaravathi Express)
journeyDate: 2025-11-28 (user enters)
```

**Query Generated:**
```
1. Find train details: rac.Trains_Details { Train_No: 17225 }
2. Load stations: rac.17225_NEW_ROUTE.find({})
3. Load passengers: PassengersDB.17225_passengers.find({
     Train_Number: 17225,
     Journey_Date: "28-11-2025"
   })
```

