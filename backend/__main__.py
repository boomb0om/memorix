import asyncio
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from users.api.users import router as users_router
from notes.api.notes import router as notes_router
from courses.api.courses import router as courses_router
from core.middleware.auth_middleware import auth_middleware

logger = logging.getLogger(__name__)


def create_app():
    app = FastAPI(title="Memorix API", version="1.0.0")
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://localhost:80", "http://frontend"],  # Frontend URL
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )
    app.middleware("http")(auth_middleware)

    app.include_router(users_router, prefix="/api")
    app.include_router(notes_router, prefix="/api")
    app.include_router(courses_router, prefix="/api")

    @app.on_event("startup")
    async def startup_event():
        """Запуск seeder при старте приложения"""
        try:
            from scripts.seed_db import seed_database
            logger.info("Running database seeder...")
            await seed_database()
            logger.info("Database seeder completed")
        except Exception as e:
            logger.error(f"Error during database seeding: {e}", exc_info=True)
            # Не прерываем запуск приложения, если seeder упал
    
    return app


app = create_app()


@app.get("/")
async def root():
    return {"message": "Memorix API is running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
