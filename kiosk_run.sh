#!/bin/bash
sleep 4
echo "Starting python" >> /home/pi/kiosk.log
$HOME/myenv/bin/python -m http.server 8000 --directory /home/pi/my-application >> /home/pi/kiosk.log 2>&1 &
echo "sleeping for 60 seconds" >> /home/pi/kiosk.log
sleep 60
echo "Starting flask server" >> /home/pi/kiosk.log
$HOME/myenv/bin/python $HOME/my-application/server.py >/home/pi/server.log &
echo "Server Started successfully" > /home/pi/kiosk.log
echo "sleep completed and launching chrome" >> /home/pi/kiosk.log

# Set display environment variable
export DISPLAY=:0

# Force 1080p resolution before launching browser
xrandr --output HDMI-1 --mode 1920x1080 --rate 60 2>/dev/null || true
sleep 2
echo "Resolution set to 1080p" >> /home/pi/kiosk.log

# Launch Chromium with DISPLAY set
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

# Log the chromium PID
echo "Chromium launched with PID: $!" >> /home/pi/kiosk.log

#/bin/chromium-browser --kiosk http://localhost:8000
echo "Finished" >> /home/pi/kiosk.log
