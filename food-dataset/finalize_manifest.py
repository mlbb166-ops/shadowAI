import json, os
root='/home/ubuntu/food-dataset'
with open(root+'/manifest.json',encoding='utf-8') as f: m=json.load(f)
m['total_records_across_collections']=1646
m['collections']=[
 {'name':'panganku_ifct_foods','record_count':1146,'source':'https://www.panganku.org/en-EN/semua_nutrisi','format_files':['processed/panganku_ifct_foods.csv','processed/panganku_ifct_foods.jsonl','processed/panganku_ifct_foods.json'],'scope':'Official searchable table index from Indonesian Food Composition Table (IFCT).'},
 {'name':'indonesia_packaged_foods','record_count':500,'source':'https://world.openfoodfacts.org/api/v2/search','format_files':['processed/indonesia_packaged_foods.csv','processed/indonesia_packaged_foods.jsonl','processed/indonesia_packaged_foods.json'],'scope':'First successful pages of products returned with countries_tags_en=indonesia, sorted by unique_scans_n.'}
]
m['package_notes']='Combined snapshot contains 1,646 records from two sources. Raw files and parsers are included for auditability and reruns.'
with open(root+'/manifest.json','w',encoding='utf-8') as f: json.dump(m,f,ensure_ascii=False,indent=2)
print(json.dumps({'total_records':m['total_records_across_collections'],'collections':m['collections']},ensure_ascii=False))
