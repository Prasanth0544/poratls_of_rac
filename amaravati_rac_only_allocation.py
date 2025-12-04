# amaravati_rac_only_allocation.py
# SIMPLE RAC ALLOCATION: 100 RAC passengers (50 pairs) in sleeper side lower berths only
# Journey: Station 0 (Narasapur) to Station 18 (Pendekallu)
# Rest of train: EMPTY

import random
from pymongo import MongoClient

# ----------------------------
# DETERMINISTIC SEED
# ----------------------------
SEED = 20251204
random.seed(SEED)

# ----------------------------
# CONFIG
# ----------------------------
TRAIN_NUMBER = "17225"
TRAIN_NAME = "Amaravati Express"
JOURNEY_DATE = "15-11-2025"
SLEEPER_COACHES = 9
BOARDING_STATION_IDX = 0  # Narasapur
DEBOARDING_STATION_IDX = 18  # Pendekallu

# ----------------------------
# STATIONS
# ----------------------------
stations = [
    "Narasapur",           # 0
    "Palakollu",           # 1
    "Bhimavaram Jn",       # 2
    "Bhimavaram Town",     # 3
    "Akividu",             # 4
    "Kaikolur",            # 5
    "Gudivada Jn",         # 6
    "Vijayawada Jn",       # 7
    "Guntur Jn",           # 8
    "Narasaraopet",        # 9
    "Vinukonda",           # 10
    "Kurichedu",           # 11
    "Donakonda",           # 12
    "Markapur Road",       # 13
    "Cumbum",              # 14
    "Giddalur",            # 15
    "Nandyal",             # 16
    "Dhone Jn",            # 17
    "Pendekallu",          # 18
    "Guntakal Jn",         # 19
    "Bellary Jn",          # 20
    "Toranagallu Jn",      # 21
    "Hosapete Jn",         # 22
    "Munirabad",           # 23
    "Koppal",              # 24
    "Gadag Jn",            # 25
    "Annigeri",            # 26
    "Hubballi Jn"          # 27
]

print("="*80)
print("🚂 AMARAVATI EXPRESS - RAC ONLY ALLOCATION")
print("="*80)
print("Configuration:")
print(f"  Total RAC Passengers: 100 (50 pairs)")
print(f"  Berth Type: Side Lower (Sleeper Class Only)")
print(f"  Journey: Station {BOARDING_STATION_IDX} to Station {DEBOARDING_STATION_IDX}")
print(f"  Boarding: {stations[BOARDING_STATION_IDX]}")
print(f"  Deboarding: {stations[DEBOARDING_STATION_IDX]}")
print(f"  Rest of Train: EMPTY")
print("="*80 + "\n")

# ----------------------------
# BERTH CONFIGURATION
# ----------------------------
# Sleeper side lower berths per coach: 9 berths
sleeper_side_lower_berths = [7, 15, 23, 31, 39, 47, 55, 63, 71]

# Total side lower berths across all sleeper coaches
total_side_lower_berths = len(sleeper_side_lower_berths) * SLEEPER_COACHES

# We need 50 berths for 100 passengers (50 pairs)
required_berths = 50

print(f"📊 CAPACITY:")
print(f"  Sleeper Coaches: {SLEEPER_COACHES}")
print(f"  Side Lower Berths per Coach: {len(sleeper_side_lower_berths)}")
print(f"  Total Side Lower Berths Available: {total_side_lower_berths}")
print(f"  Required Berths for 100 RAC: {required_berths}")
print(f"  Status: {'✅ Sufficient' if total_side_lower_berths >= required_berths else '❌ Insufficient'}\n")

# ----------------------------
# COACH NAMES
# ----------------------------
sleeper_coaches = [f"S{i}" for i in range(1, SLEEPER_COACHES + 1)]

# ----------------------------
# NAME GENERATOR
# ----------------------------
first_male = ["Aarav","Aarush","Aayush","Aditya","Advik","Arjun","Arnav","Aryan","Atharv","Avi",
    "Darsh","Dhruv","Ishaan","Kabir","Kian","Krish","Krishna","Laksh","Manan","Mivaan",
    "Nirvaan","Pranav","Reyansh","Rudra","Sai","Shaurya","Shivansh","Tanay","Veer","Vihaan"]

