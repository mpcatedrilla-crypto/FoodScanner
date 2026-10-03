"""
Diagnose the egg TFLite model:
1. Print actual output tensor shape
2. Run on a downloaded egg image
3. Check if it detects anything
"""
import numpy as np
import urllib.request, sys
from pathlib import Path

TFLITE_PATH = r"C:\Users\Marck\runs\detect\runs\egg\train\weights\best_saved_model\best_float16.tflite"

print("=" * 60)
print("  Egg Model Diagnostic")
print("=" * 60)

# Load TFLite model
import tensorflow as tf
interpreter = tf.lite.Interpreter(model_path=TFLITE_PATH)
interpreter.allocate_tensors()

input_details  = interpreter.get_input_details()
output_details = interpreter.get_output_details()

print(f"\nInput  shape: {input_details[0]['shape']}  dtype: {input_details[0]['dtype']}")
print(f"Output shape: {output_details[0]['shape']}  dtype: {output_details[0]['dtype']}")

# Download a clear egg image for testing
print("\nDownloading test egg image...")
test_url = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Egg_BNC.jpg/640px-Egg_BNC.jpg"
test_img_path = "test_egg.jpg"
try:
    urllib.request.urlretrieve(test_url, test_img_path)
    print(f"  Downloaded: {test_img_path}")
except Exception as e:
    print(f"  Download failed: {e}")
    # Try alternative
    try:
        alt_url = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/White_egg_01.jpg/640px-White_egg_01.jpg"
        urllib.request.urlretrieve(alt_url, test_img_path)
        print(f"  Downloaded alternative: {test_img_path}")
    except:
        print("  Could not download test image")

# Run inference
if Path(test_img_path).exists():
    img = tf.image.decode_jpeg(tf.io.read_file(test_img_path), channels=3)
    img = tf.image.resize(img, [640, 640]) / 255.0
    # YOLOv8 needs [1, 3, 640, 640] (CHW) or [1, 640, 640, 3] (HWC)?
    # Check input shape
    inp_shape = input_details[0]['shape']
    print(f"\nInput tensor shape: {inp_shape}")

    if inp_shape[1] == 3:
        # CHW format: [1, 3, 640, 640]
        img_np = np.transpose(img.numpy(), (2, 0, 1))[np.newaxis].astype(np.float32)
        print("  Using CHW format")
    else:
        # HWC format: [1, 640, 640, 3]
        img_np = img.numpy()[np.newaxis].astype(np.float32)
        print("  Using HWC format")

    interpreter.set_tensor(input_details[0]['index'], img_np)
    interpreter.invoke()
    output = interpreter.get_tensor(output_details[0]['index'])

    print(f"\nOutput tensor shape: {output.shape}")
    print(f"Output min: {output.min():.4f}  max: {output.max():.4f}")

    # Try to parse detections
    N = 8400
    out_flat = output.flatten()
    print(f"Output total elements: {len(out_flat)}")

    # Determine number of classes from shape
    if output.shape[1] == N:
        # Shape is [1, 8400, ?] — transposed
        num_ch = output.shape[2]
        print(f"\nLayout: [1, 8400, {num_ch}] (HW-first / transposed)")
        num_classes = num_ch - 4
        print(f"Num classes: {num_classes}")
        # Read class score at index 4 for each anchor
        scores = output[0, :, 4:]
        max_scores = scores.max(axis=1)
        top5_idx = np.argsort(max_scores)[-5:][::-1]
        print("\nTop 5 detections (transposed layout):")
        for idx in top5_idx:
            s = max_scores[idx]
            cx = output[0, idx, 0]
            cy = output[0, idx, 1]
            w  = output[0, idx, 2]
            h  = output[0, idx, 3]
            print(f"  anchor={idx}  score={s:.4f}  cx={cx:.3f} cy={cy:.3f} w={w:.3f} h={h:.3f}")
    else:
        # Shape is [1, ?, 8400] — channel-first
        num_ch = output.shape[1]
        num_classes = num_ch - 4
        print(f"\nLayout: [1, {num_ch}, 8400] (channel-first)")
        print(f"Num classes: {num_classes}")
        scores = output[0, 4:, :]  # [num_classes, 8400]
        max_scores = scores.max(axis=0)
        top5_idx = np.argsort(max_scores)[-5:][::-1]
        print("\nTop 5 detections (channel-first layout):")
        for idx in top5_idx:
            s = max_scores[idx]
            cx = output[0, 0, idx] / 640
            cy = output[0, 1, idx] / 640
            w  = output[0, 2, idx] / 640
            h  = output[0, 3, idx] / 640
            print(f"  anchor={idx}  score={s:.4f}  cx={cx:.3f} cy={cy:.3f} w={w:.3f} h={h:.3f}")

    print("\n✅ Diagnostic complete.")
    print("   If max score < 0.35, the model needs retraining with better data.")
    print("   If layout is transposed, we need to fix parseEggOutput in the app.")
