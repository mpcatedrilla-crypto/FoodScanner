import json
import urllib.request
import base64

with open(r'backend\test.jpg', 'rb') as f:
    img_data = base64.b64encode(f.read()).decode('utf-8')

req = urllib.request.Request(
    'https://catlike-calzone-isotope.ngrok-free.dev/predict',
    data=json.dumps({'base64_image': img_data}).encode('utf-8'),
    headers={
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
    },
    method='POST'
)

try:
    res = urllib.request.urlopen(req)
    print(res.read().decode('utf-8'))
except Exception as e:
    print(e)
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