first_female = ["Aadhya","Aanya","Aaradhya","Aditi","Ananya","Anika","Avni","Diya","Gauri","Ira",
    "Jiya","Kavya","Kiara","Mahika","Navya","Pari","Riya","Saisha","Tanya","Zara"]

middle = ["Kumar","Singh","Raj","Dev","Prasad","Prakash","Chandra","Mohan","Babu","Reddy",
    "Nath","Pal","Das","Lal","Rao","Naidu","Varma","Gupta","Verma","Patel"]

last = ["Sharma","Verma","Singh","Kumar","Patel","Reddy","Nair","Iyer","Rao","Das",
    "Gupta","Joshi","Agarwal","Pandey","Mishra","Tiwari","Chauhan","Yadav","Jain","Shah",
    "Mehta","Desai","Khan","Ali","Chopra","Kapoor","Bhatia","Malhotra","Khanna","Saxena"]

first_names = first_male + first_female
used_names = set()
used_mobiles = set()
used_emails = set()
used_pnrs = set()

def gen_name():
    for _ in range(5000):
        f = random.choice(first_names)
        m = random.choice(middle)
        l = random.choice(last)
        name = f"{f} {m} {l}" if random.random() < 0.7 else f"{f} {l}"
        if name not in used_names:
            used_names.add(name)
            return name
    name = f"Passenger {len(used_names)}"
    used_names.add(name)
    return name

def gen_mobile():
    for _ in range(5000):
        m = f"{random.choice('6789')}{random.randint(100000000,999999999)}"
        if m not in used_mobiles:
            used_mobiles.add(m)
            return m
    return f"9{1000000000+len(used_mobiles)}"

def gen_email(name):
    base = name.lower().replace(" ",".").replace("'","")
    for i in range(100):
        e = f"{base}{i}@gmail.com" if i else f"{base}@gmail.com"
        if e not in used_emails:
            used_emails.add(e)
            return e
    return f"{base}{len(used_emails)}@gmail.com"

def gen_pnr():
    p = str(1000000001 + len(used_pnrs))
    used_pnrs.add(p)
    return p

def gen_irctc_id(sequence_number):
    return f"IR_{sequence_number:04d}"

# ----------------------------
# ALLOCATE 100 RAC PASSENGERS (50 PAIRS)
# ----------------------------
print("🎫 ALLOCATING 100 RAC PASSENGERS (50 PAIRS)...")
print("="*80)

passengers = []
irctc_counter = 1
rac_number = 1
allocated_pairs = 0

# Allocate 50 pairs across sleeper coaches
for coach in sleeper_coaches:
    for berth in sleeper_side_lower_berths:
        if allocated_pairs >= 50:
            break
        
        # Create a RAC pair (2 passengers sharing 1 side lower berth)
        for passenger_in_pair in range(2):
            name = gen_name()
            age = random.randint(18, 65)
            gender = random.choice(["Male", "Female"])
            
            passenger = {
                "IRCTC_ID": gen_irctc_id(irctc_counter),
                "PNR_Number": gen_pnr(),
                "Train_Number": TRAIN_NUMBER,
                "Train_Name": TRAIN_NAME,
                "Journey_Date": JOURNEY_DATE,
                "Name": name,
                "Age": age,
                "Gender": gender,
                "Mobile": gen_mobile(),
                "Email": gen_email(name),
                "PNR_Status": "RAC",
                "Class": "Sleeper",
                "Rac_status": str(rac_number),
                "Boarding_Station": stations[BOARDING_STATION_IDX],
                "Deboarding_Station": stations[DEBOARDING_STATION_IDX],
                "Assigned_Coach": coach,
                "Assigned_berth": berth,
                "Berth_Type": "Side Lower",
                "Passenger_Status": "Offline",
                "NO_show": False
            }
            
            passengers.append(passenger)
            irctc_counter += 1
            rac_number += 1
        
        allocated_pairs += 1
        
        # Progress indicator
        if allocated_pairs % 10 == 0:
            print(f"  Progress: {allocated_pairs}/50 pairs allocated ({allocated_pairs * 2} passengers)")
    
    if allocated_pairs >= 50:
        break

print(f"\n✅ Successfully allocated {len(passengers)} RAC passengers in {allocated_pairs} pairs")

