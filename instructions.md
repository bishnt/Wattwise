## Project Overview & Architecture

### What is WattWise?

WattWise is a gamified energy management platform that combines real-time interactive power simulation with AI-powered forecasting. Users interact with a 3D virtual home environment where they can control appliances in real-time, while a background simulation provides baseline power consumption. The system tracks actual vs forecasted consumption to reward efficient users through a leaderboard-based incentive system.

### Core Concept: Hybrid Power System

The application uses a **dual-layer power calculation system**:

1. **Background Simulation Layer** (Updated every 1 minute)
    
    - Generates baseline power consumption based on time of day, weather, occupancy patterns
    - Simulates automatic household systems (HVAC, refrigerator, water heater)
    - Calculated by backend simulation service
    - Provides realistic household baseline
2. **Interactive Layer** (Real-time, instantaneous)
    
    - User controls specific appliances in 3D environment (lights, TV, microwave, etc.)
    - Each appliance has defined power rating (watts)
    - User actions immediately affect total power consumption
    - Instant feedback via WebSocket
3. **Combined Power Flow**
    
    - **Redis Cache**: Stores current running total (background + interactive)
    - Updated in real-time for instant user feedback
    - **PostgreSQL TimescaleDB**: Stores 1-minute interval averages
    - Used for analytics, billing, forecasting, leaderboards
    - Clean historical data without noise from rapid user interactions

### Key Workflows

#### User Interaction Flow

1. User opens app, sees 3D home environment
2. WebSocket connects to backend, subscribes to user's power channel
3. Backend simulation calculates baseline power (once per minute)
4. User clicks appliance (e.g., turns on TV)
5. Frontend immediately sends WebSocket event
6. Backend adds appliance power to Redis running total
7. Backend broadcasts updated power via WebSocket
8. Frontend updates 3D environment and power gauge (< 100ms)
9. Every minute, backend averages Redis data and stores to PostgreSQL

#### Forecasting & Leaderboard Flow

1. ML service generates 24-hour forecast for each user daily
2. Backend tracks actual consumption from PostgreSQL minute intervals
3. Every hour, backend calculates actual vs forecast difference
4. Leaderboard service aggregates all users' performance
5. Users who consume less than forecast get positive scores
6. Leaderboard updates and broadcasts to all connected clients
7. At month end, billing system calculates incentives/penalties

---

## Technology Stack

### Backend Services

- **Node.js + Express**: REST API, WebSocket server, simulation engine
- **Socket.io**: Real-time bidirectional communication
- **Redis**: Sub-second caching, real-time power state, session management
- **PostgreSQL + TimescaleDB**: Time-series data storage, analytics
- **JWT**: Authentication and authorization

### ML Service

- **Python + Flask**: ML model serving API
- **XGBoost**: Energy consumption forecasting
- **Pandas/NumPy**: Data preprocessing and feature engineering
- **Scikit-learn**: Model evaluation and validation

### Frontend

- **Next.js 14 (App Router)**: React framework with SSR
- **TypeScript**: Type-safe development
- **Three.js**: 3D home environment rendering
- **Tailwind CSS**: Utility-first styling
- **Recharts**: Data visualization and charts
- **Socket.io-client**: WebSocket client
- **Zustand**: Lightweight state management

### Infrastructure & DevOps

- **Docker + Docker Compose**: Containerization and orchestration
- **Nginx**: Reverse proxy and load balancing
- **GitHub Actions**: CI/CD pipeline
- **PM2**: Process management (alternative to Docker in dev)
- **PostgreSQL**: Persistent data storage
- **Redis**: In-memory cache and real-time state

---

## Project Structure

