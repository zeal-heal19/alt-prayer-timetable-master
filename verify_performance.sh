#!/bin/bash

# Performance Verification Script for Prayer App
# Run this script to verify all optimizations are working correctly

echo "========================================"
echo "  Prayer App Performance Check"
echo "========================================"
echo ""

# Check if running as pi user
if [ "$USER" != "pi" ]; then
    echo "⚠️  Warning: Script should be run as 'pi' user"
fi

echo "🖥️  DISPLAY RESOLUTION CHECK"
echo "----------------------------------------"
RESOLUTION=$(DISPLAY=:0 xrandr 2>/dev/null | grep '\*' | awk '{print $1}')
if [ "$RESOLUTION" = "1920x1080" ]; then
    echo "✅ Resolution: $RESOLUTION @ 60Hz (OPTIMAL)"
elif [ "$RESOLUTION" = "3840x2160" ]; then
    echo "❌ Resolution: $RESOLUTION (4K - TOO HIGH!)"
    echo "   Fix: Update /boot/firmware/config.txt and reboot"
    echo "   Or run: DISPLAY=:0 xrandr --output HDMI-1 --mode 1920x1080 --rate 60"
else
    echo "⚠️  Resolution: $RESOLUTION"
    DISPLAY=:0 xrandr 2>/dev/null | grep '\*'
fi
echo ""

echo "⚡ CPU PERFORMANCE CHECK"
echo "----------------------------------------"
CPU_FREQ=$(vcgencmd measure_clock arm | cut -d'=' -f2)
CPU_MHZ=$((CPU_FREQ / 1000000))
if [ $CPU_MHZ -ge 1750 ]; then
    echo "✅ CPU Frequency: ${CPU_MHZ}MHz (OVERCLOCKED)"
else
    echo "⚠️  CPU Frequency: ${CPU_MHZ}MHz (Not overclocked)"
    echo "   Check: /boot/firmware/config.txt has arm_freq=1800"
fi
echo ""

echo "🎮 GPU PERFORMANCE CHECK"
echo "----------------------------------------"
GPU_FREQ=$(vcgencmd measure_clock core | cut -d'=' -f2)
GPU_MHZ=$((GPU_FREQ / 1000000))
if [ $GPU_MHZ -ge 550 ]; then
    echo "✅ GPU Frequency: ${GPU_MHZ}MHz (OVERCLOCKED)"
else
    echo "⚠️  GPU Frequency: ${GPU_MHZ}MHz (Not overclocked)"
    echo "   Check: /boot/firmware/config.txt has gpu_freq=600"
fi

GPU_MEM=$(vcgencmd get_mem gpu | cut -d'=' -f2)
if [ "$GPU_MEM" = "256M" ]; then
    echo "✅ GPU Memory: $GPU_MEM (OPTIMAL)"
else
    echo "⚠️  GPU Memory: $GPU_MEM (Should be 256M)"
    echo "   Check: /boot/firmware/config.txt has gpu_mem=256"
fi
echo ""

echo "🌡️  TEMPERATURE CHECK"
echo "----------------------------------------"
TEMP=$(vcgencmd measure_temp | cut -d'=' -f2 | cut -d"'" -f1)
TEMP_INT=${TEMP%.*}
if [ $TEMP_INT -lt 70 ]; then
    echo "✅ Temperature: ${TEMP}°C (EXCELLENT)"
elif [ $TEMP_INT -lt 80 ]; then
    echo "⚠️  Temperature: ${TEMP}°C (WARM - monitor closely)"
else
    echo "❌ Temperature: ${TEMP}°C (TOO HOT!)"
    echo "   Improve cooling or reduce overclock"
fi
echo ""

echo "🔋 VOLTAGE CHECK"
echo "----------------------------------------"
VOLTAGE=$(vcgencmd measure_volts | cut -d'=' -f2)
echo "✅ Voltage: $VOLTAGE"
echo ""

echo "🌐 BROWSER CHECK"
echo "----------------------------------------"
if pgrep -x "chromium-browse" > /dev/null; then
    CHROME_PID=$(pgrep -x "chromium-browse")
    echo "✅ Chromium is running (PID: $CHROME_PID)"
else
    echo "❌ Chromium is not running"
    echo "   Start with: /home/pi/kiosk_run.sh"
fi
echo ""

echo "📝 DISPLAY ENVIRONMENT CHECK"
echo "----------------------------------------"
if [ -z "$DISPLAY" ]; then
    echo "⚠️  DISPLAY variable not set"
    echo "   Export with: export DISPLAY=:0"
else
    echo "✅ DISPLAY: $DISPLAY"
fi
echo ""

echo "📊 SUMMARY"
echo "========================================"
echo ""

# Calculate score
SCORE=0
MAX_SCORE=6

if [ "$RESOLUTION" = "1920x1080" ]; then ((SCORE++)); fi
if [ $CPU_MHZ -ge 1750 ]; then ((SCORE++)); fi
if [ $GPU_MHZ -ge 550 ]; then ((SCORE++)); fi
if [ "$GPU_MEM" = "256M" ]; then ((SCORE++)); fi
if [ $TEMP_INT -lt 80 ]; then ((SCORE++)); fi
if pgrep -x "chromium-browse" > /dev/null; then ((SCORE++)); fi

PERCENTAGE=$((SCORE * 100 / MAX_SCORE))

echo "Performance Score: $SCORE/$MAX_SCORE ($PERCENTAGE%)"
echo ""

if [ $SCORE -eq $MAX_SCORE ]; then
    echo "🎉 PERFECT! All optimizations are active!"
    echo "   Your animations should be buttery smooth."
elif [ $SCORE -ge 4 ]; then
    echo "✅ GOOD! Most optimizations are active."
    echo "   Check warnings above for remaining issues."
else
    echo "⚠️  NEEDS ATTENTION! Several optimizations missing."
    echo "   Review the guide: PERFORMANCE_OPTIMIZATION_GUIDE.md"
fi

echo ""
echo "========================================"
echo "For detailed info, see:"
echo "  - PERFORMANCE_OPTIMIZATION_GUIDE.md"
echo "  - QUICK_REFERENCE.md"
echo "========================================"
