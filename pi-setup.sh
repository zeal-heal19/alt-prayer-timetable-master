#!/bin/bash
###############################################################################
# Raspberry Pi Prayer Timetable - Complete Setup Script
# This script sets up everything needed to run the prayer timetable in kiosk mode
#
# Usage:
#   ./pi-setup.sh [OPTIONS]
#
# Options:
#   --repo-url URL        Git repository URL (for private repos)
#   --git-token TOKEN     Personal Access Token for private repo authentication
#   --git-user USERNAME   Git username (alternative to token)
#   --git-pass PASSWORD   Git password (alternative to token)
#   --help                Show this help message
#
# Examples:
#   # Local setup (copy files from current directory)
#   ./pi-setup.sh
#
#   # Clone from private GitHub repo using Personal Access Token
#   ./pi-setup.sh --repo-url https://github.com/username/alt-prayer-timetable.git --git-token ghp_xxxxx
#
#   # Clone from private repo using username/password
#   ./pi-setup.sh --repo-url https://github.com/username/alt-prayer-timetable.git --git-user myuser --git-pass mypass
#
###############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PI_USER="pi"
PI_HOME="$HOME"
PROJECT_NAME="alt-prayer-timetable"
PROJECT_DIR="$PI_HOME/my-application"
VENV_DIR="$PROJECT_DIR/venv"
LOG_FILE="$PI_HOME/setup.log"

# Git repository settings (can be overridden by command-line arguments)
GIT_REPO_URL=""
GIT_TOKEN=""
GIT_USERNAME=""
GIT_PASSWORD=""

# Print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

print_header() {
    echo "" | tee -a "$LOG_FILE"
    echo "=========================================" | tee -a "$LOG_FILE"
    echo "$1" | tee -a "$LOG_FILE"
    echo "=========================================" | tee -a "$LOG_FILE"
}

# Show help message
show_help() {
    cat << EOF
Raspberry Pi Prayer Timetable - Complete Setup Script

Usage:
  ./pi-setup.sh [OPTIONS]

Options:
  --repo-url URL        Git repository URL (HTTPS format)
  --git-token TOKEN     Personal Access Token for private repo
  --git-user USERNAME   Git username (alternative to token)
  --git-pass PASSWORD   Git password (alternative to token)
  --help                Show this help message

Examples:
  # Local setup (copy files from current directory)
  ./pi-setup.sh

  # Clone from private GitHub repo using Personal Access Token
  ./pi-setup.sh --repo-url https://github.com/username/alt-prayer-timetable.git --git-token ghp_xxxxx

  # Clone from private repo using username/password
  ./pi-setup.sh --repo-url https://github.com/username/repo.git --git-user myuser --git-pass mypass

Notes:
  - For GitHub, create a Personal Access Token at: https://github.com/settings/tokens
  - Token needs 'repo' permission for private repositories
  - HTTPS URL format: https://github.com/username/repository.git

EOF
    exit 0
}

# Parse command-line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --repo-url)
                GIT_REPO_URL="$2"
                shift 2
                ;;
            --git-token)
                GIT_TOKEN="$2"
                shift 2
                ;;
            --git-user)
                GIT_USERNAME="$2"
                shift 2
                ;;
            --git-pass)
                GIT_PASSWORD="$2"
                shift 2
                ;;
            --help|-h)
                show_help
                ;;
            *)
                echo "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
}

###############################################################################
# Step 1: System Update
###############################################################################
setup_system() {
    print_header "STEP 1: Updating System Packages"

    print_info "Updating package lists..."
    sudo apt update | tee -a "$LOG_FILE"

    print_info "Upgrading installed packages..."
    sudo apt upgrade -y | tee -a "$LOG_FILE"

    print_success "System updated successfully"
}

###############################################################################
# Step 2: Install Required Packages
###############################################################################
install_dependencies() {
    print_header "STEP 2: Installing Required Packages"

    print_info "Installing system packages..."
    sudo apt install -y \
        python3 \
        python3-pip \
        python3-venv \
        python3-dev \
        chromium \
        unclutter \
        feh \
        x11-xserver-utils \
        git \
        curl \
        vim \
        xdotool \
        matchbox-window-manager \
        xautomation | tee -a "$LOG_FILE"

    print_success "All system packages installed"
}

