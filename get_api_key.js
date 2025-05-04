const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_URL = 'https://apigw-eucentral2.central.arubanetworks.com/oauth2/token';
const ENV_PATH = path.join(__dirname, '.env');

let cachedToken = null;
let tokenExpiresAt = null;

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

function getRefreshToken() {
  return process.env.REFRESH_TOKEN;
}

function updateEnvRefreshToken(newToken) {
  const envFile = fs.readFileSync(ENV_PATH, 'utf-8');
  const updated = envFile.replace(/REFRESH_TOKEN=.*/g, `REFRESH_TOKEN=${newToken}`);
  fs.writeFileSync(ENV_PATH, updated, 'utf-8');
  console.log('[Auth] .env refresh token updated');
}

async function fetchNewAccessToken() {
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('client_id', CLIENT_ID);
  params.append('client_secret', CLIENT_SECRET);
  params.append('refresh_token', getRefreshToken());

  try {
    const response = await axios.post(TOKEN_URL, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, expires_in, refresh_token: newRefreshToken } = response.data;

    cachedToken = access_token;
    tokenExpiresAt = Date.now() + (expires_in - 60) * 1000;

    if (newRefreshToken && newRefreshToken !== getRefreshToken()) {
      updateEnvRefreshToken(newRefreshToken);
    }

    console.log('[Auth] Access token refreshed');
    return cachedToken;
  } catch (error) {
    console.error('[Auth] Failed to refresh access token:', error.response?.data || error.message);
    throw new Error('Unable to obtain access token');
  }
}

async function getAccessToken() {
  if (cachedToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }
  return await fetchNewAccessToken();
}

module.exports = { getAccessToken };
