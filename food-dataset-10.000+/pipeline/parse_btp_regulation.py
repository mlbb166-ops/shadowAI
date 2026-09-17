import csv, json, os, re
from datetime import datetime, timezone
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
text_path=os.path.join(ROOT,'btp','perkabpom-11-2019-btp.txt')
out=os.path.join(ROOT,'processed_pipeline'); os.makedirs(out,exist_ok=True)
lines=open(text_path,encoding='utf-8').read().splitlines()
start=next(i for i,x in enumerate(lines) if 'LAMPIRAN I' in x)
end=next(i for i,x in enumerate(lines[start+1:],start+1) if 'LAMPIRAN II' in x)
category=''; pending=[]; records=[]; accessed=datetime.now(timezone.utc).isoformat()
cat_re=re.compile(r'^\s*\d+\.\s+([^()]+?)\s*\(([^)]+)\)\s*$')
ins_re=re.compile(r'(?P<ins>\d{3}(?:\s*\([ivx]+\))?)\s*$')
for raw in lines[start:end]:
    line=' '.join(raw.strip().split())
    if not line or line.startswith('No.') or line.startswith('Jenis BTP') or line.startswith('Nama BTP'): continue
    cat=cat_re.match(line)
    cat_number=int(re.match(r'^\s*(\d+)',line).group(1)) if re.match(r'^\s*(\d+)',line) else 999
    if cat and cat_number <= 27 and len(line)<100 and not cat.group(1).strip().isdigit():
        category=cat.group(1).strip(); pending=[]; continue
    m=ins_re.search(line)
    if m and 'TAHUN' not in line.upper() and 'NOMOR' not in line.upper():
        name=line[:m.start()].strip(' .:-')
        if pending: name=' '.join(pending+[name]).strip()
        name=re.sub(r'\s+',' ',name)
        if name and not name[0].isdigit() and len(name)>2:
            records.append({'record_id':'bpom-btp-'+str(len(records)+1),'dataset':'btp_regulation','btp_name_raw':name,'ins_number':m.group('ins').replace(' ',''),'functional_category':category,'bpom_regulation':'Peraturan BPOM Nomor 11 Tahun 2019 tentang Bahan Tambahan Pangan','source_url':'https://jdih.pom.go.id/download/rule/848/11/2019/Bahan%20Tambahan%20Pangan','accessed_at':accessed,'verification_status':'extracted from official BPOM regulation Annex I; review OCR/text segmentation before production use','confidence_level':'high'} )
        pending=[]
    elif re.match(r'^\d+\.',line):
        pending=[re.sub(r'^\d+\.\s*','',line)]
    elif not line.startswith(('Bahan Tambahan Pangan','Jenis BTP yang','JENIS BTP')):
        if pending: pending.append(line)
seen=set(); dedup=[]
for r in records:
    k=(r['btp_name_raw'],r['ins_number'],r['functional_category'])
    if k not in seen: seen.add(k); dedup.append(r)
records=dedup
for ext in ('jsonl','json','csv'):
    path=os.path.join(out,'btp_bpom_11_2019.'+ext)
    if ext=='jsonl': open(path,'w',encoding='utf-8').write(''.join(json.dumps(r,ensure_ascii=False)+'\n' for r in records))
    elif ext=='json': json.dump(records,open(path,'w',encoding='utf-8'),ensure_ascii=False,indent=2)
    else:
        cols=sorted(set().union(*(r.keys() for r in records))); w=csv.DictWriter(open(path,'w',encoding='utf-8',newline=''),fieldnames=cols); w.writeheader(); w.writerows(records)
print(json.dumps({'records':len(records),'output':out},ensure_ascii=False))
