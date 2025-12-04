// Test the eligibility API directly
const API_BASE = 'http://localhost:5000/api';

async function testEligibilityAPI() {
    console.log('🔍 Testing Eligibility API...\n');

    try {
        // 1. Get train state
        console.log('1️⃣ Getting train state...');
        const stateRes = await fetch(`${API_BASE}/train/state`);
        const stateData = await stateRes.json();

        if (stateData.success) {
            console.log(`   ✅ Train: ${stateData.data.trainName}`);
            console.log(`   ✅ Current Station: ${stateData.data.stations[stateData.data.currentStationIdx]?.name}`);
            console.log(`   ✅ RAC Queue Length: ${stateData.data.racQueue?.length || 0}`);
            if (matrix.length > 0) {
                console.log(`\n   📋 First eligible match:`);
                console.log(JSON.stringify(matrix[0], null, 2));
            } else {
                console.log(`\n   ⚠️  No eligible matches found!`);
            }
        } else {
            console.log(`   ❌ Failed to get matrix`);
            console.log(`   Error:`, matrixData.message || matrixData.error);
        }

        // 3. Get vacant berths
        console.log('\n3️⃣ Getting vacant berths...');
        const vacantRes = await fetch(`${API_BASE}/train/vacant-berths`);
        const vacantData = await vacantRes.json();

        if (vacantData.success) {
            console.log(`   ✅ Vacant Berths: ${vacantData.data?.vacancies?.length || 0}`);
        }

        // 4. Get RAC queue
        console.log('\n4️⃣ Getting RAC queue...');
        const racRes = await fetch(`${API_BASE}/train/rac-queue`);
        const racData = await racRes.json();

        if (racData.success) {
            console.log(`   ✅ RAC Queue: ${racData.data?.queue?.length || 0}`);
            if (racData.data?.queue?.length > 0) {
                const rac = racData.data.queue[0];
                console.log(`\n   📋 First RAC passenger:`);
                console.log(`   PNR: ${rac.pnr}`);
                console.log(`   Name: ${rac.name}`);
                console.log(`   Boarded: ${rac.boarded}`);
                console.log(`   Status: ${rac.passengerStatus || rac.Passenger_Status}`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testEligibilityAPI();
