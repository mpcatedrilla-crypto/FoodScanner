@echo off
cd C:\projects\food-scanner
echo Creating Python 3.12 Virtual Environment...
py -3.12 -m venv sam2_venv
call sam2_venv\Scripts\activate.bat
echo Installing PyTorch with CUDA 12.1...
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
echo Installing Label Studio ML Backend...
pip install label-studio-ml
cd sam2
echo Installing SAM 2...
pip install -e .
pip install -e ".[notebooks]"
echo DONE.
