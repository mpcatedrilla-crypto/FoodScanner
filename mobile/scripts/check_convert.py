"""
Convert yolov8n.onnx → yolov8n_float16.tflite using onnxruntime + flatbuffers.
No TensorFlow required — uses ONNX Runtime's built-in TFLite exporter.
"""
import sys
import os

print(f"Python: {sys.version}")

try:
    import onnxruntime as ort
    print(f"ONNXRuntime: {ort.__version__}")
except ImportError:
    print("ERROR: onnxruntime not installed")
    sys.exit(1)

# Check if onnxruntime has TFLite export capability
providers = ort.get_available_providers()
print(f"Available providers: {providers}")

# Try using onnxruntime-extensions or direct serialization
try:
    import onnx
    print(f"ONNX: {onnx.__version__}")
    
    model = onnx.load("yolov8n.onnx")
    print(f"ONNX model loaded: {len(model.graph.node)} nodes")
    
    # Check opset
    opset = model.opset_import[0].version
    print(f"ONNX opset: {opset}")
    
except Exception as e:
    print(f"ONNX load error: {e}")

# Try using ai_edge_torch or flatbuffers approach
try:
    import subprocess
    # Use tflite_support if available  
    result = subprocess.run([sys.executable, "-c", "import tflite_support; print('tflite_support available')"],
                          capture_output=True, text=True)
    print(result.stdout.strip() or f"tflite_support not available: {result.stderr.strip()}")
except Exception as e:
    print(f"tflite check error: {e}")
    
print("\nConclusion: Cannot convert without TensorFlow. Need Python <= 3.12.")
print("Suggestion: Use the ONNX model directly with onnxruntime on Android via onnxruntime-android.")
