const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const morgan = require('morgan');
const { getAccessToken } = require('./get_api_key.js');
const { logEvent } = require('./logger');  // Importing the log function from logger.js
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { exec } = require('child_process');

dotenv.config();
const MPSK_GROUP = process.env.MPSK_GROUP;
const app = express();
const PORT_HTTPS = 443;
const PORT_HTTP = 80;
const certPath = './server.cert';
const keyPath = './server.key';

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan('dev'));

function startHttpsServer() {
  const sslOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };

  https.createServer(sslOptions, app).listen(PORT_HTTPS, () => {
    console.log(`✅ HTTPS server running at https://localhost:${PORT_HTTPS}`);
  });
}

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  startHttpsServer();
} else {
  // Serve UI to generate certificate
  app.use(express.urlencoded({ extended: true }));

  app.get('/', (req, res) => {
    res.send(`
      <html>
        <head><title>SSL Setup</title></head>
        <body style="font-family:sans-serif;text-align:center;margin-top:40px;">
          <h2>🔒 SSL Certificate Not Found</h2>
          <p>Click the button below to generate a self-signed certificate using OpenSSL.</p>
          <form method="POST" action="/generate-cert">
            <button type="submit" style="padding:10px 20px;font-size:16px;">Generate Certificate</button>
          </form>
        </body>
      </html>
    `);
  });

  app.post('/generate-cert', (req, res) => {
    if (!fs.existsSync('certs')) fs.mkdirSync('certs');

    const cmd = `openssl req -x509 -newkey rsa:2048 -nodes -keyout ${keyPath} -out ${certPath} -days 365 -subj "/CN=localhost"`;

    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        return res.send(`<p>Error generating certificate: <pre>${stderr}</pre></p>`);
      }
      res.send(`
        <p>✅ Certificate generated! Restarting server in HTTPS mode...</p>
        <script>setTimeout(() => window.location.reload(), 3000);</script>
      `);

      // Delay and restart in HTTPS mode
      setTimeout(() => {
        process.exit(0); // On restart use a process manager like nodemon or PM2
      }, 2000);
    });
  });

  http.createServer(app).listen(PORT_HTTP, () => {
    console.log(`🌐 HTTP server for cert setup running at http://localhost:${PORT_HTTP}`);
  });
}