###############################################################################
# Step 3: Create Project Directory Structure
###############################################################################
setup_directories() {
    print_header "STEP 3: Setting Up Directory Structure"

    print_info "Creating project directory at $PROJECT_DIR..."
    mkdir -p "$PROJECT_DIR"

    print_info "Setting correct ownership..."
    sudo chown -R $PI_USER:$PI_USER "$PROJECT_DIR"

    print_success "Directory structure created"
}

###############################################################################
# Step 4: Get Project Files (Clone from Git or Copy Locally)
###############################################################################
copy_project_files() {
    print_header "STEP 4: Getting Project Files"

    if [ -n "$GIT_REPO_URL" ]; then
        # Clone from Git repository
        print_info "Cloning from repository: $GIT_REPO_URL"

        # Remove existing directory if it exists
        if [ -d "$PROJECT_DIR" ]; then
            print_info "Removing existing project directory..."
            rm -rf "$PROJECT_DIR"
        fi

        # Build authenticated clone URL
        CLONE_URL=""
        if [ -n "$GIT_TOKEN" ]; then
            # Use Personal Access Token
            print_info "Authenticating with Personal Access Token..."
            # Extract domain and path from URL
            REPO_DOMAIN=$(echo "$GIT_REPO_URL" | sed -E 's|https://([^/]+)/.*|\1|')
            REPO_PATH=$(echo "$GIT_REPO_URL" | sed -E 's|https://[^/]+/(.*)|\1|')
            CLONE_URL="https://x-access-token:${GIT_TOKEN}@${REPO_DOMAIN}/${REPO_PATH}"
        elif [ -n "$GIT_USERNAME" ] && [ -n "$GIT_PASSWORD" ]; then
            # Use username and password
            print_info "Authenticating with username and password..."
            REPO_DOMAIN=$(echo "$GIT_REPO_URL" | sed -E 's|https://([^/]+)/.*|\1|')
            REPO_PATH=$(echo "$GIT_REPO_URL" | sed -E 's|https://[^/]+/(.*)|\1|')
            CLONE_URL="https://${GIT_USERNAME}:${GIT_PASSWORD}@${REPO_DOMAIN}/${REPO_PATH}"
        else
            # Public repository or already authenticated
            CLONE_URL="$GIT_REPO_URL"
        fi

        # Clone the repository
        print_info "Cloning repository..."
        if git clone "$CLONE_URL" "$PROJECT_DIR" 2>&1 | tee -a "$LOG_FILE"; then
            print_success "Repository cloned successfully"
        else
            print_error "Failed to clone repository"
            print_error "Please check your repository URL and credentials"
            exit 1
        fi

        # Set correct ownership
        sudo chown -R $PI_USER:$PI_USER "$PROJECT_DIR"

    else
        # Copy from local directory
        CURRENT_DIR=$(pwd)

        if [ "$CURRENT_DIR" != "$PROJECT_DIR" ]; then
            print_info "Copying files from $CURRENT_DIR to $PROJECT_DIR..."

            # Copy all files except venv, .git, and __pycache__
            rsync -av \
                --exclude='venv' \
                --exclude='__pycache__' \
                --exclude='.git' \
                --exclude='*.pyc' \
                --exclude='.DS_Store' \
                "$CURRENT_DIR/" "$PROJECT_DIR/" | tee -a "$LOG_FILE"

            print_success "Project files copied"
        else
            print_info "Already in project directory, skipping copy"
        fi
    fi
}

###############################################################################
# Step 5: Set Up Python Virtual Environment
###############################################################################
setup_python_venv() {
    print_header "STEP 5: Setting Up Python Virtual Environment"

    cd "$PROJECT_DIR"

    print_info "Creating virtual environment at $VENV_DIR..."
    python3 -m venv "$VENV_DIR"

    print_info "Activating virtual environment..."
    source "$VENV_DIR/bin/activate"

    print_info "Upgrading pip..."
    pip install --upgrade pip | tee -a "$LOG_FILE"

    print_info "Installing Python dependencies from requirements.txt..."
    if [ -f "requirments.txt" ]; then
        pip install -r requirments.txt | tee -a "$LOG_FILE"
        print_success "Python dependencies installed"
    else
        print_warning "requirments.txt not found, skipping Python dependencies"
    fi
}

