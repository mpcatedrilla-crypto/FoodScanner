from ultralytics import YOLO
import os

def main():
    model = YOLO(r"C:\Users\Marck\runs\detect\food_scanner_v2-4\weights\last.pt")
    model.train(resume=True)

if __name__ == "__main__":
    main()
