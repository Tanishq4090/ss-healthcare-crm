import axios from 'axios';

async function testHealth() {
  try {
    const res1 = await axios.get('http://localhost:3001/health');
    console.log('/health:', res1.data);

    const res2 = await axios.get('http://localhost:3001/api/system/health');
    console.log('/api/system/health:', res2.data);

    const res3 = await axios.get('http://localhost:3001/api/callyzer/health');
    console.log('/api/callyzer/health:', res3.data);

    const res4 = await axios.get('http://localhost:3001/api/meta/health');
    console.log('/api/meta/health:', res4.data);
  } catch(e) {
    console.error("Health check failed. Ensure server is running.", e.message);
  }
}
testHealth();
