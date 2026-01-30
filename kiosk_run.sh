#!/bin/bash
###############################################################################
# Prayer Timetable Kiosk Mode Runner (Performance Optimized)
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

# Set display environment variable
export DISPLAY=:0

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
    feh --fullscreen --hide-pointer --borderless --auto-zoom "$SPLASH_IMAGE" &
    SPLASH_PID=$!
    log "Splash screen displayed (PID: $SPLASH_PID)"
else
    log "WARNING: feh not installed or splash image not found"
fi

sleep 4

# Start HTTP server
log "Starting HTTP server on port 8000..."
cd "$PROJECT_DIR"
$HOME/myenv/bin/python -m http.server 8000 --directory "$PROJECT_DIR" >> "$LOGFILE" 2>&1 &
HTTP_PID=$!
log "HTTP server started (PID: $HTTP_PID)"

sleep 60

# Start Flask server
log "Starting Flask server on port 5000..."
$HOME/myenv/bin/python "$PROJECT_DIR/server.py" >> "$LOGFILE" 2>&1 &
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

# Force 1080p resolution before launching browser
log "Setting resolution to 1080p..."
xrandr --output HDMI-1 --mode 1920x1080 --rate 60 2>/dev/null || true
sleep 2
log "Resolution set to 1080p"

# Disable screen blanking and power management
xset s off
xset -dpms
xset s noblank

log "Launching Chromium in kiosk mode with GPU acceleration..."
/bin/chromium-browser \
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
  --fast --fast-start --disable-features=TranslateUI \
  --enable-gpu-rasterization \
  --enable-zero-copy \
  --enable-native-gpu-memory-buffers \
  --ignore-gpu-blocklist \
  --disable-smooth-scrolling \
  --disable-low-res-tiling \
  --enable-accelerated-2d-canvas \
  --disable-site-isolation-trials \
  --disable-features=IsolateOrigins,site-per-process \
  --disk-cache-size=1 \
  --disable-hang-monitor \
  http://localhost:8000 >> /home/pi/chromium.log 2>&1 &

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
        $HOME/myenv/bin/python "$PROJECT_DIR/server.py" >> "$LOGFILE" 2>&1 &
        FLASK_PID=$!
        log "Flask server restarted (PID: $FLASK_PID)"
    fi
done

log "Chromium exited"
log "Shutting down servers..."
kill $FLASK_PID 2>/dev/null
kill $HTTP_PID 2>/dev/null
log "Finished"
