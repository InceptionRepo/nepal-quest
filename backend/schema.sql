-- schema.sql
-- Run this to reset and rebuild your entire database
-- WARNING: This drops all existing tables

PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

-- ============================================
-- DROP EXISTING TABLES (clean slate)
-- ============================================
DROP TABLE IF EXISTS generated_itineraries;
DROP TABLE IF EXISTS cached_stories;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS accommodation_estimates;
DROP TABLE IF EXISTS transport_links;
DROP TABLE IF EXISTS visitor_data;
DROP TABLE IF EXISTS festival_destination_link;
DROP TABLE IF EXISTS festivals;
DROP TABLE IF EXISTS weather_monthly;
DROP TABLE IF EXISTS destinations;

-- ============================================
-- TABLE 1: DESTINATIONS
-- ============================================
CREATE TABLE destinations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_nepali TEXT,
    slug TEXT UNIQUE NOT NULL,

    region TEXT NOT NULL,
    district TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    nearest_city TEXT,
    distance_from_city_km REAL,

    category TEXT NOT NULL CHECK(category IN (
        'temple', 'trek', 'nature', 'heritage',
        'adventure', 'lake', 'village', 'city',
        'pilgrimage', 'viewpoint', 'national_park'
    )),
    subcategory TEXT,
    tags TEXT,

    altitude_meters INTEGER DEFAULT 0,
    entry_fee_npr INTEGER DEFAULT 0,
    entry_fee_foreigner_npr INTEGER DEFAULT 0,
    avg_visit_duration_hours REAL DEFAULT 2.0,
    best_time_of_day TEXT DEFAULT 'anytime',

    difficulty_level INTEGER DEFAULT 1 CHECK(difficulty_level BETWEEN 1 AND 5),
    wheelchair_accessible INTEGER DEFAULT 0,
    requires_permit INTEGER DEFAULT 0,
    permit_type TEXT,
    permit_cost_npr INTEGER DEFAULT 0,

    popularity_score INTEGER DEFAULT 50 CHECK(popularity_score BETWEEN 1 AND 100),
    cultural_significance INTEGER DEFAULT 5 CHECK(cultural_significance BETWEEN 1 AND 10),
    offbeat_score INTEGER DEFAULT 5 CHECK(offbeat_score BETWEEN 1 AND 10),

    best_months TEXT,
    avoid_months TEXT,

    thumbnail_url TEXT,
    description_short TEXT,
    description_long TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dest_category ON destinations(category);
CREATE INDEX idx_dest_region ON destinations(region);
CREATE INDEX idx_dest_difficulty ON destinations(difficulty_level);
CREATE INDEX idx_dest_popularity ON destinations(popularity_score);

-- ============================================
-- TABLE 2: FESTIVALS
-- ============================================
CREATE TABLE festivals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_nepali TEXT,

    typical_month INTEGER,
    date_start_2025 TEXT,
    date_end_2025 TEXT,
    duration_days INTEGER DEFAULT 1,

    type TEXT CHECK(type IN (
        'religious', 'cultural', 'national', 'local', 'seasonal'
    )),
    religion TEXT,

    crowd_multiplier REAL DEFAULT 1.5,
    national_holiday INTEGER DEFAULT 0,

    description TEXT,
    tourist_tip TEXT,
    photography_allowed INTEGER DEFAULT 1,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE 3: FESTIVAL <-> DESTINATION LINK
-- ============================================
CREATE TABLE festival_destination_link (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    festival_id INTEGER NOT NULL REFERENCES festivals(id) ON DELETE CASCADE,
    destination_id INTEGER NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
    is_primary_location INTEGER DEFAULT 0,
    special_ritual TEXT,
    UNIQUE(festival_id, destination_id)
);

-- ============================================
-- TABLE 4: VISITOR DATA (ML training)
-- ============================================
CREATE TABLE visitor_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    destination_id INTEGER NOT NULL REFERENCES destinations(id),

    month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
    day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
    year INTEGER DEFAULT 2024,

    is_festival INTEGER DEFAULT 0,
    is_peak_season INTEGER DEFAULT 0,
    weather_condition TEXT DEFAULT 'clear',
    temperature_avg INTEGER,

    visitor_count INTEGER DEFAULT 0,
    crowd_level INTEGER DEFAULT 1 CHECK(crowd_level BETWEEN 1 AND 5),

    data_source TEXT DEFAULT 'synthetic'
);

CREATE INDEX idx_visitor_dest ON visitor_data(destination_id);
CREATE INDEX idx_visitor_month ON visitor_data(month);

-- ============================================
-- TABLE 5: TRANSPORT LINKS
-- ============================================
CREATE TABLE transport_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_destination_id INTEGER REFERENCES destinations(id),
    to_destination_id INTEGER REFERENCES destinations(id),

    from_city TEXT,
    to_city TEXT,

    transport_mode TEXT NOT NULL CHECK(transport_mode IN (
        'bus', 'tourist_bus', 'flight', 'jeep', 'taxi',
        'walk', 'microbus', 'boat', 'cable_car'
    )),

    duration_hours REAL NOT NULL,
    cost_npr INTEGER DEFAULT 0,
    cost_tourist_npr INTEGER,

    frequency TEXT,
    road_condition TEXT,
    scenic_rating INTEGER DEFAULT 3 CHECK(scenic_rating BETWEEN 1 AND 5),
    monsoon_affected INTEGER DEFAULT 0,
    operational_months TEXT,

    notes TEXT
);

