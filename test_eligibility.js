// Test the eligibility API with correct endpoint
const API_BASE = 'http://localhost:5000/api';
if (matrix.length > 0) {
    console.log(`\n🎯 First Match:`, JSON.stringify(matrix[0], null, 2));
} else {
    console.log(`\n⚠️  NO ELIGIBLE MATCHES!`);
}
        } else {
    console.log(`❌ Failed:`, data.message || data.error);
}
    } catch (error) {
    console.error('❌ Error:', error.message);
}
}

testAPI();
