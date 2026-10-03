import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import * as jpeg from 'jpeg-js';

export interface RoboflowPrediction {
  id?: string;
  class: string;
  confidence: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

const CLASS_NAMES = [
  'Lumpia Wrapper', 'ampalaya', 'banana', 'banana heart', 'bangus', 'bay leaf', 'bean sprout', 'beef', 'bell pepper', 
  'bottle gourd', 'broccoli', 'cabbage', 'calamansi', 'carrot', 'cassava', 'cauliflower', 'chicken', 'chili', 'coconut', 
  'corn', 'crab', 'cucumber', 'egg', 'eggplant', 'garlic', 'ginger', 'glass noodles', 'hotdog', 'kalabasa', 'kangkong', 
  'langka', 'malunggay', 'misua noodle', 'monggo', 'mushroom', 'napa cabbage', 'okra', 'onion', 'patola', 'pea', 'pechay', 
  'pineapple', 'pork', 'pork liver', 'potato', 'quail egg', 'radish', 'rice', 'sayote', 'scallion', 'shrimp', 'sitaw', 
  'squid', 'taro', 'tilapia', 'tofu', 'tomato', 'tuna'
];

let session: InferenceSession | null = null;

async function logDebug(msg: string) {
  const path = FileSystem.documentDirectory + 'debug.txt';
  try {
    const existing = await FileSystem.readAsStringAsync(path).catch(() => '');
    await FileSystem.writeAsStringAsync(path, existing + '\n' + msg);
  } catch (e) {}
}

async function loadModel() {
  if (session) return session;
  
  const modelName = 'best.onnx';
  const modelPath = `${FileSystem.documentDirectory}${modelName}`;
  const modelInfo = await FileSystem.getInfoAsync(modelPath);
  
  if (!modelInfo.exists) {
    const asset = Asset.fromModule(require('../../assets/best.onnx'));
    await asset.downloadAsync();
    await FileSystem.copyAsync({
      from: asset.localUri || asset.uri,
      to: modelPath,
    });
  }
  
  await logDebug("Model loaded. " + modelPath);
  session = await InferenceSession.create(modelPath);
  return session;
}

function iou(boxA: number[], boxB: number[]): number {
  const xA = Math.max(boxA[0], boxB[0]);
  const yA = Math.max(boxA[1], boxB[1]);
  const xB = Math.min(boxA[2], boxB[2]);
  const yB = Math.min(boxA[3], boxB[3]);

  const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
  if (interArea === 0) return 0;

  const boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1]);
  const boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1]);

  return interArea / (boxAArea + boxBArea - interArea);
}

export async function detectIngredients(base64Image: string): Promise<{ predictions: RoboflowPrediction[] } | null> {
  try {
    await logDebug("detectIngredients called");
    const sess = await loadModel();
    await logDebug("Session created");
    
    // Decode base64 JPEG
    const rawImageData = new Uint8Array(decode(base64Image));
    const image = jpeg.decode(rawImageData, { useTArray: true });
    await logDebug(`Decoded image: ${image.width}x${image.height}`);
    
    const width = 640;
    const height = 640;
    const numPixels = width * height;
    
    // Normalized to 0.0-1.0
    const float32Data = new Float32Array(3 * numPixels);
    for (let i = 0; i < numPixels; i++) {
      const r = image.data[i * 4];
      const g = image.data[i * 4 + 1];
      const b = image.data[i * 4 + 2];
      
      float32Data[i] = r / 255.0; // R
      float32Data[numPixels + i] = g / 255.0; // G
      float32Data[2 * numPixels + i] = b / 255.0; // B
    }

    const tensor = new Tensor('float32', float32Data, [1, 3, height, width]);
    const feeds: Record<string, Tensor> = {};
    feeds[sess.inputNames[0]] = tensor;
    
    await logDebug(`Running ONNX session... input shape: ${tensor.dims.join('x')}`);
    const results = await sess.run(feeds);
    const output = results[sess.outputNames[0]]; 
    
    const outputData = output.data as Float32Array;
    const dims = output.dims; // e.g. [1, 62, 8400] or [1, 8400, 62]
    await logDebug(`Output dims: ${dims.join('x')}, len: ${outputData.length}`);
    
    const numClasses = CLASS_NAMES.length;
    let numAnchors = 8400;
    let isTransposed = false;
    let numFeatures = 62;
    
    if (dims.length === 3) {
      if (dims[1] === 8400 || dims[1] === 8400) { // e.g. [1, 8400, 62]
        isTransposed = true;
        numAnchors = dims[1];
        numFeatures = dims[2];
      } else { // e.g. [1, 62, 8400]
        isTransposed = false;
        numAnchors = dims[2];
        numFeatures = dims[1];
      }
    }
    
    const threshold = 0.25;
    const iouThreshold = 0.45;
    
    const candidates: number[][] = [];
    let maxConfOverall = 0;

    for (let a = 0; a < numAnchors; a++) {
      let maxConf = 0;
      let maxClassIdx = -1;
      
      for (let c = 0; c < numClasses; c++) {
        const conf = isTransposed 
          ? outputData[ a * numFeatures + (4 + c) ]
          : outputData[ (4 + c) * numAnchors + a ];
          
        if (conf > maxConf) {
          maxConf = conf;
          maxClassIdx = c;
        }
      }
      
      if (maxConf > maxConfOverall) maxConfOverall = maxConf;
      
      if (maxConf > threshold) {
        const x_c = isTransposed ? outputData[ a * numFeatures + 0 ] : outputData[ 0 * numAnchors + a ];
        const y_c = isTransposed ? outputData[ a * numFeatures + 1 ] : outputData[ 1 * numAnchors + a ];
        const w   = isTransposed ? outputData[ a * numFeatures + 2 ] : outputData[ 2 * numAnchors + a ];
        const h   = isTransposed ? outputData[ a * numFeatures + 3 ] : outputData[ 3 * numAnchors + a ];
        
        const x_min = x_c - w / 2.0;
        const y_min = y_c - h / 2.0;
        const x_max = x_c + w / 2.0;
        const y_max = y_c + h / 2.0;
        
        candidates.push([x_min, y_min, x_max, y_max, maxConf, maxClassIdx]);
      }
    }

    await logDebug(`Max confidence found: ${maxConfOverall}, Candidates: ${candidates.length}`);

    candidates.sort((a, b) => b[4] - a[4]);
    
    const predictions: RoboflowPrediction[] = [];
    const picked: boolean[] = new Array(candidates.length).fill(false);

    for (let i = 0; i < candidates.length; i++) {
      if (picked[i]) continue;
      
      const boxA = candidates[i];
      const classIdx = boxA[5];
      
      predictions.push({
        id: Math.random().toString(36).substr(2, 9),
        class: CLASS_NAMES[classIdx],
        confidence: boxA[4],
        x: (boxA[0] + boxA[2]) / 2.0, // x_center
        y: (boxA[1] + boxA[3]) / 2.0, // y_center
        width: boxA[2] - boxA[0],
        height: boxA[3] - boxA[1],
      });
      
      for (let j = i + 1; j < candidates.length; j++) {
        if (!picked[j] && candidates[j][5] === classIdx) {
          if (iou(boxA, candidates[j]) > iouThreshold) {
            picked[j] = true;
          }
        }
      }
    }

    return { predictions };
  } catch (error) {
    console.error("ONNX Inference Error:", error);
    await logDebug(`ONNX Inference Error: ${error}`);
    return { predictions: [] };
  }
}