app.get('/', async (req, res) => {
  try {
        // Get the filter value from the query parameter
    const nameFilter = req.query.name || '';

    // Construct the URL for the API call with the filter
    const apiUrl = `https://apigw-eucentral2.central.arubanetworks.com/cloudAuth/api/v2/mpsk/${MPSK_GROUP}/namedMPSK?name=${encodeURIComponent(nameFilter)}&limit=50`;

    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${await getAccessToken()}`
      }
    });

    const items = response.data?.items || [];

    const rows = items.map(item => {
      const isEnabled = item.status === 'enabled';
      const toggleLabel = isEnabled ? 'Disable' : 'Enable';
      const toggleTo = isEnabled ? 'disabled' : 'enabled';
      const toggleColor = isEnabled ? 'background-color:red;color:white;' : 'background-color:green;color:white;';
      const roleOptions = ['test', 'client-daytime-only', 'client-always-on'].map(role =>
        `<option value="${role}"${item.role === role ? ' selected' : ''}>${role}</option>`).join('');

      return `
        <tr>
          <td>
            <div class="print-area" id="print-${item.id}">
              ${item.name}
            </div>
          </td>
          <td>
            <button onclick="togglePass('${item.id}')" style="padding:4px 8px;">Show</button>
            <div id="pass-${item.id}" style="display:none;margin-top:5px;">${item.mpsk}</div>
          </td>
          <td style="color:${isEnabled ? 'green' : 'red'}">${item.status}</td>
          <td>
            <form method="POST" action="/reset-key" style="display:inline;margin-right:10px;" onsubmit="return confirmReset();">
              <input type="hidden" name="mpsk_id" value="${item.id}" />
              <input type="hidden" name="group" value="${MPSK_GROUP}" />
              <input type="hidden" name="name" value="${item.name}" />
              <button type="submit" style="background-color:orange;color:white;border:none;padding:4px 8px;border-radius:5px;font-size:0.85em;">
                Reset
              </button>
            </form>
            <form method="POST" action="/toggle-key" style="display:inline;">
              <input type="hidden" name="mpsk_id" value="${item.id}" />
              <input type="hidden" name="group" value="${MPSK_GROUP}" />
              <input type="hidden" name="name" value="${item.name}" />
              <input type="hidden" name="status" value="${toggleTo}" />
              <button type="submit" style="${toggleColor} border:none;padding:4px 10px;border-radius:5px;font-size:0.85em;">
                ${toggleLabel}
              </button>
            </form>
            <form method="POST" action="/update-role" style="display:inline;margin-left:10px;">
              <input type="hidden" name="mpsk_id" value="${item.id}" />
              <input type="hidden" name="group" value="${MPSK_GROUP}" />
              <input type="hidden" name="name" value="${item.name}" />
              <select name="role" onchange="this.form.submit()" style="padding:4px 8px;border-radius:5px;">
                ${roleOptions}
              </select>
            </form>
          </td>
        </tr>
      `;
    }).join('');

    res.send(`
<html>
  <head>
    <title>Aruba mPSK Key List</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #f4f6f8;
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
      }

      .container {
        width: 100%;
        max-width: 1000px;
        background-color: #ffffff;
        padding: 30px;
        margin: 40px 20px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      }

      h2 {
        text-align: center;
        color: #2c3e50;
        font-size: 2rem;
        margin-bottom: 25px;
      }

      form {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }

      input[type="text"] {
        padding: 10px 15px;
        border: 1px solid #ccc;
        border-radius: 6px;
        font-size: 1rem;
        width: 250px;
      }

      button[type="submit"] {
        padding: 10px 20px;
        background-color: #007bff;
        color: white;
        font-size: 1rem;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: background-color 0.3s;
      }

      button[type="submit"]:hover {
        background-color: #0056b3;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
      }

      th, td {
        padding: 14px;
        border-bottom: 1px solid #e0e0e0;
        text-align: center;
      }

      th {
        background-color: #007bff;
        color: white;
        font-weight: 600;
      }

      tr:nth-child(even) {
        background-color: #f9f9f9;
      }

      tr:hover {
        background-color: #eef2f5;
      }

      .action-button {
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 0.9rem;
        margin: 2px;
        cursor: pointer;
        border: none;
        color: white;
      }

      .reset-button {
        background-color: #f39c12;
      }

      .enable-button {
        background-color: #28a745;
      }

      .disable-button {
        background-color: #dc3545;
      }

      @media (max-width: 600px) {
        table, thead, tbody, th, td, tr {
          display: block;
          width: 100%;
        }

        thead {
          display: none;
        }

        tr {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
          margin-bottom: 15px;
          padding: 10px;
        }

        td {
          text-align: right;
          padding: 10px;
          position: relative;
        }

        td::before {
          content: attr(data-label);
          position: absolute;
          left: 10px;
          font-weight: bold;
          text-align: left;
        }
      }
    </style>
    <script>
      function confirmReset() {
        return confirm('Are you sure you want to reset this key? This action cannot be undone.');
      }

      function togglePass(id) {
        const passDiv = document.getElementById('pass-' + id);
        const button = event.target;

        passDiv.style.display = 'block';     // show password
        button.style.display = 'none';       // hide the Show button
      }

      function filterByDomain() {
        const input = document.getElementById('domainFilter').value.toLowerCase();
        const rows = document.querySelectorAll('tbody tr');
        rows.forEach(row => {
          const domain = row.getAttribute('data-domain')?.toLowerCase() || '';
          row.style.display = domain.includes(input) ? '' : 'none';
        });
      }
    </script>
  </head>
  <body>
    <div class="container">
      <h2>mPSK Key List</h2>

      <form method="GET" action="/">
        <input type="text" name="name" id="domainFilter" oninput="filterByDomain()" placeholder="Filter by domain (e.g., company.com)" value="${nameFilter}" />
        <button type="submit">Filter</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Passphrase</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <p style="text-align:center; margin-top: 15px; font-weight: bold; color: #007bff;">${req.query.result || ''}</p>
         <footer>
         <p><strong>Disclaimer:</strong> This tool is for managing Aruba mPSK keys. Ensure that all security policies and protocols are followed. The developer is not responsible for any misuse.</p>
         <p>Developed by <a href="https://github.com/matijsbusman" target="_blank">Matijs Busman</a></p>
         </footer>
      </div>
  </body>
</html>

    `);
  } catch (error) {
    res.status(500).send('❌ Error fetching mPSKs: ' + (error.response?.data?.message || error.message));
  }
});


app.post('/toggle-key', async (req, res) => {
  const { mpsk_id, group, name, status } = req.body;
  if (!mpsk_id || !group || !name || !status) {
    return res.redirect('/?result=❌ Missing fields for toggle');
  }
  const url = `https://apigw-eucentral2.central.arubanetworks.com/cloudAuth/api/v2/mpsk/${group}/namedMPSK/${mpsk_id}?resetMPSK=false`;
  try {
    console.log(`[API CALL] PATCH ${url} (toggle status to ${status})`);
    await axios.patch(url, { name, status }, {
      headers: {
        Authorization: `Bearer ${await getAccessToken()}`,
        'Content-Type': 'application/json'
      }
    });

    // Log the event after successful action
    logEvent('Toggle mPSK Key', 'Success', { mpsk_id, name, status });

    res.redirect(`/?result=✅ Key ${status === 'enabled' ? 'enabled' : 'disabled'}`);
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    console.error('[API ERROR] Toggle failed:', message);
    
    // Log the error event
    logEvent('Toggle mPSK Key', 'Failed', { mpsk_id, group, status, error: message });

    res.redirect('/?result=❌ Toggle error: ' + message);
  }
});

