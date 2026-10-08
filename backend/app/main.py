from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.state import app_state
from backend.app.api.routes_cases import router as cases_router
from backend.app.api.routes_graph import router as graph_router
from backend.app.api.routes_search import router as search_router
from backend.app.api.routes_entities import router as entities_router
from backend.app.api.routes_analysis import router as analysis_router
from backend.app.api.routes_relationships import router as relationships_router
from backend.app.api.routes_intelligence_graph import router as intelligence_graph_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize real dataset, search indexes, and graph structures
    print("[PORTAL STARTUP] Initializing Real Indian Crime Intelligence portal...")
    app_state.initialize()
    yield


app = FastAPI(
    title="Indian Crime Intelligence & Case Relationship Discovery Portal API",
    description="Backend intelligence and knowledge graph engine for discovering multi-signal crime incident profiles across 40,160 real Indian crime cases.",
    version="2.0.0",
    lifespan=lifespan,
)

# Enable CORS for local Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(cases_router)
app.include_router(graph_router)
app.include_router(intelligence_graph_router)
app.include_router(search_router)
app.include_router(entities_router)
app.include_router(analysis_router)
app.include_router(relationships_router)


@app.get("/api/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "indian-crime-intelligence-relationship-engine",
        "dataset": "Indian Crimes Dataset (Cleaned Real Records)",
        "cases_loaded": len(app_state.cases),
        "cities": len(app_state.entities.cities),
        "crime_types": len(app_state.entities.crime_descriptions),
        "recurrent_patterns": len(app_state.patterns),
        "graph_active": True,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