###############################################################################
# Step 6: Configure WiFi Auto-Switcher and Open Hotspot Profiles
###############################################################################
setup_wifi_profiles() {
    print_header "STEP 6: Setting Up WiFi Auto-Switcher"

    print_info "Creating WiFi profiles for open hotspots..."

    # Create profile for primary open hotspot
    print_info "Creating profile: salah-e-waqt-android (open hotspot)"
    sudo nmcli connection add \
        type wifi \
        con-name "salah-e-waqt-android" \
        ssid "salah-e-waqt" \
        wifi-sec.key-mgmt none \
        connection.autoconnect yes \
        connection.autoconnect-priority 10 2>/dev/null

    # Create backup profile for same hotspot
    print_info "Creating profile: salah-e-waqt-iphone (open hotspot)"
    sudo nmcli connection add \
        type wifi \
        con-name "salah-e-waqt-iphone" \
        ssid "salah-e-waqt" \
        wifi-sec.key-mgmt none \
        connection.autoconnect yes \
        connection.autoconnect-priority 9 2>/dev/null

    # Create fallback open hotspot profile
    print_info "Creating profile: my-hotspot (open hotspot)"
    sudo nmcli connection add \
        type wifi \
        con-name "my-hotspot" \
        ssid "my-hotspot" \
        wifi-sec.key-mgmt none \
        connection.autoconnect yes \
        connection.autoconnect-priority 5 2>/dev/null

    print_success "WiFi profiles created"

    # Create WiFi switcher script
    WIFI_SCRIPT="/usr/local/bin/wifi-switcher.sh"
    print_info "Creating WiFi auto-switcher script..."

    sudo tee "$WIFI_SCRIPT" > /dev/null << 'EOFWIFI'
#!/bin/bash
###############################################################################
# WiFi Auto-Switcher for Prayer Timetable
# Automatically switches between open hotspots
###############################################################################

TARGET_SSID="salah-e-waqt"
FALLBACK_SSID="my-hotspot"
LOG_FILE="/var/log/wifi-switcher.log"

# Get current connection
CURRENT_SSID=$(iwgetid -r)

# Scan for available networks
nmcli device wifi rescan 2>/dev/null
sleep 3

# Check if target network is available
TARGET_AVAILABLE=$(nmcli -t -f SSID device wifi list | grep -x "$TARGET_SSID")

if [ -n "$TARGET_AVAILABLE" ]; then
    # Target network found
    if [ "$CURRENT_SSID" != "$TARGET_SSID" ]; then
        echo "$(date): Switching to $TARGET_SSID" >> $LOG_FILE

        # Try Android profile first
        nmcli connection up "salah-e-waqt-android" 2>/dev/null
        sleep 5

        # Check if connected
        NEW_SSID=$(iwgetid -r)
        if [ "$NEW_SSID" != "$TARGET_SSID" ]; then
            # Android failed, try iPhone profile
            echo "$(date): Android profile failed, trying iPhone" >> $LOG_FILE
            nmcli connection up "salah-e-waqt-iphone" 2>/dev/null
            sleep 5
        fi

        # If both profiles failed, try direct connection
        NEW_SSID=$(iwgetid -r)
        if [ "$NEW_SSID" != "$TARGET_SSID" ]; then
            echo "$(date): Both profiles failed, trying direct connection" >> $LOG_FILE
            nmcli device wifi connect "$TARGET_SSID" 2>/dev/null
        fi

        # Log final result
        FINAL_SSID=$(iwgetid -r)
        FINAL_IP=$(hostname -I | awk '{print $1}')
        if [ "$FINAL_SSID" = "$TARGET_SSID" ]; then
            echo "$(date): ✓ Connected to $FINAL_SSID with IP $FINAL_IP" >> $LOG_FILE
        else
            echo "$(date): ✗ Failed to connect to $TARGET_SSID" >> $LOG_FILE
        fi
    fi
else
    # Target not available, use fallback
    if [ "$CURRENT_SSID" != "$FALLBACK_SSID" ]; then
        echo "$(date): $TARGET_SSID not found, connecting to $FALLBACK_SSID" >> $LOG_FILE
        nmcli connection up "$FALLBACK_SSID" 2>/dev/null
        sleep 5

        FINAL_SSID=$(iwgetid -r)
        FINAL_IP=$(hostname -I | awk '{print $1}')
        if [ "$FINAL_SSID" = "$FALLBACK_SSID" ]; then
            echo "$(date): ✓ Fallback connected to $FINAL_SSID with IP $FINAL_IP" >> $LOG_FILE
        else
            echo "$(date): ✗ Failed to connect to fallback" >> $LOG_FILE
        fi
    fi
fi

# Keep log file reasonable size (last 1000 lines)
if [ -f "$LOG_FILE" ]; then
    tail -1000 "$LOG_FILE" > "$LOG_FILE.tmp" 2>/dev/null && mv "$LOG_FILE.tmp" "$LOG_FILE"
fi
EOFWIFI

    sudo chmod +x "$WIFI_SCRIPT"
    print_success "WiFi switcher script created"

    # Create log file
    sudo touch /var/log/wifi-switcher.log
    sudo chmod 666 /var/log/wifi-switcher.log

    # Create systemd service
    print_info "Creating systemd service..."
    sudo tee /etc/systemd/system/wifi-switcher.service > /dev/null << 'EOFSERVICE'
[Unit]
Description=WiFi Auto Switcher
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/wifi-switcher.sh
StandardOutput=append:/var/log/wifi-switcher.log
StandardError=append:/var/log/wifi-switcher.log
EOFSERVICE

    # Create systemd timer
    print_info "Creating systemd timer (runs every 2 minutes)..."
    sudo tee /etc/systemd/system/wifi-switcher.timer > /dev/null << 'EOFTIMER'
[Unit]
Description=Run WiFi switcher every 2 minutes

[Timer]
OnBootSec=60
OnUnitActiveSec=120

[Install]
WantedBy=timers.target
EOFTIMER

    # Reload systemd and enable timer
    print_info "Enabling WiFi auto-switcher..."
    sudo systemctl daemon-reload
    sudo systemctl enable wifi-switcher.timer
    sudo systemctl start wifi-switcher.timer

    print_success "WiFi auto-switcher configured (systemd timer)"

    # Run once immediately to test
    print_info "Testing WiFi connection..."
    sudo "$WIFI_SCRIPT"
    sleep 3

    CURRENT_WIFI=$(iwgetid -r)
    CURRENT_IP=$(hostname -I | awk '{print $1}')

    if [ -n "$CURRENT_WIFI" ]; then
        print_success "Connected to: $CURRENT_WIFI (IP: $CURRENT_IP)"
    else
        print_warning "Not connected to any WiFi. Hotspots may not be in range yet."
        print_info "WiFi switcher will automatically connect when hotspots are available"
    fi
}