```
wattwize/
├── backend/                           # Node.js Backend Service
│   ├── src/
│   │   ├── config/                    # Configuration files
│   │   │   ├── database.js            # PostgreSQL connection pool
│   │   │   ├── redis.js               # Redis client setup
│   │   │   ├── schema.sql             # Database schema with TimescaleDB
│   │   │   └── constants.js           # Application constants
│   │   │
│   │   ├── models/                    # Data Access Layer
│   │   │   ├── User.js                # User CRUD operations
│   │   │   ├── PowerReading.js        # Minute-interval power storage
│   │   │   ├── Forecast.js            # Forecast data operations
│   │   │   ├── Bill.js                # Billing records
│   │   │   ├── Anomaly.js             # Anomaly detection records
│   │   │   └── Leaderboard.js         # Leaderboard ranking data
│   │   │
│   │   ├── controllers/               # Request Handlers
│   │   │   ├── authController.js      # Login, register, JWT
│   │   │   ├── powerController.js     # Power data retrieval
│   │   │   ├── applianceController.js # Appliance state management
│   │   │   ├── forecastController.js  # Forecast generation coordination
│   │   │   ├── billController.js      # Billing operations
│   │   │   ├── leaderboardController.js # Leaderboard rankings
│   │   │   └── anomalyController.js   # Anomaly management
│   │   │
│   │   ├── routes/                    # API Route Definitions
│   │   │   ├── auth.js                # /api/auth/*
│   │   │   ├── power.js               # /api/power/*
│   │   │   ├── appliance.js           # /api/appliances/*
│   │   │   ├── forecast.js            # /api/forecast/*
│   │   │   ├── bill.js                # /api/bills/*
│   │   │   ├── leaderboard.js         # /api/leaderboard/*
│   │   │   └── anomaly.js             # /api/anomalies/*
│   │   │
│   │   ├── services/                  # Business Logic Services
│   │   │   ├── simulationEngine.js    # Background power simulation
│   │   │   ├── powerAggregator.js     # Minute-interval aggregation
│   │   │   ├── applianceManager.js    # Appliance state tracking
│   │   │   ├── mlService.js           # ML API communication
│   │   │   ├── billCalculation.js     # Billing logic
│   │   │   ├── incentiveEngine.js     # Reward/penalty calculation
│   │   │   ├── leaderboardService.js  # Ranking computation
│   │   │   └── anomalyDetection.js    # Anomaly detection algorithms
│   │   │
│   │   ├── websocket/                 # Real-Time Communication
│   │   │   ├── socketServer.js        # Socket.io initialization
│   │   │   ├── powerEvents.js         # Power update events
│   │   │   ├── applianceEvents.js     # Appliance control events
│   │   │   └── leaderboardEvents.js   # Leaderboard broadcasts
│   │   │
│   │   ├── middleware/                # Request Processing
│   │   │   ├── authMiddleware.js      # JWT verification
│   │   │   ├── validators.js          # Input validation
│   │   │   ├── errorHandler.js        # Error handling
│   │   │   └── rateLimiter.js         # API rate limiting
│   │   │
│   │   ├── jobs/                      # Scheduled Tasks
│   │   │   ├── simulationJob.js       # 1-minute simulation ticker
│   │   │   ├── aggregationJob.js      # 1-minute power aggregation
│   │   │   ├── forecastJob.js         # Daily forecast generation
│   │   │   ├── billJob.js             # Monthly billing
│   │   │   ├── leaderboardJob.js      # Hourly leaderboard update
│   │   │   └── index.js               # Job scheduler setup
│   │   │
│   │   └── utils/                     # Helper Functions
│   │       ├── logger.js              # Winston logging
│   │       ├── dateHelpers.js         # Date utilities
│   │       ├── redisHelpers.js        # Redis helper functions
│   │       └── validators.js          # Custom validators
│   │
│   ├── tests/                         # Backend Testing
│   │   ├── unit/                      # Unit tests
│   │   ├── integration/               # API integration tests
│   │   └── setup.js                   # Test configuration
│   │
│   ├── app.js                         # Express app configuration
│   ├── server.js                      # Server entry point
│   ├── Dockerfile                     # Backend container definition
│   ├── .dockerignore                  # Docker ignore rules
│   ├── package.json                   # Dependencies
│   └── .env.example                   # Environment template
│
├── ml-service/                        # Python ML Service
│   ├── models/                        # Trained models storage
│   │   ├── xgboost_model.pkl          # Forecasting model
│   │   ├── scaler.pkl                 # Feature scaler
│   │   └── metadata.json              # Model info
│   │
│   ├── src/
│   │   ├── api.py                     # Flask REST API
│   │   ├── train.py                   # Model training script
│   │   ├── predict.py                 # Prediction logic
│   │   ├── preprocess.py              # Data preprocessing
│   │   ├── features.py                # Feature engineering
│   │   ├── evaluate.py                # Model evaluation
│   │   └── generate_data.py           # Synthetic data generator
│   │
│   ├── config/
│   │   └── model_config.yaml          # Hyperparameters
│   │
│   ├── tests/
│   │   └── test_predictions.py        # ML tests
│   │
│   ├── Dockerfile                     # ML service container
│   ├── requirements.txt               # Python dependencies
│   └── .env.example                   # ML config template
│
├── frontend/                          # Next.js Frontend
│   ├── app/                           # Next.js App Router
│   │   ├── layout.tsx                 # Root layout
│   │   ├── page.tsx                   # Landing page
│   │   ├── globals.css                # Global styles
│   │   │
│   │   ├── (auth)/                    # Authentication pages
│   │   │   ├── login/
│   │   │   │   └── page.tsx           # Login page
│   │   │   └── register/
│   │   │       └── page.tsx           # Registration page
│   │   │
│   │   └── (dashboard)/               # Protected dashboard
│   │       ├── layout.tsx             # Dashboard layout
│   │       ├── home/                  # 3D Interactive Home
│   │       │   └── page.tsx           # Main 3D environment
│   │       ├── dashboard/             # Analytics Dashboard
│   │       │   └── page.tsx           # Stats and charts
│   │       ├── leaderboard/           # Leaderboard Page
│   │       │   └── page.tsx           # Rankings display
│   │       ├── bills/                 # Billing Pages
│   │       │   ├── page.tsx           # Bills list
│   │       │   └── [id]/page.tsx      # Bill details
│   │       ├── forecasts/             # Forecast Comparison
│   │       │   └── page.tsx           # Forecast vs actual
│   │       └── settings/              # User Settings
│   │           └── page.tsx           # Profile & preferences
│   │
│   ├── components/                    # React Components
│   │   ├── Home3D/                    # 3D Home Components
│   │   │   ├── Scene3D.tsx            # Three.js scene wrapper
│   │   │   ├── HouseModel.tsx         # 3D house structure
│   │   │   ├── Appliance.tsx          # Interactive appliance
│   │   │   ├── RoomEnvironment.tsx    # Room lighting/atmosphere
│   │   │   ├── PowerGauge3D.tsx       # 3D power visualization
│   │   │   └── AppliancePanel.tsx     # Control panel UI overlay
│   │   │
│   │   ├── Dashboard/                 # Dashboard Components
│   │   │   ├── PowerChart.tsx         # Real-time power line chart
│   │   │   ├── EnergyStats.tsx        # Today's statistics
│   │   │   ├── ForecastComparison.tsx # Forecast vs actual chart
│   │   │   └── QuickActions.tsx       # Action buttons
│   │   │
│   │   ├── Leaderboard/               # Leaderboard Components
│   │   │   ├── RankingTable.tsx       # User rankings table
│   │   │   ├── UserRankCard.tsx       # Individual rank display
│   │   │   ├── TopPerformers.tsx      # Top 10 highlight
│   │   │   └── MyPosition.tsx         # Current user position
│   │   │
│   │   ├── Bills/                     # Billing Components
│   │   │   ├── BillCard.tsx           # Bill summary
│   │   │   ├── IncentiveIndicator.tsx # Reward/penalty display
│   │   │   └── BillDetail.tsx         # Detailed breakdown
│   │   │
│   │   ├── Layout/                    # Layout Components
│   │   │   ├── Navbar.tsx             # Top navigation
│   │   │   ├── Sidebar.tsx            # Side navigation
│   │   │   └── Footer.tsx             # Footer
│   │   │
│   │   ├── ui/                        # Reusable UI Components
│   │   │   ├── Button.tsx             # Button component
│   │   │   ├── Card.tsx               # Card container
│   │   │   ├── Input.tsx              # Form input
│   │   │   ├── Modal.tsx              # Modal dialog
│   │   │   ├── Badge.tsx              # Status badge
│   │   │   ├── Spinner.tsx            # Loading spinner
│   │   │   └── Toast.tsx              # Notifications
│   │   │
│   │   └── shared/                    # Shared Components
│   │       ├── LoadingState.tsx       # Loading placeholder
│   │       ├── ErrorBoundary.tsx      # Error handling
│   │       └── ProtectedRoute.tsx     # Route protection
│   │
│   ├── lib/                           # Utility Libraries
│   │   ├── api.ts                     # Axios API client
│   │   ├── socket.ts                  # Socket.io client
│   │   ├── three/                     # Three.js utilities
│   │   │   ├── scene.ts               # Scene setup helpers
│   │   │   ├── controls.ts            # Camera controls
│   │   │   ├── loaders.ts             # Model/texture loaders
│   │   │   └── materials.ts           # Custom materials
│   │   └── utils.ts                   # General utilities
│   │
│   ├── store/                         # Zustand State Management
│   │   ├── authStore.ts               # Authentication state
│   │   ├── powerStore.ts              # Power data state
│   │   ├── applianceStore.ts          # Appliance states
│   │   ├── leaderboardStore.ts        # Leaderboard data
│   │   └── uiStore.ts                 # UI state
│   │
│   ├── types/                         # TypeScript Types
│   │   ├── user.ts                    # User types
│   │   ├── power.ts                   # Power data types
│   │   ├── appliance.ts               # Appliance types
│   │   ├── forecast.ts                # Forecast types
│   │   ├── bill.ts                    # Bill types
│   │   ├── leaderboard.ts             # Leaderboard types
│   │   └── api.ts                     # API response types
│   │
│   ├── hooks/                         # Custom React Hooks
│   │   ├── useAuth.ts                 # Authentication hook
│   │   ├── usePowerData.ts            # Power data fetching
│   │   ├── useWebSocket.ts            # WebSocket connection
│   │   ├── useAppliances.ts           # Appliance management
│   │   ├── useLeaderboard.ts          # Leaderboard data
│   │   └── use3DScene.ts              # Three.js scene hook
│   │
│   ├── public/                        # Static Assets
│   │   ├── models/                    # 3D models (GLTF/GLB)
│   │   │   ├── house.glb              # House structure
│   │   │   ├── tv.glb                 # TV model
│   │   │   ├── light.glb              # Light fixture
│   │   │   └── ...                    # Other appliances
│   │   └── textures/                  # Textures for 3D
│   │
│   ├── Dockerfile                     # Frontend container
│   ├── next.config.js                 # Next.js config
│   ├── tailwind.config.ts             # Tailwind config
│   ├── tsconfig.json                  # TypeScript config
│   └── package.json                   # Dependencies
│
├── nginx/                             # Reverse Proxy
│   ├── nginx.conf                     # Nginx configuration
│   └── Dockerfile                     # Nginx container
│
├── docs/                              # Documentation
│   ├── API.md                         # API documentation
│   ├── DATABASE.md                    # Database schema docs
│   ├── ARCHITECTURE.md                # System architecture
│   ├── DEPLOYMENT.md                  # Deployment guide
│   └── USER_GUIDE.md                  # User manual
│
├── scripts/                           # Utility Scripts
│   ├── seed-database.js               # Database seeding
│   ├── init-db.sh                     # Database initialization
│   ├── backup.sh                      # Backup script
│   └── deploy.sh                      # Deployment script
│
├── .github/                           # GitHub Actions
│   └── workflows/
│       ├── ci.yml                     # Continuous Integration
│       └── deploy.yml                 # Deployment workflow
│
├── docker-compose.yml                 # Development orchestration
├── docker-compose.prod.yml            # Production orchestration
├── .env.example                       # Environment template
├── .gitignore                         # Git ignore rules
├── README.md                          # Project overview
└── LICENSE                            # License file
```

