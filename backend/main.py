import base64
import time
import numpy as np
import cv2
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO

app = FastAPI(title="YOLO Food Scanner API")

# Allow the React Native app to communicate with this server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the newly trained YOLO model globally on server start!
model_path = os.path.join(os.getcwd(), "best.pt")
print(f"Loading YOLO model from: {model_path}")
if not os.path.exists(model_path):
    print("WARNING: best.pt not found! Make sure you copied it from the runs folder.")
    model = None
else:
    model = YOLO(model_path)

class ImageRequest(BaseModel):
    base64_image: str

@app.post("/predict")
async def predict_ingredients(request: ImageRequest):
    if model is None:
         raise HTTPException(status_code=500, detail="Model best.pt is not loaded.")
         
    try:
        start_time = time.time()
        
        # 1. Decode the base64 string from the Android App into an Image
        image_data = base64.b64decode(request.base64_image)
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
             raise ValueError("Could not decode base64 string into an image.")
             
        height, width = img.shape[:2]
        
        # conf=0.4 ignores low-confidence guesses
        # iou=0.3 strictly merges overlapping boxes of the same object
        results = model.predict(source=img, imgsz=640, conf=0.4, iou=0.3)
        
        # 3. Parse the results into the exact JSON format your app expects
        predictions = []
        result = results[0] # We only sent 1 image
        
        for box in result.boxes:
            # YOLO provides exact coordinates
            x_center, y_center, w, h = box.xywh[0].tolist()
            conf = float(box.conf[0])
            class_id = int(box.cls[0])
            class_name = result.names[class_id]
            
            # Format expected by React Native
            predictions.append({
                "class": class_name,
                "confidence": round(conf, 3),
                "x": round(x_center, 1),
                "y": round(y_center, 1),
                "width": round(w, 1),
                "height": round(h, 1)
            })
            
        process_time = round(time.time() - start_time, 3)
        print(f"Found {len(predictions)} ingredients in {process_time}s!")
        
        return {
            "predictions": predictions,
            "image": {"width": width, "height": height},
            "time": process_time
        }
        
    except Exception as e:
        print(f"Error during prediction: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "YOLO Food Scanner API is running!"}

if __name__ == "__main__":
    import uvicorn
    # Runs the server on all IP addresses so the phone can reach it on port 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
