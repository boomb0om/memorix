from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from users.api.users import router as users_router
from core.middleware.auth_middleware import auth_middleware


def create_app():
    app = FastAPI(title="Memorix API", version="1.0.0")
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],  # Frontend URL
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.middleware("http")(auth_middleware)

    app.include_router(users_router)
    return app


app = create_app()


@app.get("/")
async def root():
    return {"message": "Memorix API is running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