---

## Phase 1: Foundation & Containerization

### Overview

This phase establishes the project structure and Docker containerization. The goal is to have all services running in containers from day one, enabling immediate deployment and testing of incremental changes.

### Step 1.1: Project Initialization

**Purpose**: Create the foundational project structure and version control.

**What to do**:

1. Create root directory `wattwize/`
2. Initialize Git repository: `git init`
3. Create `.gitignore` with Node, Python, environment files, and Docker ignores
4. Create main folders: `backend/`, `ml-service/`, `frontend/`, `nginx/`, `docs/`, `scripts/`
5. Create `README.md` with project description and setup instructions
6. Create `LICENSE` file (MIT recommended)

**Deliverables**:

- Initialized Git repository
- Complete folder structure
- README with overview
- License file

### Step 1.2: Environment Configuration

**Purpose**: Set up environment variable templates for all services.

**What to create**:

**Root `.env.example`** (Shared variables):

```
# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=wattwize_db
POSTGRES_USER=wattwize_user
POSTGRES_PASSWORD=change_me_in_production

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=change_me_in_production

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRATION=7d

# Services
BACKEND_PORT=3000
ML_SERVICE_PORT=5001
FRONTEND_PORT=3001

# URLs (internal Docker network)
BACKEND_URL=http://backend:3000
ML_SERVICE_URL=http://ml-service:5001
FRONTEND_URL=http://frontend:3001

# Public URLs (for frontend)
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3000

# Simulation
SIMULATION_INTERVAL_SECONDS=60
BASE_TARIFF_RATE=0.12

# Leaderboard
LEADERBOARD_UPDATE_INTERVAL=3600
```

**backend/.env.example**:

```
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://wattwize_user:password@postgres:5432/wattwize_db
REDIS_URL=redis://redis:6379
JWT_SECRET=your_jwt_secret
ML_SERVICE_URL=http://ml-service:5001
```

**ml-service/.env.example**:

```
FLASK_PORT=5001
FLASK_ENV=development
DATABASE_URL=postgresql://wattwize_user:password@postgres:5432/wattwize_db
MODEL_PATH=./models/xgboost_model.pkl
```

**frontend/.env.local.example**:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

**What these do**:

- Centralize all configuration
- Keep secrets out of code
- Enable environment-specific settings
- Simplify deployment across environments

### Step 1.3: Docker Compose Development Setup

**Purpose**: Create Docker Compose configuration for local development with hot-reload.

**docker-compose.yml** (Development environment):

**Services to define**:

1. **postgres** - PostgreSQL 14 with TimescaleDB extension
2. **redis** - Redis 7 for caching and real-time state
3. **backend** - Node.js backend service
4. **ml-service** - Python Flask ML service
5. **frontend** - Next.js frontend with hot reload
6. **nginx** - Reverse proxy (optional in dev)

**Key configuration points**:

- **Volumes**: Mount source code for hot-reload (./backend:/app for backend, etc.)
- **Networks**: Create custom bridge network for inter-service communication
- **Depends_on**: Ensure proper startup order (backend depends on postgres and redis)
- **Ports**: Expose necessary ports to host (3000 for backend, 3001 for frontend, 5432 for postgres)
- **Environment**: Pass environment variables from .env file
- **Health checks**: Add health checks for each service
- **Restart policy**: restart: unless-stopped for resilience

**What this enables**:

- One command to start entire stack: `docker-compose up`
- Isolated development environment
- Consistent environment across team
- Easy service scaling and management
- Immediate code changes reflection without rebuild

