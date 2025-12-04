// Quick script to fix RAC boarding via API
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/fix-rac-boarding',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('\n✅ Response:');
        const result = JSON.parse(data);
        console.log(JSON.stringify(result, null, 2));

        if (result.success) {
            console.log(`\n🎉 SUCCESS! ${result.data.fixed} RAC passengers marked as boarded!`);
            console.log(`\n📊 Now: ${result.data.nowBoarded}/${result.data.racQueueTotal} RAC passengers are boarded`);
            console.log(`\n👉 Next step: Refresh the reallocation page in your browser!`);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Error:', error.message);
});

req.end();
