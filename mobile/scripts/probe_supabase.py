import urllib.request, json

key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmaXVkYnhqZGNpcmtlamlkc2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NTQwMTcsImV4cCI6MjA5NTEzMDAxN30.W1JFAD-7vjIy1aHGJSH5jtlaCo8oZYMP2JiL2062wsw'
base = 'https://sfiudbxjdcirkejidscl.supabase.co/rest/v1'
tables = ['ingredients', 'recipes', 'ingredient', 'recipe', 'food_items', 'items', 'products']

for table in tables:
    url = base + '/' + table + '?select=*&limit=2'
    req = urllib.request.Request(url, headers={
        'apikey': key,
        'Authorization': 'Bearer ' + key
    })
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            data = json.loads(r.read())
            keys = list(data[0].keys()) if data else 'empty'
            print('FOUND [' + table + ']: ' + str(len(data)) + ' rows, cols: ' + str(keys))
    except Exception as e:
        print('[' + table + ']: ' + str(e))