### Step 1.4: Backend Dockerfile

**Purpose**: Containerize Node.js backend with optimal caching.

**backend/Dockerfile**:

**Multi-stage build structure**:

1. **Base stage**: Node 18 Alpine, set working directory
2. **Dependencies stage**: Copy package files, run npm install
3. **Development stage**: Copy source, expose port, run with nodemon
4. **Production stage**: Copy only production dependencies, run with node

**Key optimizations**:

- Use `.dockerignore` to exclude node_modules, .git, .env
- Leverage Docker layer caching (copy package.json before source)
- Use Alpine Linux for smaller image size
- Non-root user for security
- Health check endpoint

**What it does**:

- Creates reproducible backend environment
- Optimizes build time with layer caching
- Separates dev and prod configurations
- Enables easy scaling horizontally

### Step 1.5: ML Service Dockerfile

**Purpose**: Containerize Python ML service.

**ml-service/Dockerfile**:

**Structure**:

1. **Base stage**: Python 3.9 slim
2. **Dependencies stage**: Install system dependencies (gcc for XGBoost)
3. **Python packages stage**: Install requirements.txt
4. **Final stage**: Copy source and models, expose port

**Key points**:

- Install build dependencies for XGBoost compilation
- Use virtual environment for isolation
- Copy pre-trained models into container
- Set Python unbuffered for logging
- Health check on /health endpoint

**What it does**:

- Packages ML model with service
- Ensures consistent Python environment
- Optimizes for prediction speed
- Enables independent ML service scaling

### Step 1.6: Frontend Dockerfile

**Purpose**: Containerize Next.js frontend with build optimization.

**frontend/Dockerfile**:

**Multi-stage structure**:

1. **Dependencies stage**: Install Node packages
2. **Builder stage**: Build Next.js production bundle
3. **Runner stage**: Lightweight image with only production files

**Key optimizations**:

- Separate build and runtime stages
- Use standalone output for smallest size
- Copy only necessary files to runner
- Serve with Next.js start (no dev dependencies)

**What it does**:

- Creates optimized production build
- Reduces final image size significantly
- Speeds up deployment
- Enables CDN edge deployment

### Step 1.7: Nginx Configuration

**Purpose**: Set up reverse proxy for routing and load balancing.

**nginx/nginx.conf**:

**Configuration sections**:

1. **Upstream definitions**: backend, ml-service, frontend
2. **Server block**: Listen on port 80
3. **Location blocks**:
    - `/api/*` → Proxy to backend
    - `/socket.io/*` → WebSocket to backend with upgrade headers
    - `/ml/*` → Proxy to ml-service
    - `/*` → Proxy to frontend

**Key features**:

- WebSocket support with proper headers
- Gzip compression
- Client body size limits
- Timeout configurations
- Health check endpoints

**What it does**:

- Single entry point for all services
- SSL termination (in production)
- Load balancing (when scaled)
- Request routing by path

### Step 1.8: Initial Testing

**Purpose**: Verify Docker setup works end-to-end.

**What to test**:

1. Build all services: `docker-compose build`
2. Start all services: `docker-compose up`
3. Check all containers are running: `docker-compose ps`
4. Test service connectivity:
    - Backend health: `curl http://localhost:3000/health`
    - ML service health: `curl http://localhost:5001/health`
    - Frontend: `curl http://localhost:3001`
    - Database: `psql -h localhost -U wattwize_user -d wattwize_db`
    - Redis: `redis-cli -h localhost ping`
5. Check logs: `docker-compose logs -f [service]`
6. Test hot-reload: Make code change, verify auto-reload

**Success criteria**:

- All 5 services start successfully
- Health checks pass
- Inter-service communication works
- Hot-reload functional for code changes
- No errors in logs

---

## Phase 2: Database & Cache Layer

### Overview

This phase establishes the data persistence and caching infrastructure. PostgreSQL with TimescaleDB handles time-series power data, while Redis manages real-time state and caching.

### Step 2.1: PostgreSQL with TimescaleDB Setup

**Purpose**: Install and configure time-series database.

**What to do**:

1. Use official TimescaleDB Docker image in docker-compose
2. Mount initialization scripts volume
3. Create database initialization script
4. Enable TimescaleDB extension

**docker-compose.yml postgres service**:

- Image: `timescale/timescaledb:latest-pg14`
- Volume mount: `./scripts/init-db.sh:/docker-entrypoint-initdb.d/init-db.sh`
- Environment variables: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
- Port mapping: 5432:5432
- Health check: pg_isready command

**scripts/init-db.sh**:

```
Purpose: Initialize database with TimescaleDB extension
Steps:
1. Connect to wattwize_db
2. Execute: CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
3. Verify extension: \dx
```

**What this achieves**:

- Time-series optimized database
- Automatic partitioning for power_readings table
- Efficient time-based queries
- Data compression for old data
- Continuous aggregates support

### Step 2.2: Database Schema Design

**Purpose**: Define complete database structure with proper relationships.

**backend/src/config/schema.sql**:

**Tables to create**:

**1. users table**:

```
Purpose: Store user accounts and authentication
Columns:
- id: UUID primary key (gen_random_uuid())
- email: VARCHAR(255) unique, not null
- password_hash: VARCHAR(255) not null
- name: VARCHAR(100) not null
- household_id: VARCHAR(50) (optional grouping)
- tariff_rate: DECIMAL(5,3) default 0.12 ($/kWh)
- created_at: TIMESTAMP default now()
- updated_at: TIMESTAMP default now()

Indexes:
- email (unique)
- household_id
```

**2. power_readings table (TimescaleDB hypertable)**:

```
Purpose: Store 1-minute interval power consumption averages
Columns:
- id: BIGSERIAL primary key
- user_id: UUID references users(id)
- timestamp: TIMESTAMPTZ not null
- background_power_kw: DECIMAL(8,3) (from simulation)
- interactive_power_kw: DECIMAL(8,3) (user appliances)
- total_power_kw: DECIMAL(8,3) not null (background + interactive)
kwh: DECIMAL(8,3) not null (energy consumed in this minute)
- voltage: DECIMAL(6,2) default 230.0
- created_at: TIMESTAMPTZ default now()

Indexes:
- user_id, timestamp (composite, for time-range queries)
- timestamp (for global analytics)

TimescaleDB configuration:
- Convert to hypertable: SELECT create_hypertable('power_readings', 'timestamp')
- Set chunk interval: 1 day
- Enable compression after 7 days
- Retention policy: 2 years
```

**3. appliance_states table**:

