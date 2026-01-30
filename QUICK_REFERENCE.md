# Quick Reference - Performance Optimization

## 🚀 Essential CSS Pattern (Add to all animated elements)

```css
.animated-element {
  will-change: transform;              /* or opacity, or background-position */
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}
```

## ⚙️ Essential config.txt Settings

```bash
# Force 1080p
hdmi_enable_4k=0
hdmi_group=2
hdmi_mode=82
max_framebuffer_width=1920
max_framebuffer_height=1080

# Overclock (safe for Pi 4 with fan)
force_turbo=1
over_voltage=2
arm_freq=1800
gpu_freq=600
gpu_mem=256
sdram_freq=3200
over_voltage_sdram=2
```

## 🌐 Essential Chromium Flags

```bash
export DISPLAY=:0
xrandr --output HDMI-1 --mode 1920x1080 --rate 60

/bin/chromium-browser \
  --kiosk \
  --enable-gpu-rasterization \
  --enable-zero-copy \
  --enable-native-gpu-memory-buffers \
  --ignore-gpu-blocklist \
  --enable-accelerated-2d-canvas \
  --disable-smooth-scrolling \
  http://localhost:8000 &
```

## 📊 Quick Check Commands

```bash
# Check resolution (must show 1920x1080)
DISPLAY=:0 xrandr | grep '\*'

# Check CPU speed (must show ~1800MHz)
vcgencmd measure_clock arm

# Check GPU speed (must show ~600MHz)
vcgencmd measure_clock core

# Check temperature (must be < 80°C)
vcgencmd measure_temp
```

## 🎯 Performance Targets

- ✅ Resolution: **1920x1080 @ 60Hz** (not 4K!)
- ✅ CPU: **1800MHz** (overclocked from 1500MHz)
- ✅ GPU: **600MHz** (overclocked from 500MHz)
- ✅ Temperature: **< 80°C** (fan control at 80°C)
- ✅ Animations: **Smooth 60fps** (no lag or stutter)

## 🔧 Quick Fixes

**If laggy:**
```bash
# Force 1080p immediately
DISPLAY=:0 xrandr --output HDMI-1 --mode 1920x1080 --rate 60
```

**If browser won't launch:**
```bash
export DISPLAY=:0
pkill chromium
/home/pi/kiosk_run.sh
```

**If too hot:**
```bash
# Check fan is working
vcgencmd measure_temp
# Reduce overclock in /boot/firmware/config.txt to arm_freq=1700
```