###############################################################################
# Step 7: Setup Raspberry Pi as WiFi Hotspot
###############################################################################
setup_pi_hotspot() {
    print_header "STEP 7: Setting Up Raspberry Pi as WiFi Hotspot"

    HOTSPOT_SSID="my-hotspot"
    HOTSPOT_IP="192.168.50.1"
    DHCP_RANGE_START="192.168.50.10"
    DHCP_RANGE_END="192.168.50.50"

    print_info "Installing hotspot packages..."
    sudo apt-get install -y hostapd dnsmasq > /dev/null 2>&1

    print_info "Stopping services..."
    sudo systemctl stop hostapd 2>/dev/null || true
    sudo systemctl stop dnsmasq 2>/dev/null || true

    print_info "Configuring static IP for wlan0..."
    # Backup dhcpcd.conf if not already backed up
    if [ ! -f /etc/dhcpcd.conf.backup ]; then
        sudo cp /etc/dhcpcd.conf /etc/dhcpcd.conf.backup
    fi

    # Add static IP configuration for hotspot
    sudo tee -a /etc/dhcpcd.conf > /dev/null << EOF

# Static IP for WiFi Hotspot (added by pi-setup.sh)
interface wlan0
    static ip_address=${HOTSPOT_IP}/24
    nohook wpa_supplicant
EOF

    print_info "Configuring DHCP server..."
    # Backup dnsmasq.conf if exists
    if [ -f /etc/dnsmasq.conf ]; then
        sudo mv /etc/dnsmasq.conf /etc/dnsmasq.conf.backup 2>/dev/null || true
    fi

    # Create dnsmasq configuration
    sudo tee /etc/dnsmasq.conf > /dev/null << EOF
# DHCP server for WiFi hotspot
interface=wlan0
dhcp-range=${DHCP_RANGE_START},${DHCP_RANGE_END},255.255.255.0,24h
domain=wlan
address=/gw.wlan/${HOTSPOT_IP}
bogus-priv
EOF

    print_info "Configuring WiFi Access Point..."
    # Create hostapd configuration for OPEN hotspot
    sudo tee /etc/hostapd/hostapd.conf > /dev/null << EOF
# WiFi Access Point Configuration (Open Hotspot)
interface=wlan0
driver=nl80211
ssid=${HOTSPOT_SSID}
hw_mode=g
channel=6
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
EOF

    # Point hostapd to config file
    sudo tee /etc/default/hostapd > /dev/null << EOF
DAEMON_CONF="/etc/hostapd/hostapd.conf"
EOF

    print_info "Enabling hotspot services..."
    sudo systemctl unmask hostapd
    sudo systemctl enable hostapd
    sudo systemctl enable dnsmasq

    print_success "Pi Hotspot configured"
    print_info "Hotspot details:"
    echo "  • SSID: $HOTSPOT_SSID (open - no password)"
    echo "  • IP Address: $HOTSPOT_IP"
    echo "  • DHCP Range: $DHCP_RANGE_START - $DHCP_RANGE_END"
    echo "  • Admin Panel: http://$HOTSPOT_IP:5000/home"
}