```
Purpose: Track current state of user appliances
Columns:
- id: BIGSERIAL primary key
- user_id: UUID references users(id)
- appliance_id: VARCHAR(50) not null (e.g., 'living_room_tv')
- appliance_name: VARCHAR(100) (e.g., 'Living Room TV')
- power_rating_watts: INTEGER not null (appliance power consumption)
- is_on: BOOLEAN default false
- last_toggled_at: TIMESTAMPTZ default now()
- created_at: TIMESTAMPTZ default now()

Indexes:
- user_id, appliance_id (composite unique)
- user_id, is_on (for calculating current power)
```

**4. forecasts table**:

```
Purpose: Store AI-generated consumption forecasts
Columns:
- id: BIGSERIAL primary key
- user_id: UUID references users(id)
- forecast_date: DATE not null
- forecast_hour: SMALLINT not null (0-23)
- forecasted_energy_kwh: DECIMAL(8,3) not null
- confidence_lower: DECIMAL(8,3)
- confidence_upper: DECIMAL(8,3)
- created_at: TIMESTAMPTZ default now()

Indexes:
- user_id, forecast_date, forecast_hour (composite unique)
- forecast_date (for cleanup jobs)
```

**5. bills table**:

```
Purpose: Monthly billing records with incentives
Columns:
- id: UUID primary key
- user_id: UUID references users(id)
- billing_period: VARCHAR(7) not null (YYYY-MM)
- start_date: DATE not null
- end_date: DATE not null
- actual_energy_kwh: DECIMAL(10,2) not null
- forecasted_energy_kwh: DECIMAL(10,2) not null
- base_cost: DECIMAL(10,2) not null
- incentive_amount: DECIMAL(10,2) default 0 (positive=reward, negative=penalty)
- total_amount: DECIMAL(10,2) GENERATED ALWAYS AS (base_cost - incentive_amount) STORED
- status: bill_status_enum default 'pending'
- paid_at: TIMESTAMPTZ
- created_at: TIMESTAMPTZ default now()

Indexes:
- user_id, billing_period (composite unique)
- status
- created_at

ENUM type:
CREATE TYPE bill_status_enum AS ENUM ('pending', 'paid', 'overdue');
```

**6. leaderboard_entries table**:

```
Purpose: Track user performance for rankings
Columns:
- id: BIGSERIAL primary key
- user_id: UUID references users(id)
- period_start: TIMESTAMPTZ not null
- period_end: TIMESTAMPTZ not null
- period_type: VARCHAR(20) not null (daily/weekly/monthly)
- actual_consumption_kwh: DECIMAL(10,2) not null
- forecasted_consumption_kwh: DECIMAL(10,2) not null
- efficiency_score: DECIMAL(5,2) not null (percentage saved/exceeded)
- rank_position: INTEGER
- created_at: TIMESTAMPTZ default now()
- updated_at: TIMESTAMPTZ default now()

Indexes:
- user_id, period_type, period_start (composite)
- period_type, efficiency_score DESC (for ranking queries)
- period_start, period_end (for time-range queries)
```

**7. anomalies table**:

```
Purpose: Store detected unusual consumption patterns
Columns:
- id: BIGSERIAL primary key
- user_id: UUID references users(id)
- detected_at: TIMESTAMPTZ not null
- anomaly_type: anomaly_type_enum not null
- severity: severity_enum not null
- description: TEXT
- consumption_value: DECIMAL(8,3)
- expected_value: DECIMAL(8,3)
- deviation_percentage: DECIMAL(5,2)
- is_acknowledged: BOOLEAN default false
- acknowledged_at: TIMESTAMPTZ
- created_at: TIMESTAMPTZ default now()

Indexes:
- user_id, detected_at
- is_acknowledged, severity (for alert queries)

ENUM types:
CREATE TYPE anomaly_type_enum AS ENUM ('spike', 'sustained_high', 'unusual_pattern');
CREATE TYPE severity_enum AS ENUM ('low', 'medium', 'high');
```

**8. continuous_aggregate (materialized view)**:

```
Purpose: Pre-computed hourly statistics for performance
Name: hourly_power_stats

Query:
SELECT 
  user_id,
  time_bucket('1 hour', timestamp) AS hour_bucket,
  AVG(total_power_kw) as avg_power_kw,
  MAX(total_power_kw) as max_power_kw,
  MIN(total_power_kw) as min_power_kw,
  SUM(energy_kwh) as total_energy_kwh,
  COUNT(*) as reading_count
FROM power_readings
GROUP BY user_id, hour_bucket;

Refresh policy: Every 30 minutes for last 7 days
```

**What this schema provides**:

- Efficient time-series storage for minute-level data
- Separate tracking of background vs interactive power
- Complete appliance state management
- Forecast storage with confidence intervals
- Billing with automatic total calculation
- Leaderboard ranking capability
- Anomaly detection storage
- Pre-computed hourly aggregates for dashboards

### Step 2.3: Database Connection Module

**Purpose**: Create PostgreSQL connection pool for backend.

**backend/src/config/database.js**:

**What to implement**:

1. Import `pg` Pool from pg library
2. Create connection pool with configuration from environment
3. Configure pool settings:
    - max: 20 connections
    - idleTimeoutMillis: 30000 (30 seconds)
    - connectionTimeoutMillis: 2000 (2 seconds)
4. Add connection event listeners:
    - 'connect': Log successful connection
    - 'error': Log connection errors
5. Export query wrapper function:
    - Accepts SQL query and parameters
    - Returns promise with results
    - Handles errors gracefully
6. Export pool for transaction support
7. Add testConnection() function for health checks

**Functions to export**:

- `query(text, params)`: Execute single query
- `getClient()`: Get client for transactions
- `testConnection()`: Verify database connectivity
- `pool`: Export pool for advanced usage

**What this does**:

- Manages database connection pooling efficiently
- Prevents connection exhaustion
- Provides consistent error handling
- Enables easy query execution throughout app
- Supports transactions for multi-query operations

### Step 2.4: Redis Configuration

**Purpose**: Set up Redis client for caching and real-time state.

**backend/src/config/redis.js**:

**What to implement**:

1. Import `ioredis` library
2. Create Redis client with configuration:
    - host from environment (default: 'redis')
    - port from environment (default: 6379)
    - password if configured
    - retryStrategy: Exponential backoff (max 10 retries)
3. Configure additional options:
    - maxRetriesPerRequest: 3
    - enableReadyCheck: true
    - lazyConnect: false (connect immediately)
