from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import time

app = FastAPI(title="SAM 2 Food Scanner API")

# Allow the React Native app to communicate with this server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ImageRequest(BaseModel):
    base64_image: str

@app.post("/predict")
async def predict_ingredients(request: ImageRequest):
    try:
        # 1. Decode the base64 image coming from the React Native app
        image_data = base64.b64decode(request.base64_image)
        
        # -------------------------------------------------------------
        # TODO: THIS IS WHERE YOU PLUG IN YOUR SAM 2 / MODEL CODE!
        # Example pseudo-code:
        # image = load_image_from_bytes(image_data)
        # masks, classes = sam2_model.predict(image)
        # ingredients = process_classes(classes)
        # -------------------------------------------------------------
        
        # For now, we return mock data so you can test the app connection!
        time.sleep(1) # Simulate AI processing time
        
        # This format mimics the old Roboflow format so the app doesn't break
        return {
            "predictions": [
                {"class": "Tomato", "confidence": 0.95, "x": 100, "y": 100},
                {"class": "Egg", "confidence": 0.88, "x": 200, "y": 200}
            ],
            "image": {"width": 800, "height": 800},
            "time": 1.0
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "SAM 2 Food Scanner API is running!"}

if __name__ == "__main__":
    import uvicorn
    # Runs the server on all IP addresses so the phone can reach it
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