###############################################################################
# Step 8: Create Kiosk Run Script
###############################################################################
create_kiosk_script() {
    print_header "STEP 8: Creating Kiosk Run Script"

    KIOSK_SCRIPT="$PI_HOME/kiosk_run.sh"

    print_info "Creating kiosk script at $KIOSK_SCRIPT..."

    cat > "$KIOSK_SCRIPT" << 'EOFKIOSK'
#!/bin/bash
###############################################################################
# Prayer Timetable Kiosk Mode Runner
###############################################################################

LOGFILE="/home/pi/kiosk.log"
PROJECT_DIR="/home/pi/my-application"
SPLASH_IMAGE="$PROJECT_DIR/images/kabba-image-s.png"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOGFILE"
}

log "========================================="
log "Starting Prayer Timetable Kiosk"
log "========================================="

# Wait for X server to be ready
log "Waiting for X server..."
while ! xset q &>/dev/null; do
    sleep 1
done
log "X server ready"

# Hide cursor
log "Hiding mouse cursor..."
unclutter -idle 0.1 -root &

# Hide desktop and taskbar
log "Hiding desktop elements..."
killall lxpanel 2>/dev/null
killall lxqt-panel 2>/dev/null
killall pcmanfm 2>/dev/null
xsetroot -solid black
sleep 0.5

# Show splash screen
if command -v feh &> /dev/null && [ -f "$SPLASH_IMAGE" ]; then
    log "Displaying splash screen..."
    DISPLAY=:0 feh --fullscreen --hide-pointer --borderless --auto-zoom "$SPLASH_IMAGE" &
    SPLASH_PID=$!
    log "Splash screen displayed (PID: $SPLASH_PID)"
else
    log "WARNING: feh not installed or splash image not found"
fi

sleep 4

# Start Flask server
log "Starting Flask server on port 5000..."
cd "$PROJECT_DIR"
$PROJECT_DIR/venv/bin/python server.py >> "$LOGFILE" 2>&1 &
FLASK_PID=$!
log "Flask server started (PID: $FLASK_PID)"

