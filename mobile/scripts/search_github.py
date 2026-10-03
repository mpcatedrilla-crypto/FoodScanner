"""Search GitHub for egg detection YOLO datasets"""
import requests, json

r = requests.get('https://api.github.com/search/repositories', 
    params={'q': 'egg detection yolo dataset', 'sort': 'stars', 'per_page': 10},
    headers={'Accept': 'application/vnd.github.v3+json'})
data = r.json()
for item in data.get('items', [])[:8]:
    name = item['full_name']
    stars = item['stargazers_count']
    desc = (item.get('description') or '')[:60]
    url = item['html_url']
    print(f"{name} (stars:{stars}) - {desc}")
    print(f"  {url}")
