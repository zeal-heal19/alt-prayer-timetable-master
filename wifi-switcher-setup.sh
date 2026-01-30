#!/bin/bash
###############################################################################
# WiFi Switcher - Automated WiFi Network Switching for Raspberry Pi
# Automatically connects to preferred hotspot with fallback support
###############################################################################

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "========================================="
echo "WiFi Switcher Setup"
echo "========================================="

# Configuration
TARGET_SSID="salah-e-waqt"
FALLBACK_SSID="my-hotspot"
SCRIPT_PATH="/usr/local/bin/wifi-switcher.sh"
LOG_FILE="/var/log/wifi-switcher.log"
CRON_SCHEDULE="*/5 * * * *"  # Every 5 minutes

# Get WiFi passwords
echo ""
echo -e "${YELLOW}WiFi Configuration${NC}"
echo ""
read -p "Enter password for '$TARGET_SSID' (or press Enter to skip): " TARGET_PASSWORD
read -p "Enter password for '$FALLBACK_SSID' (or press Enter to skip): " FALLBACK_PASSWORD

# Create WiFi switcher script
echo ""
echo "Creating WiFi switcher script..."

sudo tee "$SCRIPT_PATH" > /dev/null << 'EOFSCRIPT'
#!/bin/bash
###############################################################################
# WiFi Auto-Switcher
# Automatically switches between preferred and fallback WiFi networks
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
            nmcli connection up "$TARGET_SSID" 2>/dev/null
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
    tail -1000 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
fi
EOFSCRIPT

# Make script executable
sudo chmod +x "$SCRIPT_PATH"
echo -e "${GREEN}✓${NC} WiFi switcher script created at $SCRIPT_PATH"

# Create log file with proper permissions
sudo touch "$LOG_FILE"
sudo chmod 666 "$LOG_FILE"
echo -e "${GREEN}✓${NC} Log file created at $LOG_FILE"

# Configure WiFi connections if passwords provided
if [ -n "$TARGET_PASSWORD" ]; then
    echo ""
    echo "Configuring $TARGET_SSID..."

    # Create Android profile
    sudo nmcli connection add \
        type wifi \
        con-name "salah-e-waqt-android" \
        ssid "$TARGET_SSID" \
        wifi-sec.key-mgmt wpa-psk \
        wifi-sec.psk "$TARGET_PASSWORD" 2>/dev/null

    # Create iPhone profile (in case hotspot name changes slightly)
    sudo nmcli connection add \
        type wifi \
        con-name "salah-e-waqt-iphone" \
        ssid "$TARGET_SSID" \
        wifi-sec.key-mgmt wpa-psk \
        wifi-sec.psk "$TARGET_PASSWORD" 2>/dev/null

    echo -e "${GREEN}✓${NC} $TARGET_SSID profiles configured"
fi

if [ -n "$FALLBACK_PASSWORD" ]; then
    echo "Configuring $FALLBACK_SSID..."
    sudo nmcli connection add \
        type wifi \
        con-name "$FALLBACK_SSID" \
        ssid "$FALLBACK_SSID" \
        wifi-sec.key-mgmt wpa-psk \
        wifi-sec.psk "$FALLBACK_PASSWORD" 2>/dev/null

    echo -e "${GREEN}✓${NC} $FALLBACK_SSID configured"
fi

# Set up cron job
echo ""
echo "Setting up automatic execution..."

# Remove existing cron job if present
(crontab -l 2>/dev/null | grep -v "wifi-switcher.sh") | crontab -

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_SCHEDULE $SCRIPT_PATH >> $LOG_FILE 2>&1") | crontab -

echo -e "${GREEN}✓${NC} Cron job configured (runs every 5 minutes)"

# Run once immediately
echo ""
echo "Running initial WiFi check..."
sudo "$SCRIPT_PATH"

# Display current status
echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "Current Status:"
echo "  SSID: $(iwgetid -r)"
echo "  IP: $(hostname -I | awk '{print $1}')"
echo ""
echo "Configuration:"
echo "  Preferred: $TARGET_SSID"
echo "  Fallback: $FALLBACK_SSID"
echo "  Check interval: Every 5 minutes"
echo ""
echo "Useful Commands:"
echo "  View logs: tail -f $LOG_FILE"
echo "  Run manually: sudo $SCRIPT_PATH"
echo "  Check WiFi: iwgetid -r"
echo "  List connections: nmcli connection show"
echo ""