4. Add event listeners:
    - 'connect': Log connection success
    - 'ready': Log ready state
    - 'error': Log errors
    - 'reconnecting': Log reconnection attempts
5. Export configured client

**Helper functions to export**:

- `setWithExpiry(key, value, ttl)`: Set value with TTL
- `getJSON(key)`: Get and parse JSON value
- `setJSON(key, value, ttl)`: Stringify and set JSON
- `deletePattern(pattern)`: Delete keys matching pattern
- `exists(key)`: Check if key exists

**What this does**:

- Manages Redis connection with auto-reconnection
- Provides helper functions for common operations
- Handles JSON serialization/deserialization
- Enables TTL-based caching
- Supports pub/sub for real-time events

### Step 2.5: Redis Key Structure Design

**Purpose**: Define consistent Redis key naming conventions.

**Key patterns to use**:

**Real-time power state**:

```
Key: power:state:{user_id}
Value: JSON object
Structure:
{
  "background_power_kw": 1.2,
  "interactive_power_kw": 0.8,
  "total_power_kw": 2.0,
  "last_updated": "2025-01-15T10:30:45Z",
  "appliances_on": ["tv", "lights_living"]
}
TTL: No expiration (always current)
Updated: Real-time on appliance changes and every minute on simulation tick
```

**Appliance states cache**:

```
Key: appliances:{user_id}
Value: JSON array of appliance objects
Structure:
[
  {
    "appliance_id": "living_room_tv",
    "name": "Living Room TV",
    "power_rating": 150,
    "is_on": true,
    "last_toggled": "2025-01-15T10:15:00Z"
  },
  ...
]
TTL: 1 hour
Invalidated: On appliance toggle
```

**Minute aggregation buffer**:

```
Key: power:buffer:{user_id}:{minute}
Value: JSON array of power samples (for averaging)
Structure:
[
  {"timestamp": "2025-01-15T10:30:00Z", "power_kw": 2.1},
  {"timestamp": "2025-01-15T10:30:15Z", "power_kw": 2.0},
  ...
]
TTL: 5 minutes (processed then deleted)
Purpose: Collect sub-minute samples before writing 1-minute average to PostgreSQL
```

**Forecast cache**:

```
Key: forecast:daily:{user_id}:{date}
Value: JSON array of hourly forecasts
TTL: 6 hours
Invalidated: When new forecast generated
```

**Leaderboard cache**:

```
Key: leaderboard:{period_type}:{period_identifier}
Value: Sorted set (ZSET)
Score: efficiency_score (negative for DESC order)
Member: user_id
Example:
  ZADD leaderboard:daily:2025-01-15 -15.5 user123
  (User saved 15.5% compared to forecast)
TTL: Until next period
Purpose: Fast leaderboard queries without hitting PostgreSQL
```

**Current bill cache**:

```
Key: bill:current:{user_id}
Value: JSON object with bill details
TTL: 1 day
Invalidated: When bill finalized
```

**Session data**:

```
Key: session:{user_id}:{socket_id}
Value: JSON session object
TTL: 24 hours
Purpose: Track WebSocket connections per user
```

**What this structure provides**:

- Consistent key naming across application
- Appropriate TTLs for different data types
- Clear cache invalidation points
- Sub-second read performance
- Sorted sets for leaderboards
- Efficient pub/sub patterns

---

## Phase 3: Backend Core Services

### Overview

This phase builds the core backend infrastructure including authentication, API routing, middleware, and base service structure.

### Step 3.1: Backend Project Setup

**Purpose**: Initialize Node.js backend with proper project structure.

**What to do**:

1. Navigate to `backend/` directory
2. Run `npm init -y` to create package.json
3. Install dependencies:
    
    ```
    Core: express, pg, ioredis, socket.io, dotenvAuth: bcryptjs, jsonwebtokenValidation: express-validatorUtilities: morgan, winston, cors, helmetScheduling: node-cronDevelopment: nodemon, jest, supertest
    ```
    
4. Configure package.json scripts:
    - `start`: `node server.js`
    - `dev`: `nodemon server.js`
    - `test`: `jest --coverage`
    - `lint`: `eslint src/`
5. Create `.dockerignore`: Exclude node_modules, .env, tests

**package.json dependencies**:

```
express: ^4.18.0 (web framework)
pg: ^8.11.0 (PostgreSQL client)
ioredis: ^5.3.0 (Redis client)
socket.io: ^4.6.0 (WebSocket server)
bcryptjs: ^2.4.3 (password hashing)
jsonwebtoken: ^9.0.0 (JWT tokens)
express-validator: ^7.0.0 (input validation)
dotenv: ^16.0.0 (environment variables)
morgan: ^1.10.0 (HTTP logging)
winston: ^3.11.0 (application logging)
cors: ^2.8.5 (CORS middleware)
helmet: ^7.1.0 (security headers)
node-cron: ^3.0.0 (job scheduling)
```

**What this sets up**:

- Complete backend dependencies
- Development workflow with hot-reload
- Testing framework
- Security and logging utilities
- Scheduled job capability

### Step 3.2: Express Application Configuration

**Purpose**: Set up Express app with middleware and security.

**backend/app.js**:

**What to configure**:

1. Import dependencies: express, cors, helmet, morgan
2. Create Express application instance
3. Apply middleware in order:
    - `helmet()`: Security headers
    - `cors()`: Enable cross-origin requests (configure allowed origins)
    - `express.json()`: Parse JSON bodies (limit: 10mb)
    - `express.urlencoded()`: Parse URL-encoded bodies
    - `morgan('dev')`: HTTP request logging in development
4. Mount API routes:
    - `/api/auth`: Authentication routes
    - `/api/power`: Power data routes
    - `/api/appliances`: Appliance control routes
    - `/api/forecast`: Forecast routes
    - `/api/bills`: Billing routes
    - `/api/leaderboard`: Leaderboard routes
    - `/api/anomalies`: Anomaly routes
5. Add health check endpoint:
    - `GET /health`: Return {status: 'ok', timestamp: Date.now()}
6. Add 404 handler for unknown routes
7. Add global error handler middleware
8. Export app (don't start server here, that's in server.js)

**CORS configuration**:

```
Allow origins:
- http://localhost:3001 (frontend dev)
- Production frontend URL
Allow methods: GET, POST, PUT, PATCH, DELETE
Allow headers: Content-Type, Authorization
Allow credentials: true (for cookies if used)
```

**What this does**:

- Configures Express with essential middleware
- Sets up security best practices
- Defines API route structure
- Provides health check for monitoring
- Separates app config from server startup

