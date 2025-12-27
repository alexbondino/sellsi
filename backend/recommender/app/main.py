"""
FastAPI Application Entry Point
Localhost development server
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
import uvicorn

app = FastAPI(
    title="Sellsi Recommender API",
    description="Product recommendation service - MVP with randomization",
    version="1.0.0"
)

# CORS para localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternativo
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rutas
app.include_router(router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "service": "Sellsi Recommender",
        "version": "1.0.0",
        "status": "running",
        "mode": "localhost"
    }

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
