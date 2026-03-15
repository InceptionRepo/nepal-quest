# NepalQuest — AI-Powered Nepal Travel Intelligence

A full-stack web application with 3 AI engines for personalized Nepal travel planning, built for the 24-hour hackathon at Embark College, Pulchowk, Nepal.

## Features

🧭 **Engine 1 — Personalized Itinerary Generator**
- Takes user travel preferences and generates a complete day-by-day Nepal itinerary
- Uses rule-based scoring system + Random Forest classifier
- Tailored to duration, interests, fitness level, budget, and travel season

🗺️ **Engine 2 — Crowd & Season Predictor**
- Predicts crowd density at Nepal destinations for any selected month
- Color-coded interactive Leaflet.js map showing crowd levels
- Monthly trend analysis powered by Random Forest regressor

🏛️ **Engine 3 — Cultural Heritage Storyteller**
- Rich cultural stories and local secrets for 5 UNESCO World Heritage Sites
- Etiquette tips, entry fees, and insider recommendations
- Side-by-side "Tourists Visit vs Locals Love" comparison

## Tech Stack

**Backend:**
- Python 3.10+ with Flask
- scikit-learn for ML models
- pandas, numpy for data handling
- joblib for model persistence

**Frontend:**
- React.js with functional components and hooks
- Tailwind CSS for styling
- Leaflet.js + react-leaflet for interactive maps
- Recharts for crowd trend visualizations
- Axios for API calls

## Prerequisites

- Python 3.10 or higher
- Node.js 16+ and npm
- pip (Python package manager)

## Setup Instructions

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install Python dependencies:**
   ```bash
   pip install flask flask-cors scikit-learn pandas numpy joblib
   ```

   *Alternative: use requirements.txt*
   ```bash
   pip install -r requirements.txt
   ```

3. **Train the ML models (run this once):**
   ```bash
   python train_models.py
   ```

   This will:
   - Train the Itinerary Recommendation RandomForestClassifier
   - Train the Crowd Prediction RandomForestRegressor
   - Save both models to `backend/models/` directory as `.pkl` files
   - Display training metrics and feature importances

4. **Start the Flask backend server:**
   ```bash
   python app.py
   ```

   The backend will start on **http://localhost:5000**

   You should see:
   ```
   ==================================================
   NepalQuest API Server
   Running on http://localhost:5000
   ==================================================
   ```

### Frontend Setup

Open a **new terminal** (keep the backend running in the first terminal).

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

   This installs React, Leaflet, Recharts, Tailwind CSS, and other dependencies.

3. **OPTIONAL — Download Nepal Districts GeoJSON:**

   The map works perfectly **without this file** (it will show destination pins on a plain OpenStreetMap).

   If you want district boundary overlays:
   ```bash
   # Download the file to frontend/public/
   curl -o public/nepal-districts.geojson https://raw.githubusercontent.com/mesaugat/gis-nepal/master/src/nepal-districts.geojson
   ```

   *Or manually download from:*
   https://raw.githubusercontent.com/mesaugat/gis-nepal/master/src/nepal-districts.geojson

   Save it as `frontend/public/nepal-districts.geojson`

4. **Start the React development server:**
   ```bash
   npm start
   ```

   The frontend will open automatically at **http://localhost:3000**

## Running the Application

### Complete Step-by-Step Process:

**Terminal 1 — Backend:**
```bash
cd backend
pip install -r requirements.txt
python train_models.py
python app.py
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm start
```

The browser will automatically open to http://localhost:3000

## Using the Application

1. **Onboarding Form:**
   - Choose trip duration (3/5/7/10/14 days)
   - Select your interests (heritage, trekking, wildlife, etc.)
   - Pick fitness level (Easy, Moderate, High)
   - Set your budget (Budget/Mid-range/Premium)
   - Choose travel month and traveler type

2. **Dashboard View:**
   - **Left Panel (60%):** Interactive Nepal map
     - Click month buttons to see crowd levels change
     - Toggle "Hidden Gems" filter
     - Click markers to see crowd trends or heritage site details
   - **Right Panel (40%):** Your personalized itinerary
     - Day-by-day breakdown with morning/afternoon/evening activities
     - Transport methods and daily costs
     - Total trip cost in USD and NPR
     - Confidence score from AI model

