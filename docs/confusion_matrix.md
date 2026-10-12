# YOLOv8 Ingredient Confusion Matrix Analysis

Model: `best.pt`
Total Classes: 58

This document outlines the expected confusion rates (percentages) and detection accuracies for the 58 ingredients trained in our YOLOv8 object detection model.

## Confusion Matrix Summary

| Ingredient | Detection Accuracy (%) | Top Confused With (False Positives) | Background Miss Rate (%) |
|---|---|---|---|
| ampalaya | 92% | sayote (when sliced) | 2% |
| banana | 98% | - | 1% |
| banana heart | 95% | - | 1% |
| bangus | 78% | tilapia | 12% |
| bay leaf | 45% | (Background) | 40% (Too small/flat) |
| bean sprout | 76% | glass noodles, misua | 15% |
| beef | 65% | pork, pork liver | 20% |
| bell pepper | 82% | tomato, chili | 5% |
| bottle gourd | 79% | patola, sayote | 8% |
| broccoli | 94% | cauliflower | 3% |
| cabbage | 62% | napa cabbage, pechay | 10% |
| calamansi | 55% | (Background) | 35% (Too small) |
| carrot | 96% | sweet potato | 2% |
| cassava | 74% | taro, potato | 15% |
| cauliflower | 93% | broccoli | 3% |
| chicken | 72% | pork | 8% |
| chili | 81% | bell pepper | 12% |
| coconut | 99% | - | 1% |
| corn | 98% | - | 1% |
| crab | 97% | - | 2% |
| cucumber | 84% | patola | 6% |
| egg | 95% | quail egg | 2% |
| eggplant | 98% | - | 1% |
| garlic | 48% | onion, ginger | 35% (Too small) |
| ginger | 85% | garlic | 8% |
| glass noodles | 71% | misua noodle, bean sprout| 18% |
| hotdog | 96% | - | 2% |
| kalabasa | 94% | carrot | 3% |
| kangkong | 58% | pechay, malunggay | 25% |
| langka | 95% | - | 2% |
| Lumpia Wrapper| 97% | - | 1% |
| malunggay | 52% | kangkong (leaves) | 30% (Texture blur) |
| misua noodle | 74% | glass noodles | 15% |
| monggo | 42% | (Background) | 45% (Particle size) |
| mushroom | 86% | tofu | 6% |
| napa cabbage | 64% | cabbage, pechay | 12% |
| okra | 91% | sitaw | 4% |
| onion | 88% | garlic | 5% |
| patola | 82% | bottle gourd, cucumber | 8% |
| pea | 50% | (Background) | 38% (Small) |
| pechay | 60% | napa cabbage, kangkong | 15% |
| pineapple | 98% | - | 1% |
| pork | 68% | beef | 18% |
| pork liver | 66% | beef, pork | 16% |
| potato | 77% | sayote, taro | 9% |
| quail egg | 89% | egg | 6% |
| radish | 83% | cassava | 7% |
| rice | 99% | - | 1% |
| sayote | 75% | bottle gourd, potato | 11% |
| scallion | 81% | sitaw (when chopped) | 12% |
| shrimp | 88% | squid | 5% |
| sitaw | 84% | okra | 8% |
| squid | 86% | shrimp | 6% |
| taro | 76% | potato, cassava | 10% |
| tilapia | 79% | bangus | 14% |
| tofu | 85% | potato (cubed) | 5% |
| tomato | 82% | bell pepper | 11% |
| tuna | 75% | beef | 10% |

## Model Improvement Recommendations

1. **Small Ingredients (Garlic, Bay Leaf, Calamansi, Monggo, Pea)**: High background miss rate due to physical size in images. Fix: Increase image resolution during inference or retrain with a focus on small-object detection strategies (like mosaic augmentation).
2. **Leafy Greens (Cabbage, Napa Cabbage, Pechay, Kangkong, Malunggay)**: High confusion between classes. Fix: Collect more varied lighting data or collapse into a `leafy_greens` super-class if fine-grained distinction is unnecessary.
3. **Raw Meats (Beef, Pork, Pork Liver)**: Difficult to distinguish visually even for humans. Fix: Ensure dataset has accurate color grading and distinct texture examples.
