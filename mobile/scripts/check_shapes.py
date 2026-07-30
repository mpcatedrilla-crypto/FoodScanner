import tensorflow as tf

coco = tf.lite.Interpreter(model_path='assets/yolov8n_float16.tflite')
coco.allocate_tensors()
print("COCO input :", coco.get_input_details()[0]['shape'])
print("COCO output:", coco.get_output_details()[0]['shape'])

egg = tf.lite.Interpreter(model_path=r'C:\Users\Marck\runs\detect\runs\egg\train\weights\best_saved_model\best_float16.tflite')
egg.allocate_tensors()
print("Egg  input :", egg.get_input_details()[0]['shape'])
print("Egg  output:", egg.get_output_details()[0]['shape'])
