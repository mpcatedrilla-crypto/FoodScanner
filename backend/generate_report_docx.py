"""Generate DOCX report of YOLOv8n confusion matrix analysis."""
from docx import Document
from docx.shared import Inches, Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
import os

doc = Document()

# ── Page margins ──
for section in doc.sections:
    section.top_margin = Cm(2)
    section.bottom_margin = Cm(2)
    section.left_margin = Cm(2.5)
    section.right_margin = Cm(2.5)

style = doc.styles['Normal']
font = style.font
font.name = 'Calibri'
font.size = Pt(11)

EVAL_DIR = r"C:\Users\Marck\runs\detect\confusion_eval"

# ══════════════════════════════════════════════════════
# TITLE
# ══════════════════════════════════════════════════════
title = doc.add_heading('YOLOv8n Food Scanner — Confusion Matrix Report', level=0)
title.alignment = WD_ALIGN_PARAGRAPH.CENTER

doc.add_paragraph('')
info = doc.add_paragraph()
info.add_run('Model: ').bold = True
info.add_run('best.pt (fine-tuned from yolov8n.pt)\n')
info.add_run('Dataset: ').bold = True
info.add_run('Ingredients-Model-1 — 58 classes (Roboflow)\n')
info.add_run('Evaluated on: ').bold = True
info.add_run('Test split · 448 images · 675 instances · 640px')

# ══════════════════════════════════════════════════════
# OVERALL PERFORMANCE
# ══════════════════════════════════════════════════════
doc.add_heading('1. Overall Performance', level=1)

table = doc.add_table(rows=7, cols=2)
table.style = 'Light Shading Accent 1'
table.alignment = WD_TABLE_ALIGNMENT.CENTER
metrics = [
    ('Metric', 'Value'),
    ('Precision', '0.704'),
    ('Recall', '0.630'),
    ('mAP@50', '0.696'),
    ('mAP@50-95', '0.522'),
    ('Best F1', '0.64 @ confidence 0.289'),
    ('Inference Speed', '40.6ms/image (CPU)'),
]
for i, (k, v) in enumerate(metrics):
    table.rows[i].cells[0].text = k
    table.rows[i].cells[1].text = v
    if i == 0:
        for cell in table.rows[i].cells:
            for p in cell.paragraphs:
                for r in p.runs:
                    r.bold = True

p = doc.add_paragraph()
r = p.add_run('\n⚠ Note: ')
r.bold = True
r.font.color.rgb = RGBColor(0xCC, 0x66, 0x00)
p.add_run('11 of 58 classes have zero test images — no performance data for: banana, cauliflower, crab, glass noodles, hotdog, kalabasa, napa cabbage, pineapple, pork, shrimp, sitaw.')

# ══════════════════════════════════════════════════════
# CONFUSION MATRICES
# ══════════════════════════════════════════════════════
doc.add_heading('2. Confusion Matrix (Normalized)', level=1)
doc.add_paragraph('Diagonal = correct predictions. Off-diagonal = confusion. Right column = missed as background.')
cm_norm = os.path.join(EVAL_DIR, "confusion_matrix_normalized.png")
if os.path.exists(cm_norm):
    doc.add_picture(cm_norm, width=Inches(6.0))
    doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER

doc.add_heading('3. Confusion Matrix (Raw Counts)', level=1)
cm_raw = os.path.join(EVAL_DIR, "confusion_matrix.png")
if os.path.exists(cm_raw):
    doc.add_picture(cm_raw, width=Inches(6.0))
    doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER

# ══════════════════════════════════════════════════════
# PR & F1 CURVES
# ══════════════════════════════════════════════════════
doc.add_heading('4. Precision-Recall Curve', level=1)
pr = os.path.join(EVAL_DIR, "BoxPR_curve.png")
if os.path.exists(pr):
    doc.add_picture(pr, width=Inches(5.5))
    doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER

doc.add_heading('5. F1-Confidence Curve', level=1)
f1 = os.path.join(EVAL_DIR, "BoxF1_curve.png")
if os.path.exists(f1):
    doc.add_picture(f1, width=Inches(5.5))
    doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER

