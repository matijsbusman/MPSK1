// debug-auth.js
const { getAccessToken } = require('./auth.js');

(async () => {
  try {
    const token = await getAccessToken();
    console.log('\n✅ Access token retrieved:\n', token);
  } catch (err) {
    console.error('\n❌ Failed to get token:', err.response?.data || err.message);
  }
})();