### Step 3.3: Server Entry Point

**Purpose**: Start HTTP server and initialize WebSocket.

**backend/server.js**:

**What to implement**:

1. Import app from app.js
2. Import http module to create HTTP server
3. Import database and redis configs
4. Import WebSocket initialization
5. Create HTTP server: `const server = http.createServer(app)`
6. Initialize Socket.io on HTTP server
7. Test database connection
8. Test Redis connection
9. Initialize scheduled jobs
10. Start server on port from environment (default 3000)
11. Add graceful shutdown handling:
    - Listen for SIGTERM and SIGINT
    - Close server connections
    - Disconnect database
    - Disconnect Redis
    - Exit process

**Startup sequence**:

```
1. Load environment variables
2. Test database connection
3. Test Redis connection
4. Initialize WebSocket server
5. Start scheduled jobs
6. Listen on port
7. Log "Server started on port X"
```

**Graceful shutdown flow**:

```
1. Receive SIGTERM/SIGINT
2. Log "Shutting down gracefully"
3. Stop accepting new connections
4. Close existing connections (timeout: 30s)
5. Disconnect database pool
6. Disconnect Redis client
7. Exit process with code 0
```

**What this does**:

- Starts HTTP and WebSocket servers
- Verifies all dependencies are ready
- Handles process signals for clean shutdown
- Prevents data loss on deployment updates
- Provides structured startup logging

### Step 3.4: Authentication Middleware

**Purpose**: Protect routes with JWT verification.

**backend/src/middleware/authMiddleware.js**:

**What to implement**:

**protect function** (main authentication middleware):

1. Extract token from request headers:
    - Check `Authorization` header
    - Format: "Bearer {token}"
    - Extract token after "Bearer "
2. If no token:
    - Return 401: {error: 'No token provided'}
3. Verify token using JWT_SECRET:
    - `jwt.verify(token, process.env.JWT_SECRET)`
4. If verification fails:
    - Return 401: {error: 'Invalid or expired token'}
5. Decode user_id from token payload
6. Fetch user from database by user_id:
    - SELECT id, email, name, household_id, tariff_rate FROM users WHERE id = ?
7. If user not found:
    - Return 401: {error: 'User not found'}
8. Attach user object to req.user
9. Call next() to proceed to route handler

**Optional: optionalAuth function** (for routes that work with or without auth):

1. Extract token (same as above)
2. If no token, skip to next() without error
3. If token exists, verify and attach user
4. If verification fails, skip to next() (don't error)

**What this provides**:

- Secure route protection
- User identification for all requests
- Consistent authentication flow
- Proper error responses
- Token expiration handling

### Step 3.5: Input Validation Middleware

**Purpose**: Validate and sanitize request data.

**backend/src/middleware/validators.js**:

**What to create**:

Use `express-validator` library to create validation chains for each endpoint.

**Registration validation**:

```
Validate:
- email: isEmail, normalizeEmail
- password: isLength({min: 6}), trim
- name: notEmpty, trim, isLength({max: 100})
- household_id: optional, trim
- tariff_rate: optional, isFloat({min: 0, max: 1})

Middleware chain: validateRegister = [check(...), check(...), handleValidationErrors]
```

**Login validation**:

```
Validate:
- email: isEmail, normalizeEmail
- password: notEmpty

Middleware chain: validateLogin
```

**Power reading validation**:

```
Validate:
- timestamp: optional, isISO8601
- power_kw: isFloat({min: 0})
- energy_kwh: isFloat({min: 0})

Middleware chain: validatePowerReading
```

**Appliance toggle validation**:

```
Validate:
- appliance_id: notEmpty, trim
- is_on: isBoolean

Middleware chain: validateApplianceToggle
```

**Date range validation**:

```
Validate:
- start_date: isISO8601, isBefore(end_date)
- end_date: isISO8601, isAfter(start_date)

Middleware chain: validateDateRange
```

**handleValidationErrors function**:

```
Purpose: Collect validation errors and return 400 response
Implementation:
1. Use validationResult(req) to get errors
2. If errors exist:
   - Format errors array
   - Return 400: {errors: [...]}
3. If no errors, call next()
```

**What this does**:

- Prevents invalid data from reaching controllers
- Sanitizes input to prevent XSS
- Provides consistent error responses
- Reduces boilerplate in controllers
- Improves API reliability

### Step 3.6: Error Handler Middleware

**Purpose**: Centralized error handling for all routes.

**backend/src/middleware/errorHandler.js**:

**What to implement**:

**Global error handler** (must be last middleware):

```
Function signature: (err, req, res, next)

Error handling logic:
1. Log error with Winston:
   - logger.error(err.message, {stack: err.stack, url: req.url})
2. Determine status code:
   - If err.statusCode exists, use it
   - If err.name === 'ValidationError', use 400
   - If err.name === 'UnauthorizedError', use 401
   - Default: 500
3. Determine error message:
   - In development: Send full error message and stack
   - In production: Send generic message for 500 errors
4. Return JSON response:
   {
     error: message,
     statusCode: code,
     stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
   }
```

**Custom error classes**:

```
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} not found`, 404);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}
```

**What this provides**:

- Consistent error response format
- Appropriate HTTP status codes
- Error logging for debugging
- Security (hide internal errors in production)
- Custom error types for specific scenarios

### Step 3.7: Logging Utility

**Purpose**: Structured application logging with Winston.

**backend/src/utils/logger.js**:

**What to configure**:

1. Import winston library
2. Define log format:
    - Timestamp
    - Level (info, warn, error)
    - Message
    - Metadata (optional object)
    - JSON format for production
3. Create transports:
    - **Console transport**: For development
        - Level: debug
        - Colorize: true
        - Simple format
    - **File transport**: For production
        - error.log: Only errors (level: error)
        - combined.log: All logs (level: info)
        - maxsize: 5MB per file
        - maxFiles: 5 (rotation)
4. Create logger instance with transports
5. Add request logging helper:
    - logRequest(req): Log method, URL, user_id
6. Export logger

**Log levels to use**:

```
error: Critical errors, exceptions, database connection failures
warn: Warning conditions, degraded performance, retry attempts
info: Normal application flow, user actions, job completions
debug: Detailed debugging information, query results
```

**Usage in application**:

```
logger.info('User logged in', {userId: user.id});
logger.error('Database query failed', {error: err.message, query: sql});
logger.warn('Redis cache miss', {key: cacheKey});
```

**What this provides**:

- Structured logging for monitoring
- Separate error logs for alerting
- Log rotation to manage disk space
- Debug information for development
- Request correlation for tracing

---

## Phase 4: Real-Time Power Simulation Engine

### Overview

This phase implements the hybrid power calculation system with background simulation and interactive appliance control. The simulation runs every 60 seconds in the backend, while user appliance actions update power instantly.

### Step 4.1: Appliance Definitions

**Purpose**: Define all available appliances with power ratings.

**backend/src/config/appliances.js**:

**What to define**:

Export an object containing all appliance definitions:

```javascript
Structure:
{
  appliance_id: {
    name: "Display Name",
    category: "living_room/kitchen/bedroom/bathroom",
    power_rating_watts: Number,
    icon: "icon_name" (for frontend)
  }
}
```

**Appliance catalog** (example):

```
Living Room:
- tv: 150W (LED TV)
- ceiling_fan: 75W
- floor_lamp: 60W
- gaming_console: 120W
- sound_system: 100W

