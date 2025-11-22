# Frontend Analysis

## Architecture Overview
The frontend is a **React.js Single Page Application (SPA)**. It uses a custom state-based router in `App.jsx` to manage views, ensuring a seamless user experience without full page reloads. Real-time updates are handled via a dedicated `WebSocket` service.

### Core Components

1.  **`App.jsx` (The Controller)**:
    *   **State**: `trainData`, `journeyStarted`, `currentPage`.
    *   **WebSocket**: Listens for `train_update`, `rac_reallocation`, `no_show`.
    *   **Routing**: Renders pages based on `currentPage` ('home', 'coaches', 'reallocation', etc.).
    *   **Global Actions**: `handleStartJourney`, `handleNextStation`, `handleReset`.

2.  **`HomePage.jsx` (The Dashboard)**:
    *   **Displays**: Train status, Current Station, Quick Stats (Total, CNF, RAC).
    *   **Controls**: "Start Journey", "Next Station", "Reset".
    *   **Navigation**: Cards to access other pages.
    *   **Logic**: Stats show `"-"` until `journeyStarted` is true.

3.  **`CoachesPage.jsx` (The Visualizer)**:
    *   **View**: Grid layout of coaches (S1-S9, B1-B2).
    *   **Logic**:
        *   Fetches `trainData.coaches`.
        *   Calculates berth status (Vacant/Occupied) based on `segmentOccupancy` and `currentStationIdx`.
        *   **Grid**: 8-column layout for berths.
    *   **Interactivity**: Click berth to see passenger details in a modal.

4.  **`ReallocationPage.jsx` (The Manager)**:
    *   **View**: Tabs for "Vacant Berths", "RAC Queue", "Eligibility Matrix".
    *   **API Calls**:
        *   `/train/vacant-berths`
        *   `/train/rac-queue`
        *   `/reallocation/eligibility`
    *   **Logic**: Allows manual review of the system's reallocation decisions.

5.  **`VisualizationPage.jsx` (The Analyst)**:
    *   **View**: Charts and Graphs.
    *   **API Calls**:
        *   `/visualization/segment-matrix`
        *   `/visualization/graph`
        *   `/visualization/heatmap`
    *   **Logic**: Visualizes occupancy trends and station-wise stats.

## Data Flow & State Management

1.  **Initialization**:
    *   `App.jsx` calls `/train/state` on mount/update.
    *   Sets `trainData` global state.
    *   Passes `trainData` down to all pages as props.

2.  **Real-Time Updates (WebSocket)**:
    *   **Event**: `wsService` receives `train_update` or `stats_update`.
    *   **Action**: `App.jsx` triggers `loadTrainState()`.
    *   **Result**: Full train state is re-fetched from backend, ensuring UI is perfectly synced with in-memory backend state.

3.  **User Actions**:
    *   **Start Journey**: Calls `/train/start-journey` -> Updates `journeyStarted` -> UI unlocks data.
    *   **Next Station**: Calls `/train/next-station` -> Backend updates `currentStationIdx` -> Frontend reflects new station.
    *   **Mark No-Show**: Calls `/passenger/no-show` -> Backend updates passenger -> WebSocket triggers refresh -> UI updates berth status to "Vacant".

## Key UI Features

*   **Security UI**: Before journey start, stats show `"-"` and API calls to passenger data are blocked (handled gracefully).
*   **Responsive Design**: Uses CSS Modules and global `App.css` for a clean, professional look.
*   **Feedback**: Loading spinners for async actions, Alerts for success/error messages.
