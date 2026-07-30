# --- Base image: Node 20 on Debian, which lets us also install Python cleanly ---
FROM node:20-bookworm

# Install system Python3 + venv + pip (this is what was missing at runtime before)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-venv \
    python3-pip \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/render/project/src

# Install Node deps first (better Docker layer caching)
COPY package*.json ./
RUN npm install

# Copy the rest of the repo (includes realtime-server/, scripts/, requirements.txt)
COPY . .

# Build the realtime server (same as your current build:realtime script)
RUN npm run build:realtime

# Create the Python venv and install PDF extraction dependencies INSIDE the same image
# that will actually run the app -- this is the fix for the build/runtime mismatch
RUN python3 -m venv venv
RUN ./venv/bin/pip install --no-cache-dir -r requirements.txt

EXPOSE 3000

# Same as your start:realtime script
CMD ["node", "realtime-server/dist/server.js"]