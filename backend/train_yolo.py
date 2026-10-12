from ultralytics import YOLO
import os

def train_model():
    dataset_yaml = os.path.join(os.getcwd(), "datasets", "Ingredients-Model-1", "data.yaml")
    
    if not os.path.exists(dataset_yaml):
        print("❌ ERROR: Dataset not found!")
        print("Please run 'python download_roboflow_dataset.py' first.")
        return

    print("🚀 Initializing YOLOv8 Neural Network...")
    # Load a pre-trained YOLOv8 'Nano' model (fastest training, good for crunch time)
    model = YOLO("yolov8n.pt")

    print(f"🧠 Training model on dataset: {dataset_yaml}")
    print("⚠️ This will take some time and spin up your RTX 2050 fans!")
    
    # Train the model
    results = model.train(
        data=dataset_yaml,
        epochs=30,       # Reduced to 30 to finish by 8 AM
        imgsz=640,       # Standard image size
        batch=8,         # Lowered to 8 to fix RTX 2050 cuDNN Out of Memory error
        device=0,        # Uses your NVIDIA RTX 2050 GPU
        name="food_scanner_v2" # Saves results to runs/detect/food_scanner_v2
    )
    
    print("✅ TRAINING COMPLETE!")
    print("Your brand new trained AI brain is saved at: runs/detect/food_scanner_v2/weights/best.pt")
    print("Next step: Plug 'best.pt' into your FastAPI backend!")

if __name__ == "__main__":
    train_model()