app.post('/reset-key', async (req, res) => {
  const { mpsk_id, group, name } = req.body;
  if (!mpsk_id || !group || !name) {
    return res.redirect('/?result=❌ Missing fields for reset');
  }
  const url = `https://apigw-eucentral2.central.arubanetworks.com/cloudAuth/api/v2/mpsk/${group}/namedMPSK/${mpsk_id}?resetMPSK=true`;
  try {
    console.log(`[API CALL] PATCH ${url} (reset mPSK)`);
    await axios.patch(url, { name }, {
      headers: {
        Authorization: `Bearer ${await getAccessToken()}`,
        'Content-Type': 'application/json'
      }
    });
    res.redirect('/?result=✅ Key reset');
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    console.error('[API ERROR] Reset failed:', message);
    res.redirect('/?result=❌ Reset error: ' + message);
  }
});

app.post('/update-role', async (req, res) => {
  const { mpsk_id, group, name, role ,status } = req.body;

  console.log('[DEBUG] Incoming update-role request body:', req.body);

  if (!mpsk_id || !group || !name || !role) {
    console.warn('[WARN] Missing required fields in update-role');
    return res.redirect('/?result=❌ Missing fields for role update');
  }

  const url = `https://apigw-eucentral2.central.arubanetworks.com/cloudAuth/api/v2/mpsk/${group}/namedMPSK/${mpsk_id}?resetMPSK=false`;

  try {
    console.log(`[API CALL] PATCH ${url}`);
    console.log(`[API PAYLOAD]`, { name, role, status: "enabled" });

    const response = await axios.patch(url, { name, role, status: "enabled" }, {
      headers: {
        Authorization: `Bearer ${await getAccessToken()}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('[API RESP] Role updated:', response.status, response.statusText);
    res.redirect('/?result=' + encodeURIComponent(`✅ Role updated to "${role}"`));
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    const status = error.response?.status || 'unknown';

    console.error('[API ERROR] Role update failed');
    console.error('Status:', status);
    console.error('Message:', message);
    res.redirect('/?result=❌ Role update error: ' + message);
  }

});
app.get('/logs', (req, res) => {
  const logPath = path.join(__dirname, 'events.log');

  fs.readFile(logPath, 'utf8', (err, data) => {
    if (err) {
      console.error('❌ Error reading log file:', err);
      return res.status(500).send('Failed to load logs.');
    }

    res.send(`
      <html>
        <head>
          <title>Application Logs</title>
          <style>
            body {
              font-family: monospace;
              background-color: #f8f9fa;
              padding: 20px;
              color: #333;
            }
            .top-bar {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;
            }
            pre {
              background: #eee;
              padding: 20px;
              border-radius: 8px;
              overflow-x: auto;
              white-space: pre-wrap;
              word-wrap: break-word;
              max-height: 80vh;
              overflow-y: auto;
            }
            button {
              padding: 8px 16px;
              background-color: #007bff;
              border: none;
              color: white;
              font-size: 1rem;
              border-radius: 5px;
              cursor: pointer;
            }
            button:hover {
              background-color: #0056b3;
            }
          </style>
        </head>
        <body>
          <div class="top-bar">
            <h2>📜 Application Logs</h2>
            <button onclick="window.location.reload()">Refresh</button>
          </div>
          <pre>${data}</pre>
        </body>
      </html>
    `);
  });
});

//app.listen(PORT, () => {
// console.log(`✅ App running at http://localhost:${PORT}`);
//});