# ══════════════════════════════════════════════════════
# PER-CLASS BREAKDOWN
# ══════════════════════════════════════════════════════
doc.add_heading('6. Full Per-Class Breakdown', level=1)

# Data from validation results
all_classes = [
    # (name, precision, recall, mAP50, mAP50-95, grade)
    ('Lumpia Wrapper', 0.850, 1.000, 0.977, 0.816, '★★★ Excellent'),
    ('ampalaya', 0.597, 0.667, 0.690, 0.570, '★ Fair'),
    ('banana', None, None, None, None, '— No test data'),
    ('banana heart', 0.566, 0.350, 0.845, 0.463, '★★ Good'),
    ('bangus', 0.923, 0.667, 0.837, 0.726, '★★ Good'),
    ('bay leaf', 0.664, 0.677, 0.726, 0.467, '★★ Good'),
    ('bean sprout', 0.736, 0.450, 0.399, 0.224, '✗ Poor'),
    ('beef', 0.881, 0.530, 0.758, 0.421, '★★ Good'),
    ('bell pepper', 0.838, 0.615, 0.761, 0.592, '★★ Good'),
    ('bottle gourd', 1.000, 0.390, 0.548, 0.272, '★ Fair'),
    ('broccoli', 0.866, 1.000, 0.995, 0.764, '★★★ Excellent'),
    ('cabbage', 1.000, 0.945, 0.995, 0.819, '★★★ Excellent'),
    ('calamansi', 0.870, 0.956, 0.978, 0.674, '★★★ Excellent'),
    ('carrot', 0.649, 1.000, 0.995, 0.890, '★★★ Excellent'),
    ('cassava', 0.318, 0.500, 0.337, 0.248, '✗ Poor'),
    ('cauliflower', None, None, None, None, '— No test data'),
    ('chicken', 0.998, 0.833, 0.897, 0.563, '★★ Good'),
    ('chili', 0.946, 1.000, 0.995, 0.879, '★★★ Excellent'),
    ('coconut', 0.674, 0.522, 0.666, 0.520, '★ Fair'),
    ('corn', 0.831, 0.329, 0.597, 0.340, '★ Fair'),
    ('crab', None, None, None, None, '— No test data'),
    ('cucumber', 0.750, 0.500, 0.773, 0.640, '★★ Good'),
    ('egg', 0.799, 1.000, 0.995, 0.895, '★★★ Excellent'),
    ('eggplant', 0.494, 1.000, 0.995, 0.862, '★★★ Excellent'),
    ('garlic', 0.618, 1.000, 0.978, 0.740, '★★★ Excellent'),
    ('ginger', 0.734, 1.000, 0.924, 0.805, '★★★ Excellent'),
    ('glass noodles', None, None, None, None, '— No test data'),
    ('hotdog', None, None, None, None, '— No test data'),
    ('kalabasa', None, None, None, None, '— No test data'),
    ('kangkong', 0.318, 0.526, 0.463, 0.307, '✗ Poor'),
    ('langka', 0.247, 0.250, 0.253, 0.182, '✗ Poor'),
    ('malunggay', 0.665, 0.273, 0.265, 0.212, '✗ Poor'),
    ('misua noodle', 0.810, 0.333, 0.336, 0.220, '✗ Poor'),
    ('monggo', 0.927, 0.581, 0.805, 0.641, '★★ Good'),
    ('mushroom', 0.652, 0.630, 0.685, 0.569, '★ Fair'),
    ('napa cabbage', None, None, None, None, '— No test data'),
    ('okra', 0.636, 0.505, 0.630, 0.509, '★ Fair'),
    ('onion', 0.285, 0.409, 0.216, 0.173, '✗ Poor'),
    ('patola', 0.622, 0.750, 0.782, 0.697, '★★ Good'),
    ('pea', 0.675, 0.322, 0.646, 0.404, '★ Fair'),
    ('pechay', 0.760, 0.595, 0.641, 0.385, '★ Fair'),
    ('pineapple', None, None, None, None, '— No test data'),
    ('pork', None, None, None, None, '— No test data'),
    ('pork liver', 0.545, 0.300, 0.283, 0.158, '✗ Poor'),
    ('potato', 0.516, 0.278, 0.346, 0.230, '✗ Poor'),
    ('quail egg', 0.880, 1.000, 0.995, 0.742, '★★★ Excellent'),
    ('radish', 0.702, 0.286, 0.423, 0.247, '✗ Poor'),
    ('rice', 0.732, 0.917, 0.971, 0.717, '★★★ Excellent'),
    ('sayote', 0.851, 0.714, 0.781, 0.600, '★★ Good'),
    ('scallion', 0.810, 0.537, 0.738, 0.572, '★★ Good'),
    ('shrimp', None, None, None, None, '— No test data'),
    ('sitaw', None, None, None, None, '— No test data'),
    ('squid', 0.591, 0.438, 0.472, 0.368, '✗ Poor'),
    ('taro', 0.411, 0.667, 0.470, 0.283, '✗ Poor'),
    ('tilapia', 0.578, 1.000, 0.995, 0.821, '★★★ Excellent'),
    ('tofu', 0.606, 0.481, 0.547, 0.352, '★ Fair'),
    ('tomato', 0.822, 0.500, 0.592, 0.516, '★ Fair'),
    ('tuna', 0.823, 0.375, 0.699, 0.424, '★ Fair'),
]