-- ============================================
-- TABLE 6: ACCOMMODATION ESTIMATES
-- ============================================
CREATE TABLE accommodation_estimates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    destination_id INTEGER NOT NULL REFERENCES destinations(id),

    budget_range TEXT NOT NULL CHECK(budget_range IN (
        'budget', 'mid', 'comfort', 'luxury'
    )),

    type TEXT,
    avg_price_per_night_npr INTEGER NOT NULL,
    sample_name TEXT,
    rating REAL,

    available_months TEXT,
    booking_required INTEGER DEFAULT 0,
    has_wifi INTEGER DEFAULT 0,
    has_hot_water INTEGER DEFAULT 1,

    notes TEXT
);

-- ============================================
-- TABLE 7: USERS (Authentication)
-- ============================================
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'guide', 'admin')),
    phone TEXT,
    nationality TEXT,

    -- Guide-specific fields
    bio TEXT,
    experience_years INTEGER,
    languages TEXT,  -- comma-separated: "English,Nepali,Hindi"
    specialties TEXT,  -- comma-separated: "trekking,cultural,wildlife"
    hourly_rate_npr INTEGER,
    is_verified INTEGER DEFAULT 0,
    profile_photo_url TEXT,

    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- TABLE 8: USER PROFILES (Travel preferences)
-- ============================================
CREATE TABLE user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    session_id TEXT UNIQUE NOT NULL,

    nationality TEXT,
    age_group TEXT CHECK(age_group IN (
        'under_18', '18_25', '26_35', '36_50', '50_plus'
    )),

    travel_date_start TEXT,
    travel_date_end TEXT,
    trip_duration_days INTEGER,

    budget_level TEXT CHECK(budget_level IN (
        'backpacker', 'moderate', 'comfort', 'luxury'
    )),
    budget_total_usd INTEGER,
    group_size INTEGER DEFAULT 1,
    group_type TEXT CHECK(group_type IN (
        'solo', 'couple', 'family', 'friends', 'group_tour'
    )),

    interests TEXT,
    fitness_level INTEGER DEFAULT 3 CHECK(fitness_level BETWEEN 1 AND 5),

    accessibility_needs TEXT,
    dietary_restrictions TEXT,
    previously_visited TEXT,
    special_requests TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE 9: GUIDE REQUESTS
-- ============================================
CREATE TABLE guide_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    guide_id INTEGER REFERENCES users(id),  -- NULL if requesting any available guide

    -- Trip details
    trip_title TEXT,
    destination_ids TEXT,  -- comma-separated destination IDs
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    group_size INTEGER DEFAULT 1,

    -- Request details
    message TEXT,
    budget_range TEXT,
    special_requirements TEXT,

    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK(status IN (
        'pending', 'accepted', 'rejected', 'completed', 'cancelled'
    )),
    guide_response TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_guide_requests_user ON guide_requests(user_id);
CREATE INDEX idx_guide_requests_guide ON guide_requests(guide_id);
CREATE INDEX idx_guide_requests_status ON guide_requests(status);

-- ============================================
-- TABLE 10: GUIDE REQUEST MESSAGES
-- ============================================
CREATE TABLE guide_request_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL REFERENCES guide_requests(id) ON DELETE CASCADE,
    sender_user_id INTEGER NOT NULL REFERENCES users(id),
    body TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_grm_request_id ON guide_request_messages(request_id);
CREATE INDEX idx_grm_created_at ON guide_request_messages(created_at);

-- ============================================
-- TABLE 11: GENERATED ITINERARIES
-- ============================================
CREATE TABLE generated_itineraries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES user_profiles(id),

    itinerary_json TEXT NOT NULL,
    raw_ai_response TEXT,
    generation_time_ms INTEGER,
    model_used TEXT,

    title TEXT,
    total_days INTEGER,
    total_budget_estimate_npr INTEGER,
    destinations_included TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE 9: CACHED STORIES
-- ============================================
CREATE TABLE cached_stories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    destination_id INTEGER NOT NULL REFERENCES destinations(id),

    visitor_nationality TEXT DEFAULT 'general',
    visit_month INTEGER,
    nearby_festival TEXT,

    story_title TEXT,
    story_content TEXT NOT NULL,
    key_facts TEXT,
    local_phrases TEXT,
    etiquette_tips TEXT,

    generated_by TEXT,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    cache_key TEXT UNIQUE
);

CREATE INDEX idx_story_cache ON cached_stories(cache_key);
CREATE INDEX idx_story_dest ON cached_stories(destination_id);

-- ============================================
-- TABLE 10: WEATHER DATA
-- ============================================
CREATE TABLE weather_monthly (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    region TEXT NOT NULL,
    month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),

    temp_min_celsius REAL,
    temp_max_celsius REAL,
    rainfall_mm REAL,
    weather_condition TEXT,
    humidity_percent INTEGER,

    tourism_suitability INTEGER CHECK(tourism_suitability BETWEEN 1 AND 5),

    UNIQUE(region, month)
);
