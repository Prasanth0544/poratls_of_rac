const db = require('./backend/config/db');

async function checkData() {
    try {
        await db.connect();
        const collection = db.getPassengersCollection();

        console.log('\n========== MONGODB DATA CHECK ==========\n');

        // 1. Total RAC
        const totalRAC = await collection.countDocuments({ PNR_Status: "RAC" });
        console.log(`📊 Total RAC passengers: ${totalRAC}`);

        // 2. Online RAC
        const onlineRAC = await collection.countDocuments({
            PNR_Status: "RAC",
            Passenger_Status: "Online"
        });
        console.log(`🌐 Online RAC passengers: ${onlineRAC}`);

        // 3. Boarded RAC
        const boardedRAC = await collection.countDocuments({
            PNR_Status: "RAC",
            Boarded: true
        });
        console.log(`✈️  Boarded RAC passengers: ${boardedRAC}`);

        // 4. Sample RAC
        const sample = await collection.findOne({ PNR_Status: "RAC" });
        console.log('\n📋 Sample RAC Passenger:');
        console.log(`   PNR: ${sample.PNR_Number}`);
        console.log(`   Name: ${sample.Name}`);
        console.log(`   Passenger_Status: ${sample.Passenger_Status}`);
        console.log(`   Boarded: ${sample.Boarded}`);
        console.log(`   From: ${sample.Boarding_Station}`);
        console.log(`   To: ${sample.Deboarding_Station}`);
        console.log(`   RAC: ${sample.Rac_status}`);

        console.log('\n========================================\n');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkData();