# Wait for Flask to be ready
log "Waiting for Flask server to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:5000 > /dev/null 2>&1; then
        log "Flask server is responding!"
        break
    fi
    log "Waiting... attempt $i/30"
    sleep 2
done

# Disable screen blanking and power management
xset s off
xset -dpms
xset s noblank

log "Launching Chromium in kiosk mode..."
/usr/bin/chromium-browser \
  --kiosk \
  --incognito \
  --noerrdialogs \
  --disable-session-crashed-bubble \
  --disable-infobars \
  --check-for-update-interval=31536000 \
  --start-fullscreen \
  --overscroll-history-navigation=0 \
  --disable-pinch \
  --disable-translate \
  --fast --fast-start \
  --disable-features=TranslateUI \
  --autoplay-policy=no-user-gesture-required \
  --disable-background-timer-throttling \
  --disable-backgrounding-occluded-windows \
  --disable-renderer-backgrounding \
  --disk-cache-size=1 \
  http://localhost:5000 &

CHROMIUM_PID=$!
log "Chromium launched (PID: $CHROMIUM_PID)"

# Close splash screen after browser loads
sleep 10
if [ ! -z "$SPLASH_PID" ]; then
    log "Closing splash screen..."
    kill $SPLASH_PID 2>/dev/null
    log "Splash screen closed"
fi

# Monitor processes
while kill -0 $CHROMIUM_PID 2>/dev/null; do
    sleep 60

    # Check if Flask is still running
    if ! kill -0 $FLASK_PID 2>/dev/null; then
        log "ERROR: Flask server died! Restarting..."
        cd "$PROJECT_DIR"
        $PROJECT_DIR/venv/bin/python server.py >> "$LOGFILE" 2>&1 &
        FLASK_PID=$!
        log "Flask server restarted (PID: $FLASK_PID)"
    fi
done

log "Chromium exited"
log "Shutting down Flask server..."
kill $FLASK_PID 2>/dev/null
log "Finished"
EOFKIOSK

    chmod +x "$KIOSK_SCRIPT"
    print_success "Kiosk script created at $KIOSK_SCRIPT"
}

###############################################################################
# Step 9: Configure Autostart
###############################################################################
setup_autostart() {
    print_header "STEP 9: Configuring Autostart"

    AUTOSTART_DIR="$PI_HOME/.config/lxsession/LXDE-pi"
    AUTOSTART_FILE="$AUTOSTART_DIR/autostart"

    print_info "Creating autostart directory..."
    mkdir -p "$AUTOSTART_DIR"

    print_info "Configuring autostart..."

    cat > "$AUTOSTART_FILE" << EOFAUTO
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
@xscreensaver -no-splash
@point-rpi

# Disable screen blanking
@xset s off
@xset -dpms
@xset s noblank

# Hide mouse cursor
@unclutter -idle 0.1 -root

# Start Prayer Timetable Kiosk
@bash $PI_HOME/kiosk_run.sh
EOFAUTO

    print_success "Autostart configured"
}

###############################################################################
# Step 10: Configure Display Settings
###############################################################################
configure_display() {
    print_header "STEP 10: Configuring Display Settings"

    # Disable screen blanking in lightdm
    print_info "Configuring lightdm..."
    sudo bash -c 'cat > /etc/lightdm/lightdm.conf.d/01_my.conf' << EOFLIGHTDM
[Seat:*]
xserver-command=X -s 0 -dpms
EOFLIGHTDM

    print_success "Display settings configured"
}

###############################################################################
# Step 11: Create Environment File
###############################################################################
create_env_file() {
    print_header "STEP 11: Creating Environment Configuration"

    ENV_FILE="$PROJECT_DIR/.env"

    print_info "Creating .env file..."

    cat > "$ENV_FILE" << EOFENV
# Flask Configuration
FLASK_APP=server.py
FLASK_ENV=production
SECRET_KEY=super-secret-key-change-in-production

# Server Configuration
HOST=0.0.0.0
PORT=5000
DEBUG=False

# Application Configuration
PROJECT_DIR=$PROJECT_DIR
VENV_DIR=$VENV_DIR
EOFENV

    print_success "Environment file created"
}

