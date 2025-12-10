// Helper script to find your local IP address for multi-user network setup
const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  console.log('\n🔍 Finding your local IP address...\n');
  
  for (const name of Object.keys(interfaces)) {
    const networkInterface = interfaces[name];
    if (!networkInterface) continue;
    
    for (const iface of networkInterface) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log('✅ Found local IP address:');
        console.log(`   ${iface.address}`);
        console.log(`\n📝 Update this in: app/frontend/src/config/api.ts`);
        console.log(`   Change LOCAL_IP to: "${iface.address}"\n`);
        return iface.address;
      }
    }
  }
  
  console.log('❌ Could not find local IP address');
  console.log('   Make sure you are connected to a network\n');
  return null;
}

getLocalIP();

