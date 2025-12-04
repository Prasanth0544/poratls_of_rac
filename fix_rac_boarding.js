// Force mark all RAC passengers as boarded in-memory
// Run this via backend API endpoint

const trainController = require('./backend/controllers/trainController');

async function fixRACBoarding() {
    try {
        const trainState = trainController.getGlobalTrainState();

        if (!trainState) {
            console.log('❌ Train not initialized');
            return;
        }

        let markedCount = 0;
        const currentIdx = trainState.currentStationIdx;

        console.log(`\n🔧 Fixing RAC Boarding Status...\n`);
        console.log(`Current Station: ${trainState.stations[currentIdx]?.name} (Index: ${currentIdx})\n`);

        // Mark all RAC passengers whose boarding station is before or at current station
        trainState.racQueue.forEach(rac => {
            if (rac.fromIdx <= currentIdx && !rac.boarded && !rac.noShow) {
                rac.boarded = true;
                console.log(`✅ Marked as boarded: ${rac.name} (PNR: ${rac.pnr}) - Boarded at ${rac.from}`);
                markedCount++;
            }
        });

        console.log(`\n📊 Summary:`);
        console.log(`  Total RAC Queue: ${trainState.racQueue.length}`);
        console.log(`  Marked as Boarded: ${markedCount}`);
        console.log(`\n✅ Fix complete! Now refresh the reallocation page.`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

fixRACBoarding();
