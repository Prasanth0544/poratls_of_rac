/**
 * Fix MongoDB data for RAC reallocation testing
 * Sets first 10 RAC passengers as Online and all RAC as Boarded
 */

const { MongoClient } = require('mongodb');

async function fixMongoData() {
    const uri = 'mongodb://localhost:27017';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db('PassengersDB');
        const collection = db.collection('L_1');

        // 1. Set first 10 RAC passengers as Online
        console.log('\n📝 Setting first 10 RAC passengers as Online...');
        const result1 = await collection.updateMany(
            {
                PNR_Status: "RAC",
                Rac_status: { $in: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] }
            },
            {
                $set: { Passenger_Status: "Online" }
            }
        );
        console.log(`   Updated: ${result1.modifiedCount} passengers`);

        // 2. Set all RAC passengers as Boarded = true
        console.log('\n✈️  Setting all RAC passengers as Boarded...');
        const result2 = await collection.updateMany(
            {
                PNR_Status: "RAC"
            },
            {
                $set: { Boarded: true }
            }
        );
        console.log(`   Updated: ${result2.modifiedCount} passengers`);

        // 3. Verify changes
        console.log('\n📊 Verification:');
        const onlineCount = await collection.countDocuments({
            PNR_Status: "RAC",
            Passenger_Status: "Online"
        });
        const boardedCount = await collection.countDocuments({
            PNR_Status: "RAC",
            Boarded: true
        });
        console.log(`   Online RAC: ${onlineCount}`);
        console.log(`   Boarded RAC: ${boardedCount}`);

        console.log('\n✅ MongoDB data fixed!');
        console.log('\n🔄 Now refresh the reallocation page in your browser');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.close();
    }
}

fixMongoData();
