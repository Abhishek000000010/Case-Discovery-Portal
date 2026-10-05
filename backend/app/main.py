from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.state import app_state
from backend.app.api.routes_cases import router as cases_router
from backend.app.api.routes_graph import router as graph_router
from backend.app.api.routes_search import router as search_router
from backend.app.api.routes_entities import router as entities_router
from backend.app.api.routes_analysis import router as analysis_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize dataset, discovery engine, and multi-relational graph
    print("[PORTAL STARTUP] Initializing Crime Intelligence data & relationship engine...")
    app_state.initialize()
    print(f"[PORTAL READY] Loaded {len(app_state.cases)} cases, {len(app_state.relationships)} relationships discovered.")
    yield


app = FastAPI(
    title="Crime Intelligence & Case Relationship Discovery Portal API",
    description="Backend intelligence and graph analytics engine for discovery of cross-case crime relationships.",
    version="1.0.0",
    lifespan=lifespan
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
app.include_router(search_router)
app.include_router(entities_router)
app.include_router(analysis_router)


@app.get("/api/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "crime-intelligence-relationship-engine",
        "cases_loaded": len(app_state.cases),
        "relationships_cached": len(app_state.relationships),
        "graph_active": app_state.graph_service.nx_graph.number_of_nodes() > 0
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
