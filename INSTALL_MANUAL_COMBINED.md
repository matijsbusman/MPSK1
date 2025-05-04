
# Aruba Central mPSK Manager – Installation Manual (Windows & Linux/macOS)

This manual provides step-by-step instructions to install and run the Aruba Central mPSK Manager application on **Windows** and **Linux/macOS** systems.

---

## 🪟 Windows Installation

### 1. Prerequisites

- Install [Node.js (LTS)](https://nodejs.org/) – includes `npm`
- Install [Git](https://git-scm.com/)
- Optional: Install [Visual Studio Code](https://code.visualstudio.com/) for editing

### 2. Clone the Repository

```sh
git clone https://github.com/your-username/aruba-central-mpsk-manager.git
cd aruba-central-mpsk-manager
```

### 3. Install Dependencies

```sh
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory and add the following:

```env
CLIENT_ID=your_aruba_central_client_id
CLIENT_SECRET=your_aruba_central_client_secret
CUSTOMER_ID=your_customer_id
TOKEN_URL=https://oauth2.central.arubanetworks.com/oauth2/token
CERT_PATH=./certs/cert.pem
KEY_PATH=./certs/key.pem
```

> Replace placeholders with your actual Aruba Central credentials.

### 5. Create Certificates

You can create self-signed certificates using PowerShell or OpenSSL:

```sh
openssl req -nodes -new -x509 -keyout certs/key.pem -out certs/cert.pem
```

Make sure to place the generated files in the `certs/` directory.

### 6. Run the Application

```sh
node server.js
```

The application will run at `https://localhost:3000`.

---

## 🐧 Linux/macOS Installation

### 1. Prerequisites

- Node.js (Install via `nvm` or package manager)
- Git
- OpenSSL

### 2. Clone the Repository

```bash
git clone https://github.com/your-username/aruba-central-mpsk-manager.git
cd aruba-central-mpsk-manager
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Set Up Environment Variables

Create a `.env` file:

```bash
nano .env
```

Paste the following and replace values accordingly:

```env
CLIENT_ID=your_aruba_central_client_id
CLIENT_SECRET=your_aruba_central_client_secret
CUSTOMER_ID=your_customer_id
TOKEN_URL=https://oauth2.central.arubanetworks.com/oauth2/token
CERT_PATH=./certs/cert.pem
KEY_PATH=./certs/key.pem
```

### 5. Generate SSL Certificates

```bash
mkdir -p certs
openssl req -nodes -new -x509 -keyout certs/key.pem -out certs/cert.pem
```

### 6. Run the Application

```bash
node server.js
```

Access it at `https://localhost:3000`.

---

## ✅ Troubleshooting

- Ensure ports are not blocked by firewalls or antivirus.
- Verify `.env` paths match actual certificate locations.
- Use `console.log()` for debugging if something isn’t loading.

