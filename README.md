# Spotter AI - Full-Stack Trucker Trip Planner

A professional-grade algorithmic trip planner for truck drivers, built for the Spotter AI Full Stack Developer assessment. This application calculates optimal routes, adheres to FMCSA Hours of Service (HOS) regulations, and generates dynamic Electronic Logging Device (ELD) logs.

## 🚀 Features

### 1. Smart Trip Planning
- **Route Calculation**: Uses OpenStreetMap and OSRM to calculate distances and driving times.
- **Geocoding**: Automatic address resolution using Nominatim.
- **Turn-by-Turn Instructions**: Detailed route instructions for the driver.

### 2. HOS Compliance Engine (FMCSA Standards)
- **11-Hour Driving Limit**: Prevents driving beyond 11 hours without a 10-hour rest.
- **14-Hour Duty Window**: Tracks the 14-hour window from the start of the shift.
- **30-Minute Break**: Automatically schedules a break after 8 cumulative hours of driving.
- **70-Hour / 8-Day Cycle**: Considers the driver's remaining cycle hours.
- **Fueling Logic**: Automatically inserts 30-minute fueling stops every 1,000 miles.
- **Buffer Times**: Includes 1-hour buffers for both pickup and drop-off operations.

### 3. Dynamic ELD Logs
- **Visual Grid**: A high-fidelity 24-hour grid for each day of the trip.
- **Status Tracking**: Visualizes "Off Duty", "Sleeper Berth", "Driving", and "On Duty" statuses.
- **Remarks Table**: Detailed logs of every status change with timestamps and locations.
- **Multi-Day Support**: Automatically generates separate logs for each day of a long-haul trip.

## 🛠 Technology Stack

### Backend
- **Django**: Core framework.
- **Django REST Framework (DRF)**: For building the API.
- **Requests**: For communication with external routing APIs.
- **Geopy**: For distance calculations.

### Frontend
- **React (Vite)**: Modern, fast frontend development.
- **Leaflet & React-Leaflet**: Interactive map visualization.
- **Framer Motion**: Smooth UI animations and transitions.
- **Lucide React**: Beautiful icons.
- **Vanilla CSS**: Custom premium styling with Glassmorphism and Outfit typography.

## 📦 Setup & Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run migrations:
   ```bash
   python manage.py migrate
   ```
4. Start the server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev -- --port 3000
   ```

## 📋 Assumptions
- Driver is property-carrying and follows the 70hrs/8days rule.
- Average speed is calculated based on the routing API's time/distance estimates.
- Fueling takes 30 minutes.
- Pickup and drop-off take 1 hour each.
- No adverse driving conditions or emergency exceptions are considered.

## 📹 Loom Video Script (Suggested)
To help you with your submission, here is a suggested structure for your 3-5 minute video:
1. **Introduction (30s)**: Introduce yourself and the app. Mention the tech stack (Django/React).
2. **Trip Planning (1m)**: Demonstrate entering a trip (e.g., NY to LA). Show how the app geocodes locations and calculates the route using OSRM.
3. **Map & Routing (1m)**: Point out the route on the map and the markers for mandatory rest stops, fueling, and sleeper berth periods.
4. **ELD Logs (1m)**: Show the generated logs. Explain how the HOS logic (11h drive, 14h window, 70h cycle) works and how it translates to the visual graph.
5. **Code Overview (30s)**: Briefly show `hos_logic.py` and the `ELDLog` component in `App.jsx`.

## 🌐 Hosting Guide (Vercel + Render)
1. **Frontend**: Deploy the `frontend` folder to Vercel. Point the API URL to your backend.
2. **Backend**: Deploy the `backend` folder to Render.com or Heroku.
3. **Environment Variables**: Set `REACT_APP_API_URL` on Vercel to your Render backend URL.

---
**Author**: Antigravity (AI Assistant) for Ritik Mehra
**Status**: Production-Ready for Assessment
**Submission Checklist**: [ ] GitHub Code [ ] Hosted Link [ ] Loom Video