###############################################################################
# Step 12: Final Configuration
###############################################################################
final_configuration() {
    print_header "STEP 12: Final Configuration"

    # Create config backup directory
    BACKUP_DIR="$PROJECT_DIR/config_backup"
    mkdir -p "$BACKUP_DIR"
    print_info "Created backup directory: $BACKUP_DIR"

    # Set timezone (change as needed)
    print_info "Setting timezone to Asia/Kolkata..."
    sudo timedatectl set-timezone Asia/Kolkata

    print_success "Final configuration complete"
}

###############################################################################
# Main Installation Flow
###############################################################################
main() {
    # Parse command-line arguments
    parse_arguments "$@"

    print_header "RASPBERRY PI PRAYER TIMETABLE SETUP"
    echo "This script will set up everything needed for the prayer timetable kiosk" | tee -a "$LOG_FILE"
    echo ""

    # Show setup mode
    if [ -n "$GIT_REPO_URL" ]; then
        print_info "Setup Mode: Clone from Git repository"
        print_info "Repository: $GIT_REPO_URL"
    else
        print_info "Setup Mode: Copy from local directory"
    fi
    echo ""

    # Check if running as correct user
    if [ "$(whoami)" != "$PI_USER" ]; then
        print_warning "This script should be run as user '$PI_USER'"
        print_info "Switching to user $PI_USER..."
        sudo -u $PI_USER bash "$0" "$@"
        exit $?
    fi

    setup_system
    install_dependencies
    setup_directories
    copy_project_files
    setup_python_venv
    setup_wifi_profiles
# This should be commented     setup_pi_hotspot
    create_kiosk_script
    setup_autostart
#   configure_display
#   create_env_file
#    final_configuration

    print_header "SETUP COMPLETE!"
    print_success "Prayer Timetable setup completed successfully!"
    echo ""
    print_info "Summary:"
    echo "  • Project directory: $PROJECT_DIR"
    echo "  • Kiosk script: $PI_HOME/kiosk_run.sh"
    echo "  • Log file: $PI_HOME/kiosk.log"
    echo "  • Virtual environment: $VENV_DIR"
    echo "  • WiFi switcher: /usr/local/bin/wifi-switcher.sh"
    echo "  • WiFi log: /var/log/wifi-switcher.log"
    echo ""
    print_info "WiFi Configuration:"
    echo "  • Primary hotspot: salah-e-waqt (open)"
    echo "  • Fallback hotspot: my-hotspot (open)"
    echo "  • Auto-switch: Every 2 minutes (systemd timer)"
    echo "  • Current WiFi: $(iwgetid -r || echo 'Not connected')"
    echo "  • Current IP: $(hostname -I | awk '{print $1}' || echo 'No IP')"
    echo ""
    print_info "Pi Hotspot (Access Point):"
    echo "  • SSID: my-hotspot (open - no password)"
    echo "  • Pi IP Address: 192.168.50.1"
    echo "  • Admin Panel: http://192.168.50.1:5000/home"
    echo "  • Connect mobile to 'my-hotspot' to update remotely"
    echo ""
    print_info "Useful commands:"
    echo "  • View kiosk logs: tail -f $PI_HOME/kiosk.log"
    echo "  • Stop kiosk: pkill -f chromium-browser"
    echo "  • WiFi status: iwgetid -r"
    echo "  • WiFi logs: tail -f /var/log/wifi-switcher.log"
    echo "  • WiFi timer status: sudo systemctl status wifi-switcher.timer"
    echo "  • Hotspot status: sudo systemctl status hostapd"
    echo "  • Restart hotspot: sudo systemctl restart hostapd dnsmasq"
    echo ""
    print_warning "IMPORTANT: Reboot the Raspberry Pi to start kiosk mode"
    echo ""
    read -p "Would you like to reboot now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Rebooting in 5 seconds..."
        sleep 5
        sudo reboot
    else
        print_info "Please reboot manually when ready: sudo reboot"
    fi
}

# Run main function with all command-line arguments
main "$@"
