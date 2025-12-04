import re

# Read the current test.py file
with open('test.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove csv and json imports
content = re.sub(r'^import csv\r?\n', '', content, flags=re.MULTILINE)
content = re.sub(r'^import json\r?\n', '', content, flags=re.MULTILINE)

# Replace the export section
old_export = r'''# ----------------------------
# EXPORT
# ----------------------------
csv_file = "amaravati_optimized_allocation.csv"
json_file = "amaravati_optimized_allocation.json"

with open\(csv_file, "w", newline='', encoding='utf-8'\) as f:
    writer = csv.DictWriter\(f, fieldnames=passengers\[0\]\.keys\(\)\)
    writer\.writeheader\(\)
    writer\.writerows\(passengers\)
print\(f"\\n✅ Exported: {csv_file}"\)

with open\(json_file, "w", encoding='utf-8'\) as f:
    json\.dump\(passengers, f, indent=2, ensure_ascii=False\)
print\(f"✅ Exported: {json_file}"\)

try:
    client = MongoClient\('mongodb://localhost:27017/', serverSelectionTimeoutMS=2000\)
    db = client\['PassengersDB'\]
    coll = db\['L_1'\]
    coll\.delete_many\({}\)
    coll\.insert_many\(passengers\)
    print\(f"✅ MongoDB: PassengersDB\.L_1"\)
except Exception as e:
    print\(f"⚠️ MongoDB skipped: {e}"\)

print\("\\n🎉 Optimized allocation completed!"\)'''

new_export = '''# ----------------------------
# EXPORT TO MONGODB
# ----------------------------
print("\\n" + "="*80)
print("💾 INSERTING DATA INTO MONGODB")
print("="*80)

try:
    client = MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=2000)
    db = client['PassengersDB']
    coll = db['L_1']
    
    # Clear existing data
    deleted_count = coll.delete_many({}).deleted_count
    print(f"🗑️  Cleared {deleted_count} existing documents from PassengersDB.L_1")
    
    # Insert new data
    result = coll.insert_many(passengers)
    print(f"✅ Successfully inserted {len(result.inserted_ids)} passengers into MongoDB")
    print(f"   Database: PassengersDB")
    print(f"   Collection: L_1")
    
except Exception as e:
    print(f"❌ MongoDB operation failed: {e}")
    print(f"   Make sure MongoDB is running on localhost:27017")

print("\\n🎉 Optimized allocation completed!")'''

content = re.sub(old_export, new_export, content, flags=re.DOTALL)

# Write the modified content
with open('test.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Successfully removed CSV/JSON exports from test.py")
