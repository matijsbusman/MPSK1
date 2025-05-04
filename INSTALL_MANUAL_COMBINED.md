
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
CLIENT_ID=<API Client ID>
CLIENT_SECRET=<API secret value>
REFRESH_TOKEN=<refresh token>
MPSK_GROUP=<group collected with swagger>
```

> Replace placeholders with your actual Aruba Central credentials.

#### 6. Run the Application

```bash
node server.js
```

Access it at `http://localhost`.

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
CLIENT_ID=<API Client ID>
CLIENT_SECRET=<API secret value>
REFRESH_TOKEN=<refresh token>
MPSK_GROUP=<group collected with swagger>
```

### 6. Run the Application

```bash
node server.js
```

Access it at `http://localhost`.

---

## ✅ Troubleshooting

- Ensure ports are not blocked by firewalls or antivirus.
- Verify `.env` paths match actual certificate locations.
- Use `console.log()` for debugging if something isn’t loading.

