# WattWise

WattWise is a gamified energy management platform that combines a real-time 3D home experience with AI-powered forecasting. Users interact with a virtual home to control appliances while background simulations model realistic baseline consumption. The platform rewards efficient behaviour through forecasting comparisons and leaderboard incentives.

## Features
- Real-time hybrid power model combining simulated baseline loads with user-controlled appliances
- Socket.io-driven live updates for instantaneous feedback in the 3D environment
- AI forecasting service powered by Python, XGBoost, and TimescaleDB
- Leaderboards, billing, and anomaly detection to motivate sustainable energy use
- Fully containerised stack for consistent local development and deployment

## Architecture
- **Frontend**: Next.js 14 (App Router), TypeScript, Three.js, Tailwind CSS, Zustand, Recharts
- **Backend**: Node.js / Express, PostgreSQL + TimescaleDB, Redis, Socket.io, cron jobs for simulations
- **ML Service**: Flask API serving XGBoost forecasts with Pandas/Numpy preprocessing
- **Infrastructure**: Docker Compose for local dev, Nginx reverse proxy, GitHub Actions CI/CD

## Project Structure
```
wattwise/
├── backend/            # Node.js backend (REST + WebSocket + simulations)
├── frontend/           # Next.js frontend with 3D experience
├── ml-service/         # Python forecasting service
├── nginx/              # Reverse proxy configuration
├── docs/               # Additional documentation
├── scripts/            # Utility scripts for DB and deployment
├── docker-compose.yml  # Development stack
└── docker-compose.prod.yml
```

## Getting Started
### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for direct backend/frontend development)
- Python 3.10+ (for ML service development)

### Setup
1. Copy environment templates and configure secrets:
   ```powershell
   Copy-Item .env.example .env
   Copy-Item backend\.env.example backend\.env
   Copy-Item frontend\.env.local.example frontend\.env.local
   Copy-Item ml-service\.env.example ml-service\.env
   ```
2. Start the full stack:
   ```powershell
   docker-compose up --build
   ```
3. Access services:
   - API: `http://localhost:3000`
   - Frontend: `http://localhost:3001`
   - ML service: `http://localhost:5001`

### Useful Commands
- `docker-compose logs -f backend` – Tail backend logs
- `docker-compose exec postgres psql -U wattwize_user -d wattwize_db` – Access database
- `docker-compose down -v` – Tear down and remove volumes

## Contributing
1. Fork the repo and create a feature branch.
2. Ensure linting/tests pass.
3. Update documentation where relevant.
4. Submit a pull request with a clear summary of changes.

## License
Distributed under the MIT License. See `LICENSE` for details.

