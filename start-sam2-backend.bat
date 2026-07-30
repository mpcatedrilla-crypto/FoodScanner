@echo off
echo Starting SAM 2 Auto-Annotator Backend (CUDA Accelerated)...
cd C:\projects\food-scanner
call sam2_venv\Scripts\activate.bat
cd sam2
set DEVICE=cuda
set MODEL_CONFIG=configs/sam2.1/sam2.1_hiera_t.yaml
set MODEL_CHECKPOINT=sam2.1_hiera_tiny.pt
set LABEL_STUDIO_URL=http://localhost:8080
set LABEL_STUDIO_API_KEY=eb132658ea01c116c15cafd2e47723c90becdb7e
label-studio-ml start ../label-studio-ml-backend/label_studio_ml/examples/segment_anything_2_image