Kitchen:
- refrigerator: 150W (always on in baseline, but controllable)
- microwave: 1000W
- coffee_maker: 800W
- dishwasher: 1800W
- oven: 2400W
- toaster: 800W

Bedroom:
- bedroom_tv: 100W
- bedside_lamp: 40W
- ceiling_light: 60W
- electric_blanket: 60W
- phone_charger: 10W

Bathroom:
- bathroom_heater: 1500W
- hair_dryer: 1800W
- exhaust_fan: 30W
- bathroom_light: 60W

HVAC (in baseline):
- air_conditioner: 3500W (simulated, not directly controllable)
- heater: 4000W (simulated, not directly controllable)
- water_heater: 3000W (simulated, not directly controllable)
```

**What this provides**:

- Consistent power ratings across application
- Appliance categorization for UI
- Foundation for power calculations
- Easy to extend with new appliances

### Step 4.2: Background Simulation Patterns

**Purpose**: Generate realistic baseline power consumption.

**backend/src/services/simulationEngine.js**:

**What to implement**:

**Main function: calculateBackgroundPower(user_id, timestamp)**

This function generates baseline household power that runs automatically.

**Inputs**:

- user_id: To personalize patterns
- timestamp: Current time for time-based patterns

**Time-based pattern logic**:

```
Extract from timestamp:
- hour (0-23)
- day_of_week (0=Sunday, 6=Saturday)
- month (1-12)
- is_weekend (day_of_week === 0 || day_of_week === 6)
```

**Base consumption by time of day** (in kW):

```
Night (0-5 AM): 0.4-0.6 kW
  Baseline: refrigerator, router, standby devices
  
Early Morning (6-8 AM): 1.5-2.5 kW
  Peak: Water heater, coffee maker, lights, bathroom heating
  
Day (9 AM-4 PM): 0.8-1.5 kW
  Weekday: Lower (people at work)
  Weekend: Higher (people home)
  
Evening (5-10 PM): 2.5-4.0 kW
  Peak: HVAC, cooking, lighting, entertainment
  
Late Evening (10 PM-12 AM): 1.2-1.8 kW
  Winding down: TV, lights, phone charging
```

**Seasonal variation**:

```
Summer months (6-8): +30% (air conditioning)
Winter months (12-2): +40% (heating)
Spring/Fall (3-5, 9-11): Baseline
```

**Weekend modifier**:

```
Weekend: +20% during day hours (9 AM-5 PM)
Reason: More home activity
```

**Random noise**:

```
Add ±10% random variation to simulate natural fluctuations
Use Math.random() * 0.2 - 0.1 (range: -10% to +10%)
```

**Implementation steps**:

1. Determine base power from hourly pattern
2. Apply seasonal multiplier
3. Apply weekend multiplier if applicable
4. Add random noise
5. Ensure result is always positive
6. Round to 3 decimal places
7. Return power_kw value

**Example calculation**:

```
Time: 7 PM on Sunday in July
Hour pattern: 3.0 kW (evening peak)
Seasonal: 3.0 * 1.3 = 3.9 kW (summer AC)
Weekend: 3.9 * 1.0 = 3.9 kW (weekend only affects day hours)
Noise: 3.9 * (1 + 0.05) = 4.095 kW
Result: 4.095 kW background power
```

**What this achieves**:

- Realistic household baseline consumption
- Time-aware power patterns
- Seasonal variation simulation
- Natural randomness
- Predictable but varied data

### Step 4.3: Interactive Appliance Manager

**Purpose**: Track and calculate user-controlled appliance power.

**backend/src/services/applianceManager.js**:

**What to implement**:

**Function: initializeUserAppliances(user_id)**

```
Purpose: Set up default appliances for new user
Process:
1. Load appliance definitions from config
2. For each appliance:
   - Insert into appliance_states table
   - user_id, appliance_id, name, power_rating, is_on=false
3. Store in Redis: appliances:{user_id}
4. Return appliance array
```

**Function: toggleAppliance(user_id, appliance_id, is_on)**

```
Purpose: Turn appliance on/off and update power
Process:
1. Validate appliance exists for user
2. Update database: appliance_states SET is_on = ?, last_toggled_at = NOW()
3. Get appliance power_rating from database
4. Calculate power change:
   - If turning ON: +power_rating
   - If turning OFF: -power_rating
5. Update Redis power:state:{user_id}:
   - Get current interactive_power_kw
   - Add/subtract power change (convert watts to kW: /1000)
   - Update interactive_power_kw
   - Recalculate total_power_kw (background + interactive)
6. Invalidate Redis cache: appliances:{user_id}
7. Broadcast WebSocket event: appliance_toggled
8. Return updated appliance state
```

**Function: getActiveAppliances(user_id)**

```
Purpose: Get all appliances that are currently ON
Process:
1. Check Redis cache: appliances:{user_id}
2. If cache miss:
   - Query database: SELECT * FROM appliance_states WHERE user_id = ? AND is_on = true
   - Cache result in Redis (TTL: 1 hour)
3. Return array of active appliances
```

**Function: calculateInteractivePower(user_id)**

```
Purpose: Sum power of all active appliances
Process:
1. Get active appliances
2. Sum power_rating_watts for all
3. Convert to kW (divide by 1000)
4. Return interactive_power_kw
```

**Function: getApplianceStates(user_id)**

```
Purpose: Get all appliances with current states
Process:
1. Check Redis cache
2. If cache miss, query database
3. Return complete appliance list
```

**What this provides**:

- Real-time appliance state management
- Instant power calculation on toggle
- Efficient caching of appliance data
- WebSocket integration for live updates
- Database persistence for reliability
