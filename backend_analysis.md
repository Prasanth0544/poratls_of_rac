# Backend Analysis

## Architecture Overview
The backend is built using **Node.js** and **Express**, following a **Service-Controller-Route** architecture. It uses **MongoDB** for persistent storage and **WebSockets** for real-time client updates. The core of the system is an **In-Memory Train State** that ensures high-performance access and manipulation of passenger data during the journey.

### Core Components

1.  **Server Entry Point (`server.js`)**:
    *   Initializes Express app and MongoDB connection.
    *   Sets up WebSocket server (`wsManager`).
    *   Mounts API routes at `/api`.

2.  **In-Memory State (`models/TrainState.js`)**:
    *   **Singleton-like behavior**: Maintained by `trainController` as `globalTrainState`.
    *   **Structure**:
        *   `coaches`: Array of Coach objects (S1-S9, B1-B2, etc.).
        *   `racQueue`: Array of RAC passengers waiting for confirmation.
        *   `stations`: Array of station objects with distances and codes.
        *   `stats`: Real-time counters (Total, Onboard, CNF, RAC, Vacant).
        *   `currentStationIdx`: Integer tracking journey progress.
        *   `journeyStarted`: Boolean flag.

3.  **Services (`services/`)**:
    *   **`ReallocationService.js`**: **The Brain**. Handles vacancy detection, eligibility logic, and upgrade processing.
    *   **`DataService.js`**: **The Loader**. Fetches data from MongoDB (Collections: `Train_Details`, `Stations`, `Passengers`) and hydrates the `TrainState`.
    *   **`UpgradeNotificationService.js`**: Manages lifecycle of upgrade offers (Creation, Expiry, Acceptance).
    *   **`ValidationService.js`**: Validates PNRs and input data.

4.  **Controllers (`controllers/`)**:
    *   **`trainController`**: Lifecycle management (Init, Start, Next Station, Reset).
    *   **`reallocationController`**: Exposes reallocation logic to API.
    *   **`passengerController`**: Passenger search and listing.
    *   **`visualizationController`**: Data for frontend graphs/matrices.
    *   **`tteController`**: TTE portal operations.

## Data Model: `TrainState`

The `TrainState` class is the central data structure.

### `Coach` Object
```javascript
{
  coachNo: "S1",
  class: "SL", // or "3A"
  capacity: 72, // or 64 for 3A
  berths: [ ...Berth Objects... ]
}
```

### `Berth` Object
```javascript
{
  berthNo: 1,
  fullBerthNo: "S1-1",
  type: "Lower Berth",
  status: "OCCUPIED", // VACANT, OCCUPIED, SHARED
  segmentOccupancy: [ "PNR1", "PNR1", null, "PNR2" ], // Array mapping station segments to PNRs
  passengers: [ ...Passenger Objects... ]
}
```

### `Passenger` Object (In-Memory)
```javascript
{
  pnr: "1234567890",
  name: "John Doe",
  fromIdx: 2, // Station Index
  toIdx: 5,
  boarded: true,
  noShow: false,
  passengerStatus: "Online", // or "Offline"
  racStatus: "RAC 5" // or "-" if CNF
}
```

## API Reference

### Train Operations
| Method | Endpoint | Description | Middleware |
| :--- | :--- | :--- | :--- |
| `POST` | `/train/initialize` | Load data from DB | `validateTrainInit` |
| `POST` | `/train/start-journey` | Start journey (board origin pax) | `checkTrainInitialized` |
| `POST` | `/train/next-station` | Move to next station | `checkJourneyStarted` |
| `POST` | `/train/reset` | Reset system to initial state | `checkTrainInitialized` |
| `GET` | `/train/state` | Get full train state | `checkTrainInitialized` |

### Reallocation & RAC
| Method | Endpoint | Description | Middleware |
| :--- | :--- | :--- | :--- |
| `GET` | `/train/rac-queue` | Get filtered RAC queue | `checkJourneyStarted` |
| `GET` | `/train/vacant-berths` | Get all vacant berths | `checkJourneyStarted` |
| `GET` | `/reallocation/eligibility` | Get eligibility matrix | `checkJourneyStarted` |
| `POST` | `/passenger/no-show` | Mark passenger as no-show | `checkTrainInitialized` |

### Passenger Data
| Method | Endpoint | Description | Middleware |
| :--- | :--- | :--- | :--- |
| `GET` | `/passengers/all` | List all passengers | `checkJourneyStarted` |
| `GET` | `/passenger/search/:pnr` | Search by PNR | `checkJourneyStarted` |
| `POST` | `/passengers/add` | Add new passenger | `checkTrainInitialized` |

### Visualization
| Method | Endpoint | Description | Middleware |
| :--- | :--- | :--- | :--- |
| `GET` | `/visualization/segment-matrix` | Segment occupancy data | `checkJourneyStarted` |
| `GET` | `/visualization/vacancy-matrix` | Detailed vacancy view | `checkJourneyStarted` |
| `GET` | `/visualization/berth-timeline/:c/:b` | Timeline for specific berth | `checkJourneyStarted` |

### TTE & Passenger Portal
| Method | Endpoint | Description | Middleware |
| :--- | :--- | :--- | :--- |
| `POST` | `/tte/mark-boarded` | Manual boarding | `checkJourneyStarted` |
| `POST` | `/passenger/accept-upgrade` | Accept upgrade offer | `checkJourneyStarted` |

## Security & Validation
*   **`checkTrainInitialized`**: Ensures `globalTrainState` exists before processing requests.
*   **`checkJourneyStarted`**: **Critical Security Feature**. Blocks access to passenger data endpoints (returns 400) if the journey has not officially started. This prevents data leakage before departure.
