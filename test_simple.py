import random
from pymongo import MongoClient
from collections import defaultdict

# ----------------------------
# CONFIGURATION
# ----------------------------
TRAIN_NUMBER = "17225"
TRAIN_NAME = "Amaravathi Express"
JOURNEY_DATE = "2025-11-15"

# Simple coach structure - Only sleeper coaches
SLEEPER_COACHES = 11
AC_COACHES = 3

# ----------------------------
# STATIONS (Same as original)
# ----------------------------
stations = [
    ("Narasapur", 0, 0),           # 0
    ("Palakollu", 0, 0),           # 1
    ("Bhimavaram Jn", 0, 0),       # 2
    ("Bhimavaram Town", 0, 0),     # 3
    ("Akividu", 0, 0),             # 4
    ("Kaikolur", 0, 0),            # 5
    ("Gudivada Jn", 0, 0),         # 6
    ("Vijayawada Jn", 0, 0),       # 7
    ("Guntur Jn", 0, 0),           # 8
    ("Narasaraopet", 0, 0),        # 9
    ("Vinukonda", 0, 0),           # 10
    ("Kurichedu", 0, 0),           # 11
    ("Donakonda", 0, 0),           # 12
    ("Markapur Road", 0, 0),       # 13
    ("Cumbum", 0, 0),              # 14
    ("Giddalur", 0, 0),            # 15
    ("Nandyal", 0, 0),             # 16
    ("Dhone Jn", 0, 0),            # 17
    ("Pendekallu", 0, 0),          # 18
    ("Guntakal Jn", 0, 0),         # 19
    ("Bellary Jn", 0, 0),          # 20
    ("Toranagallu Jn", 0, 0),      # 21
    ("Hosapete Jn", 0, 0),         # 22
    ("Munirabad", 0, 0),           # 23
    ("Koppal", 0, 0),              # 24
    ("Gadag Jn", 0, 0),            # 25
    ("Annigeri", 0, 0),            # 26
    ("Hubballi Jn", 0, 0)          # 27
]
NUM_STATIONS = len(stations)

# ----------------------------
# BERTH MAPS
# ----------------------------
sleeper_berths = {
    "Lower": [1,4,9,12,17,20,25,28,33,36,41,44,49,52,57,60,65,68],
    "Middle": [2,5,10,13,18,21,26,29,34,37,42,45,50,53,58,61,66,69],
    "Upper": [3,6,11,14,19,22,27,30,35,38,43,46,51,54,59,62,67,70],
    "Side Lower": [7,15,23,31,39,47,55,63,71],
    "Side Upper": [8,16,24,32,40,48,56,64,72]
}
ac_berths = {
    "Lower": [1,4,9,12,17,20,25,28,33,36,41,44,49,52,57,60],
    "Middle": [2,5,10,13,18,21,26,29,34,37,42,45,50,53,58,61],
    "Upper": [3,6,11,14,19,22,27,30,35,38,43,46,51,54,59,62],
    "Side Lower": [7,15,23,31,39,47,55,63],
    "Side Upper": [8,16,24,32,40,48,56,64]
}

# Calculate total berth capacity
total_sleeper_berths = sum(len(v) for v in sleeper_berths.values()) * SLEEPER_COACHES
total_ac_berths = sum(len(v) for v in ac_berths.values()) * AC_COACHES
total_berths = total_sleeper_berths + total_ac_berths

# COACH NAMES
s_coaches = [f"S{i}" for i in range(1, SLEEPER_COACHES + 1)]
a_coaches = [f"B{i}" for i in range(1, AC_COACHES + 1)]

print(f"📊 CAPACITY:")
print(f"  Total Berths: {total_berths}")
print(f"  Sleeper: {total_sleeper_berths}, AC_3_Tier: {total_ac_berths}")
print(f"  Coaches: {', '.join(s_coaches + a_coaches)}\n")

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
# SIMPLE ALLOCATION: 100 RAC PASSENGERS ONLY
# ----------------------------
print("=" * 80)
print("🎯 SIMPLE RAC ALLOCATION: 100 RAC Passengers (50 pairs)")
print("=" * 80)
print("Configuration:")
print("  - Only Sleeper Class coaches")
print("  - Only Side Lower berths used")
print("  - All journeys: Station 1 (Narasapur) → Station 18 (Pendekallu)")
print("  - All other berths empty")
print("=" * 80 + "\n")

passengers = []
irctc_counter = 1
rac_global_counter = 1

# We need 50 side lower berths for 100 RAC passengers (2 per berth)
# Sleeper coaches have 9 side lower berths each
# 11 sleeper coaches × 9 side lower berths = 99 side lower berths
# We'll use the first 50 side lower berths