# ── Excellent ──
doc.add_heading('★★★ Excellent (mAP50 ≥ 0.90) — Model identifies reliably', level=2)
excellent = [c for c in all_classes if c[5].startswith('★★★')]
t = doc.add_table(rows=len(excellent)+1, cols=6)
t.style = 'Light Shading Accent 1'
t.alignment = WD_TABLE_ALIGNMENT.CENTER
headers = ['Class', 'Precision', 'Recall', 'mAP50', 'mAP50-95', 'Grade']
for j, h in enumerate(headers):
    t.rows[0].cells[j].text = h
    for p in t.rows[0].cells[j].paragraphs:
        for r in p.runs:
            r.bold = True
for i, c in enumerate(excellent):
    t.rows[i+1].cells[0].text = c[0]
    t.rows[i+1].cells[1].text = f'{c[1]:.3f}'
    t.rows[i+1].cells[2].text = f'{c[2]:.3f}'
    t.rows[i+1].cells[3].text = f'{c[3]:.3f}'
    t.rows[i+1].cells[4].text = f'{c[4]:.3f}'
    t.rows[i+1].cells[5].text = c[5]

# ── Good ──
doc.add_heading('★★ Good (mAP50 0.70–0.89)', level=2)
good = [c for c in all_classes if c[5].startswith('★★ ')]
t = doc.add_table(rows=len(good)+1, cols=6)
t.style = 'Light Shading Accent 1'
t.alignment = WD_TABLE_ALIGNMENT.CENTER
for j, h in enumerate(headers):
    t.rows[0].cells[j].text = h
    for p in t.rows[0].cells[j].paragraphs:
        for r in p.runs:
            r.bold = True
for i, c in enumerate(good):
    t.rows[i+1].cells[0].text = c[0]
    t.rows[i+1].cells[1].text = f'{c[1]:.3f}'
    t.rows[i+1].cells[2].text = f'{c[2]:.3f}'
    t.rows[i+1].cells[3].text = f'{c[3]:.3f}'
    t.rows[i+1].cells[4].text = f'{c[4]:.3f}'
    t.rows[i+1].cells[5].text = c[5]

# ── Fair ──
doc.add_heading('★ Fair (mAP50 0.50–0.69)', level=2)
fair = [c for c in all_classes if c[5].startswith('★ ')]
t = doc.add_table(rows=len(fair)+1, cols=6)
t.style = 'Light Shading Accent 1'
t.alignment = WD_TABLE_ALIGNMENT.CENTER
for j, h in enumerate(headers):
    t.rows[0].cells[j].text = h
    for p in t.rows[0].cells[j].paragraphs:
        for r in p.runs:
            r.bold = True
for i, c in enumerate(fair):
    t.rows[i+1].cells[0].text = c[0]
    t.rows[i+1].cells[1].text = f'{c[1]:.3f}'
    t.rows[i+1].cells[2].text = f'{c[2]:.3f}'
    t.rows[i+1].cells[3].text = f'{c[3]:.3f}'
    t.rows[i+1].cells[4].text = f'{c[4]:.3f}'
    t.rows[i+1].cells[5].text = c[5]

