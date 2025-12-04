const { MongoClient } = require('mongodb');

async function checkMongoData() {
    const client = new MongoClient('mongodb://localhost:27017');

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB\n');

        const db = client.db('PassengersDB');
        const collection = db.collection('L_1');

        // 1. Total RAC passengers
        const totalRAC = await collection.countDocuments({ PNR_Status: "RAC" });
        console.log(`📊 Total RAC passengers: ${totalRAC}`);

        // 2. Online RAC passengers
        const onlineRAC = await collection.countDocuments({
            PNR_Status: "RAC",
            Passenger_Status: "Online"
        });
        console.log(`🌐 Online RAC passengers: ${onlineRAC}`);

        // 3. Boarded RAC passengers
        const boardedRAC = await collection.countDocuments({
            PNR_Status: "RAC",
            Boarded: true
        });
        console.log(`✈️  Boarded RAC passengers: ${boardedRAC}`);

        // 4. Gudivada passengers
        const gudivadaPassengers = await collection.countDocuments({
            Deboarding_Station: "Gudivada"
        });
        console.log(`🚉 Gudivada deboarding passengers: ${gudivadaPassengers}\n`);

        // 5. Sample RAC passenger
        const sampleRAC = await collection.findOne({ PNR_Status: "RAC" });
        console.log('📋 Sample RAC Passenger:');
        console.log(JSON.stringify({
            PNR_Number: sampleRAC.PNR_Number,
            Name: sampleRAC.Name,
            PNR_Status: sampleRAC.PNR_Status,
            Passenger_Status: sampleRAC.Passenger_Status,
            Boarded: sampleRAC.Boarded,
            Boarding_Station: sampleRAC.Boarding_Station,
            Deboarding_Station: sampleRAC.Deboarding_Station,
            Rac_status: sampleRAC.Rac_status
        }, null, 2));

        // 6. Passenger Status distribution
        console.log('\n📊 Passenger Status Distribution:');
        const statusDist = await collection.aggregate([
            { $match: { PNR_Status: "RAC" } },
            { $group: { _id: "$Passenger_Status", count: { $sum: 1 } } }
        ]).toArray();
        statusDist.forEach(item => {
            console.log(`   ${item._id || 'null'}: ${item.count}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.close();
    }
}

checkMongoData();