side_lower_berths = sleeper_berths["Side Lower"]  # [7,15,23,31,39,47,55,63,71]
berths_needed = 50
berths_allocated = 0

# Boarding and deboarding stations (indices)
board_idx = 0   # Station 1: Narasapur
deboard_idx = 18  # Station 18: Pendekallu

print(f"Allocating RAC pairs to side lower berths...")

# Allocate 100 RAC passengers as 50 pairs
for coach in s_coaches:
    if berths_allocated >= berths_needed:
        break
    
    for berth in side_lower_berths:
        if berths_allocated >= berths_needed:
            break
        
        # Create RAC pair (2 passengers sharing this berth)
        for i in range(2):
            name = gen_name()
            passengers.append({
                "IRCTC_ID": gen_irctc_id(irctc_counter),
                "PNR_Number": gen_pnr(),
                "Train_Number": TRAIN_NUMBER,
                "Train_Name": TRAIN_NAME,
                "Journey_Date": JOURNEY_DATE,
                "Name": name,
                "Age": random.randint(18, 77),
                "Gender": random.choice(["Male", "Female"]),
                "Mobile": gen_mobile(),
                "Email": gen_email(name),
                "PNR_Status": "RAC",
                "Class": "Sleeper",
                "Rac_status": str(rac_global_counter + i),
                "Boarding_Station": stations[board_idx][0],
                "Deboarding_Station": stations[deboard_idx][0],
                "Assigned_Coach": coach,
                "Assigned_berth": berth,
                "Berth_Type": "Side Lower",
                "Passenger_Status": "Online" if berths_allocated < 5 else "Offline",  # First 10 passengers online
                "NO_show": False
            })
            irctc_counter += 1
        
        rac_global_counter += 2
        berths_allocated += 1
        
        # Progress indicator
        if berths_allocated % 10 == 0:
            print(f"  Allocated {berths_allocated * 2}/100 RAC passengers ({berths_allocated} berths)")

print(f"\n✅ Successfully allocated 100 RAC passengers across {berths_allocated} side lower berths")

# ----------------------------
# STATISTICS
# ----------------------------
print("\n" + "="*80)
print("📊 FINAL STATISTICS")
print("="*80)

total_passengers = len(passengers)
rac_count = sum(1 for p in passengers if p["PNR_Status"] == "RAC")
online_count = sum(1 for p in passengers if p["Passenger_Status"] == "Online")
offline_count = sum(1 for p in passengers if p["Passenger_Status"] == "Offline")

print(f"\n📈 PASSENGER BREAKDOWN:")
print(f"  Total Passengers: {total_passengers}")
print(f"  RAC Passengers: {rac_count} ({rac_count // 2} pairs)")
print(f"  Online: {online_count}")
print(f"  Offline: {offline_count}")

print(f"\n🛏️  BERTH USAGE:")
print(f"  Total Berths Available: {total_berths}")
print(f"  Berths Used: {berths_allocated} (all Side Lower in Sleeper)")
print(f"  Berths Empty: {total_berths - berths_allocated}")
print(f"  Occupancy: {(berths_allocated / total_berths) * 100:.2f}%")

print(f"\n🚂 JOURNEY DETAILS:")
print(f"  All passengers: {stations[board_idx][0]} → {stations[deboard_idx][0]}")
print(f"  Journey length: {deboard_idx - board_idx} stations")

# Coach distribution
coach_distribution = defaultdict(int)
for p in passengers:
    coach_distribution[p["Assigned_Coach"]] += 1

print(f"\n🚃 COACH DISTRIBUTION:")
for coach in sorted(coach_distribution.keys()):
    count = coach_distribution[coach]
    print(f"  {coach}: {count} passengers ({count // 2} pairs)")

print("="*80)

# ----------------------------
# EXPORT TO MONGODB
# ----------------------------
print("\n" + "="*80)
print("💾 INSERTING DATA INTO MONGODB")
print("="*80)

try:
    client = MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=2000)
    db = client['PassengersDB']
    coll = db['L_3']
    
    # Clear existing data
    deleted_count = coll.delete_many({}).deleted_count
    print(f"🗑️  Cleared {deleted_count} existing documents from PassengersDB.L_2")
    
    # Insert new data
    result = coll.insert_many(passengers)
    print(f"✅ Successfully inserted {len(result.inserted_ids)} passengers into MongoDB")
    print(f"   Database: PassengersDB")
    print(f"   Collection: L_2")
    
except Exception as e:
    print(f"❌ MongoDB operation failed: {e}")
    print(f"   Make sure MongoDB is running on localhost:27017")

print("\n🎉 Simple RAC allocation completed!")
print(f"📝 Generated {total_passengers} RAC passengers on {berths_allocated} side lower berths")
print(f"🎯 All seats except these {berths_allocated} berths are EMPTY")