# ── Poor ──
doc.add_heading('✗ Poor (mAP50 < 0.50) — Model struggles', level=2)
poor = [c for c in all_classes if c[5].startswith('✗')]
t = doc.add_table(rows=len(poor)+1, cols=6)
t.style = 'Light Shading Accent 1'
t.alignment = WD_TABLE_ALIGNMENT.CENTER
for j, h in enumerate(headers):
    t.rows[0].cells[j].text = h
    for p in t.rows[0].cells[j].paragraphs:
        for r in p.runs:
            r.bold = True
for i, c in enumerate(poor):
    t.rows[i+1].cells[0].text = c[0]
    t.rows[i+1].cells[1].text = f'{c[1]:.3f}'
    t.rows[i+1].cells[2].text = f'{c[2]:.3f}'
    t.rows[i+1].cells[3].text = f'{c[3]:.3f}'
    t.rows[i+1].cells[4].text = f'{c[4]:.3f}'
    t.rows[i+1].cells[5].text = c[5]

# ── No test data ──
doc.add_heading('— No Test Data (11 classes)', level=2)
no_data = [c for c in all_classes if c[5].startswith('—')]
t = doc.add_table(rows=len(no_data)+1, cols=2)
t.style = 'Light Shading Accent 1'
t.alignment = WD_TABLE_ALIGNMENT.CENTER
t.rows[0].cells[0].text = 'Class'
t.rows[0].cells[1].text = 'Status'
for p in t.rows[0].cells[0].paragraphs:
    for r in p.runs:
        r.bold = True
for p in t.rows[0].cells[1].paragraphs:
    for r in p.runs:
        r.bold = True
for i, c in enumerate(no_data):
    t.rows[i+1].cells[0].text = c[0]
    t.rows[i+1].cells[1].text = 'No test images available'

# ══════════════════════════════════════════════════════
# CATEGORY SUMMARY
# ══════════════════════════════════════════════════════
doc.add_heading('7. Category Summary', level=1)

cat_data = [
    ('Category', 'Classes Tested', 'Avg mAP50', 'Avg Recall', 'Verdict'),
    ('Seasonings/Aromatics', '3/3', '0.876', '0.892', '★★★ Best'),
    ('Fruits', '2/4', '0.822', '0.739', '★★ Good'),
    ('Proteins/Meat/Seafood', '11/15', '0.753', '0.655', '★★ Decent'),
    ('Vegetables', '28/32', '0.638', '0.571', '★ Weakest'),
    ('Starches/Noodles', '4/5', '0.498', '0.507', '✗ Poor'),
    ('Others (Lumpia Wrapper)', '1/1', '0.977', '1.000', '★★★ Perfect'),
]
t = doc.add_table(rows=len(cat_data), cols=5)
t.style = 'Light Shading Accent 1'
t.alignment = WD_TABLE_ALIGNMENT.CENTER
for i, row_data in enumerate(cat_data):
    for j, val in enumerate(row_data):
        t.rows[i].cells[j].text = val
        if i == 0:
            for p in t.rows[i].cells[j].paragraphs:
                for r in p.runs:
                    r.bold = True

# ══════════════════════════════════════════════════════
# KEY CONFUSIONS
# ══════════════════════════════════════════════════════
doc.add_heading('8. Key Confusion Patterns', level=1)

confusions = [
    ('True Class', 'Confused With', 'Reason'),
    ('potato', 'cassava, taro, langka, rice', 'All pale/starchy, similar shapes'),
    ('cassava', 'potato, taro', 'Same root vegetable family'),
    ('taro', 'potato, cassava', 'Root vegetables look alike when peeled'),
    ('onion', 'garlic, potato', 'Round, pale objects'),
    ('kangkong', 'malunggay, pechay', 'Leafy green vegetables'),
    ('malunggay', 'kangkong, bay leaf', 'Small leaf clusters'),
    ('pork liver', 'beef', 'Dark red meat'),
    ('squid', 'fish/seafood classes', 'White seafood'),
    ('corn', 'background', 'Missed entirely (not detected)'),
    ('bean sprout', 'background', 'Too small, missed'),
]
t = doc.add_table(rows=len(confusions), cols=3)
t.style = 'Light Shading Accent 1'
t.alignment = WD_TABLE_ALIGNMENT.CENTER
for i, row_data in enumerate(confusions):
    for j, val in enumerate(row_data):
        t.rows[i].cells[j].text = val
        if i == 0:
            for p in t.rows[i].cells[j].paragraphs:
                for r in p.runs:
                    r.bold = True

