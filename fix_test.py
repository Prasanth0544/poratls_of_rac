import re

# Read test.py
with open('test.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Update PHASE 2 header and capacity calculation
old_phase2_start = r'''# ----------------------------
# PHASE 2: FILL TO 100% OCCUPANCY WITH REGULAR PASSENGERS
# ----------------------------
print\("\\nPHASE 2: Filling to 100% occupancy with regular passengers\.\.\."\)

# Calculate remaining capacity
current_passengers = len\(passengers\)
remaining_capacity = total_berths - current_passengers
print\(f"  Current passengers: \{current_passengers\}"\)
print\(f"  Total berths: \{total_berths\}"\)
print\(f"  Remaining capacity: \{remaining_capacity\} berths"\)
print\(f"  Locked berths \(non-reusable\): \{len\(allocator\.locked_berths\)\}"\)'''

new_phase2_start = '''# ----------------------------
# PHASE 2: FILL TO 100% OCCUPANCY (ALL PHYSICAL BERTHS)
# ----------------------------
print("\\nPHASE 2: Filling to 100% berth occupancy...")

# Calculate remaining capacity
# KEY FIX: RAC passengers share berths (150 passengers use 75 berths)
# We need to fill ALL 776 berths, not just allocate 776 passengers
# Current: 150 RAC (using 75 berths) + 150 CNF (using 150 berths) = 225 berths used
# Remaining berths to fill: 776 - 225 = 551 berths
current_passengers = len(passengers)
rac_passengers = sum(1 for p in passengers if p["PNR_Status"] == "RAC")
rac_berths_used = rac_passengers // 2  # RAC passengers share berths (2 per berth)
cnf_passengers = sum(1 for p in passengers if p["PNR_Status"] == "CNF")
berths_currently_used = rac_berths_used + cnf_passengers

remaining_berths_to_fill = total_berths - berths_currently_used
print(f"  Current passengers: {current_passengers}")
print(f"  RAC passengers: {rac_passengers} (using {rac_berths_used} berths)")
print(f"  CNF passengers: {cnf_passengers} (using {cnf_passengers} berths)")
print(f"  Berths currently used: {berths_currently_used}/{total_berths}")
print(f"  Remaining berths to fill: {remaining_berths_to_fill}")
print(f"  Locked berths (non-reusable): {len(allocator.locked_berths)}")'''

content = re.sub(old_phase2_start, new_phase2_start, content, flags=re.DOTALL)

# Fix 2: Update short/medium/long count calculation
content = re.sub(
    r'short_count = int\(remaining_capacity \* 0\.40\)',
    'short_count = int(remaining_berths_to_fill * 0.40)',
    content
)
content = re.sub(
    r'medium_count = int\(remaining_capacity \* 0\.35\)',
    'medium_count = int(remaining_berths_to_fill * 0.35)',
    content
)
content = re.sub(
    r'long_count = remaining_capacity - short_count - medium_count',
    'long_count = remaining_berths_to_fill - short_count - medium_count',
    content
)

# Fix 3: Update progress messages
content = re.sub(
    r'print\(f"  Progress: \{additional_allocated\}/\{remaining_capacity\}',
    'print(f"  Progress: {additional_allocated}/{remaining_berths_to_fill} berths',
    content
)

# Fix 4: Add final summary
old_summary = r'print\(f"\\n✅ Allocated \{additional_allocated\} additional passengers"\)'
new_summary = '''print(f"\\n✅ Allocated {additional_allocated} additional passengers")
print(f"📊 Final: {len(passengers)} total passengers occupying {berths_currently_used + additional_allocated} berths")'''
content = re.sub(old_summary, new_summary, content)

# Fix 5: Update "capacity reached" message
content = re.sub(
    r'print\(f"⚠️  Could not allocate \{failed_allocations\} passengers \(capacity reached\)"\)',
    'print(f"⚠️  Could not allocate {failed_allocations} passengers (all berths occupied)")',
    content
)

# Fix 6: Update analysis section
old_analysis = r'''peak = max\(onboard\)
peak_idx = onboard\.index\(peak\)
print\(f"\\n  Peak Occupancy: \{peak\} passengers at \{stations\[peak_idx\]\[0\]\}"\)
print\(f"  Optimal Total Count: \{total_passengers\}"\)
print\(f"  Initial Occupancy \(stations 0-2\): \{onboard\[0\]\}/\{total_berths\} \(\{\(onboard\[0\]/total_berths\)\*100:.1f\}%\)"\)
print\(f"  Capacity Utilization: \{\(total_passengers/total_berths\)\*100:.1f\}%"\)'''

new_analysis = '''peak = max(onboard)
peak_idx = onboard.index(peak)

# Calculate actual berth occupancy
final_rac = sum(1 for p in passengers if p["PNR_Status"] == "RAC")
final_cnf = sum(1 for p in passengers if p["PNR_Status"] == "CNF")
final_berths_occupied = (final_rac // 2) + final_cnf

print(f"\\n  Peak Occupancy: {peak} passengers at {stations[peak_idx][0]}")
print(f"  Optimal Total Passengers: {total_passengers}")
print(f"  Total Berths Occupied: {final_berths_occupied}/{total_berths} ({(final_berths_occupied/total_berths)*100:.1f}%)")
print(f"  Initial Occupancy (stations 0-2): {onboard[0]} passengers")
print(f"  Passenger Capacity Utilization: {(total_passengers/total_berths)*100:.1f}%")
print(f"  Berth Capacity Utilization: {(final_berths_occupied/total_berths)*100:.1f}%")'''

content = re.sub(old_analysis, new_analysis, content, flags=re.DOTALL)

# Write back
with open('test.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixed test.py - now fills ALL 776 berths for true 100% occupancy")
print("   RAC passengers share 75 berths, so we add 551 more CNF passengers")
print("   This will give 851 total passengers occupying 776 berths")
