import csv, json, os
from bs4 import BeautifulSoup
from datetime import datetime, timezone
root='/home/ubuntu/food-dataset'
html=open(root+'/source/panganku-all-foods.html',encoding='utf-8').read()
soup=BeautifulSoup(html,'html.parser')
table=soup.select_one('table#data')
rows=[]
for tr in table.select('tbody tr'):
    cells=[c.get_text(' ',strip=True) for c in tr.find_all('td')]
    if cells and any(cells):
        rows.append(cells)
headers=[c.get_text(' ',strip=True) for c in table.select('thead th')]
records=[]
for cells in rows:
    record={headers[i] if i<len(headers) else f'column_{i+1}': cells[i] for i in range(len(cells))}
    record['record_id']='panganku-ifct-'+(cells[0] if cells else str(len(records)+1))
    record['source_url']='https://www.panganku.org/en-EN/semua_nutrisi'
    record['accessed_at']=datetime.now(timezone.utc).isoformat()
    record['source_type']='Indonesian Food Composition Table (IFCT), searchable web table'
    record['verification_status']='official-source-recorded; values preserved as published'
    record['confidence_level']='high'
    records.append(record)
os.makedirs(root+'/processed',exist_ok=True)
with open(root+'/processed/panganku_ifct_foods.jsonl','w',encoding='utf-8') as f:
    for r in records:f.write(json.dumps(r,ensure_ascii=False)+'\n')
with open(root+'/processed/panganku_ifct_foods.json','w',encoding='utf-8') as f:json.dump(records,f,ensure_ascii=False,indent=2)
with open(root+'/processed/panganku_ifct_foods.csv','w',encoding='utf-8',newline='') as f:
    cols=sorted(set().union(*(r.keys() for r in records))) if records else []
    w=csv.DictWriter(f,fieldnames=cols);w.writeheader();w.writerows(records)
print(json.dumps({'records':len(records),'headers':headers},ensure_ascii=False))