# ══════════════════════════════════════════════════════
# SAMPLE PREDICTIONS
# ══════════════════════════════════════════════════════
doc.add_heading('9. Sample Predictions vs Ground Truth', level=1)

doc.add_heading('Ground Truth Labels', level=2)
labels_img = os.path.join(EVAL_DIR, "val_batch0_labels.jpg")
if os.path.exists(labels_img):
    doc.add_picture(labels_img, width=Inches(5.5))
    doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER

doc.add_heading('Model Predictions', level=2)
preds_img = os.path.join(EVAL_DIR, "val_batch0_pred.jpg")
if os.path.exists(preds_img):
    doc.add_picture(preds_img, width=Inches(5.5))
    doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER

doc.add_paragraph('Prediction image shows potato misclassified as "rice 0.3" and "langka 0.4" — confirms potato/starch confusion pattern.')

# ══════════════════════════════════════════════════════
# RECOMMENDATIONS
# ══════════════════════════════════════════════════════
doc.add_heading('10. Recommendations', level=1)

doc.add_heading('Quick Wins', level=2)
doc.add_paragraph('Lower confidence threshold — Best F1 at 0.289, default 0.25 is near optimal.', style='List Bullet')
doc.add_paragraph('Add 80–100 more labeled images per broken class (langka, onion, malunggay, pork liver, misua noodle, cassava, potato).', style='List Bullet')
doc.add_paragraph('Add test images for 11 untested classes — cannot measure improvement without test data.', style='List Bullet')

doc.add_heading('Training Improvements', level=2)
doc.add_paragraph('Train longer — increase from 30 to 100 epochs with patience=15 early stopping.', style='List Bullet')
doc.add_paragraph('Increase image size from 640 to 1280 for small objects (malunggay leaves, bean sprouts).', style='List Bullet')
doc.add_paragraph('Enable data augmentation — mosaic, mixup, HSV color shifts to reduce root vegetable confusion.', style='List Bullet')
doc.add_paragraph('Consider merging cassava/potato/taro into "root vegetable" if app does not need distinction.', style='List Bullet')

doc.add_heading('Model Architecture', level=2)
doc.add_paragraph('Try YOLOv8s (small) instead of YOLOv8n (nano) — 2x more parameters, better accuracy for 58-class problem.', style='List Bullet')
doc.add_paragraph('Use class-weighted loss — upweight rare/poor-performing classes during training.', style='List Bullet')

doc.add_heading('Priority Roadmap', level=2)
roadmap = [
    ('Step', 'Action', 'Effort', 'Impact'),
    ('1', 'Add 80-100 images per broken class', '2-3 hours', '★★★ Highest'),
    ('2', 'Add test images for 11 missing classes', '1 hour', '★★ Needed'),
    ('3', 'Retrain with 100 epochs + augmentation', 'Overnight', '★★★ High'),
    ('4', 'Evaluate again with confusion_matrix.py', '5 min', 'Verify'),
    ('5', 'If still confused: merge root vegetables', '30 min', '★★ Moderate'),
    ('6', 'Try yolov8s.pt instead of yolov8n.pt', 'Overnight', '★★ Better'),
]
t = doc.add_table(rows=len(roadmap), cols=4)
t.style = 'Light Shading Accent 1'
t.alignment = WD_TABLE_ALIGNMENT.CENTER
for i, row_data in enumerate(roadmap):
    for j, val in enumerate(row_data):
        t.rows[i].cells[j].text = val
        if i == 0:
            for p in t.rows[i].cells[j].paragraphs:
                for r in p.runs:
                    r.bold = True

# ── Save ──
output = os.path.join(os.path.dirname(os.path.abspath(__file__)), "YOLOv8n_Confusion_Matrix_Report.docx")
doc.save(output)
print(f"DOCX saved to: {output}")