# ----------------------------
# ANALYSIS
# ----------------------------
print("\n" + "="*80)
print("📊 ALLOCATION SUMMARY")
print("="*80)

print(f"\n📈 PASSENGER STATISTICS:")
print(f"  Total Passengers: {len(passengers)}")
print(f"  RAC Passengers: {len(passengers)}")
print(f"  RAC Pairs: {allocated_pairs}")
print(f"  CNF Passengers: 0")
print(f"  Waitlist Passengers: 0")

print(f"\n🎫 JOURNEY DETAILS:")
print(f"  Boarding Station: {stations[BOARDING_STATION_IDX]} (Station {BOARDING_STATION_IDX})")
print(f"  Deboarding Station: {stations[DEBOARDING_STATION_IDX]} (Station {DEBOARDING_STATION_IDX})")
print(f"  Journey Length: {DEBOARDING_STATION_IDX - BOARDING_STATION_IDX} stations")

print(f"\n🛏️  BERTH ALLOCATION:")
print(f"  Berth Type: Side Lower (Sleeper Class)")
print(f"  Berths Used: {allocated_pairs}/{total_side_lower_berths}")
print(f"  Passengers per Berth: 2 (RAC sharing)")

# Coach-wise distribution
coach_distribution = {}
for p in passengers:
    coach = p["Assigned_Coach"]
    coach_distribution[coach] = coach_distribution.get(coach, 0) + 1

print(f"\n🚃 COACH-WISE DISTRIBUTION:")
for coach in sorted(coach_distribution.keys()):
    count = coach_distribution[coach]
    pairs = count // 2
    print(f"  {coach}: {count} passengers ({pairs} pairs)")

# Gender distribution
male_count = sum(1 for p in passengers if p["Gender"] == "Male")
female_count = sum(1 for p in passengers if p["Gender"] == "Female")

print(f"\n👥 GENDER DISTRIBUTION:")
print(f"  Male: {male_count} ({(male_count/len(passengers))*100:.1f}%)")
print(f"  Female: {female_count} ({(female_count/len(passengers))*100:.1f}%)")

# Age distribution
ages = [p["Age"] for p in passengers]
print(f"\n📊 AGE STATISTICS:")
print(f"  Average Age: {sum(ages)/len(ages):.1f} years")
print(f"  Min Age: {min(ages)} years")
print(f"  Max Age: {max(ages)} years")

# RAC status distribution
rac_statuses = [int(p["Rac_status"]) for p in passengers]
print(f"\n🎫 RAC STATUS RANGE:")
print(f"  From: RAC {min(rac_statuses)}")
print(f"  To: RAC {max(rac_statuses)}")

print("\n" + "="*80)

# ----------------------------
# EXPORT TO MONGODB
# ----------------------------
print("💾 EXPORTING TO MONGODB")
print("="*80)

try:
    client = MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=2000)
    db = client['PassengersDB']
    coll = db['L_3']
    
    # Clear existing data
    deleted_count = coll.delete_many({}).deleted_count
    print(f"🗑️  Cleared {deleted_count} existing documents from PassengersDB.L_3")
    
    # Insert new data
    result = coll.insert_many(passengers)
    print(f"✅ Successfully inserted {len(result.inserted_ids)} passengers into MongoDB")
    print(f"   Database: PassengersDB")
    print(f"   Collection: P_3")
    
    print(f"\n📝 Sample Document:")
    sample = passengers[0]
    print(f"   IRCTC_ID: {sample['IRCTC_ID']}")
    print(f"   PNR: {sample['PNR_Number']}")
    print(f"   Name: {sample['Name']}")
    print(f"   Status: {sample['PNR_Status']} (RAC {sample['Rac_status']})")
    print(f"   Coach: {sample['Assigned_Coach']}, Berth: {sample['Assigned_berth']} ({sample['Berth_Type']})")
    print(f"   Journey: {sample['Boarding_Station']} → {sample['Deboarding_Station']}")
    
except Exception as e:
    print(f"❌ MongoDB operation failed: {e}")
    print(f"   Make sure MongoDB is running on localhost:27017")

print("\n" + "="*80)
print("🎉 RAC ALLOCATION COMPLETED SUCCESSFULLY!")
print("="*80)
