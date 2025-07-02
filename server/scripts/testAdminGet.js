import fetch from 'node-fetch';

const testAdminGet = async () => {
  try {
    console.log('Testing /api/admin/test endpoint...');
    
    const response = await fetch('http://localhost:5000/api/admin/test');
    
    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    
    // Try to get the response text instead of parsing as JSON
    const textResponse = await response.text();
    console.log('Raw response text:', textResponse);
    
    // Only try to parse as JSON if it looks like JSON
    if (textResponse && (textResponse.startsWith('{') || textResponse.startsWith('['))) {
      try {
        const jsonData = JSON.parse(textResponse);
        console.log('Parsed JSON data:', jsonData);
      } catch (e) {
        console.error('Failed to parse JSON:', e.message);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Run the test
console.log('Starting test...');
testAdminGet().catch(e => {
  console.error('Unhandled error:', e);
}).finally(() => {
  console.log('Test completed, exiting.');
  process.exit(0);
}); 