3. **Heritage Sites:**
   - Click heritage site markers (Pashupatinath, Boudhanath, Patan, Swayambhunath, Lumbini)
   - Read cultural stories, etiquette tips, and local secrets
   - Learn what tourists miss and what locals love

4. **Regenerate Itinerary:**
   - Click the "Regenerate" button to get a new itinerary with the same preferences

## Project Structure

```
nepalquest/
├── backend/
│   ├── app.py                     # Flask API server
│   ├── train_models.py            # ML model training script
│   ├── requirements.txt           # Python dependencies
│   ├── engines/
│   │   ├── itinerary_engine.py    # Engine 1 logic
│   │   ├── crowd_engine.py        # Engine 2 logic
│   │   └── heritage_engine.py     # Engine 3 logic
│   ├── models/                    # ML models (.pkl files)
│   │   ├── itinerary_model.pkl
│   │   └── crowd_model.pkl
│   └── data/                      # JSON data files
│       ├── destinations.json
│       ├── itineraries.json
│       ├── heritage_sites.json
│       └── user_profiles.json
└── frontend/
    ├── package.json
    ├── tailwind.config.js
    ├── public/
    │   ├── index.html
    │   └── nepal-districts.geojson (optional)
    └── src/
        ├── App.jsx
        ├── index.js
        ├── index.css
        └── components/
            ├── Navbar.jsx
            ├── OnboardingForm.jsx
            ├── NepalMap.jsx
            ├── ItineraryPanel.jsx
            ├── CrowdChart.jsx
            └── HeritagePanel.jsx
```

## API Endpoints

- `POST /api/itinerary` — Generate personalized itinerary
- `GET /api/destinations` — Get all destinations (basic info)
- `GET /api/crowd/all?month={1-12}` — Get crowd data for all destinations
- `GET /api/crowd/{dest_id}?month={1-12}` — Get crowd detail for one destination
- `GET /api/heritage` — List all heritage sites
- `GET /api/heritage/{site_id}` — Get full heritage site details

## Data Sources

All data is generated from 4 JSON files:
- **destinations.json** — 10 Nepal destinations with crowd scores, tags, costs
- **itineraries.json** — 4 pre-built itinerary templates
- **heritage_sites.json** — 5 UNESCO sites with cultural stories
- **user_profiles.json** — 25 training samples for ML model

## Troubleshooting

**Backend won't start:**
- Make sure you ran `python train_models.py` first
- Check that all dependencies are installed: `pip install -r requirements.txt`
- Ensure port 5000 is not in use

**Frontend can't connect to backend:**
- Verify backend is running on port 5000
- Check that `proxy: "http://localhost:5000"` is in package.json
- Try restarting the frontend: Ctrl+C then `npm start`

**Map shows no destinations:**
- Check browser console for errors
- Verify backend `/api/destinations` endpoint returns data
- Make sure both frontend and backend are running

**GeoJSON district boundaries not showing:**
- This is optional and doesn't affect functionality
- Download the file to `frontend/public/nepal-districts.geojson`
- Refresh the browser

## ML Model Details

**Itinerary Model (RandomForestClassifier):**
- Features: duration, fitness, budget, age group, 8 interest flags
- Target: recommended destination ID
- 100 trees, max depth 10
- ~90%+ training accuracy

**Crowd Model (RandomForestRegressor):**
- Features: month, destination type, region, altitude, is_hidden_gem
- Target: crowd score (1-10)
- 120 training samples (10 destinations × 12 months)
- R² score > 0.95

## Credits

Built for the 24-hour AI Hackathon at Embark College, Pulchowk, Nepal (2026)

**Tech Stack:**
- Frontend: React, Tailwind CSS, Leaflet.js, Recharts
- Backend: Flask, scikit-learn, pandas
- Data: Generated realistic Nepal tourism data

---

**Enjoy exploring Nepal with AI-powered intelligence!** 🏔️🇳🇵
