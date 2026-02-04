# 📱 Expo Go - Complete Setup Guide

## 🚀 **How to Open Your App in Expo Go on iPhone**

### **Method 1: Scan QR Code (Easiest)**

1. **Install Expo Go** (if not already installed)
   - Open App Store on your iPhone
   - Search for "Expo Go"
   - Install the app

2. **Open Expo Go App**
   - Launch Expo Go on your iPhone

3. **Scan the QR Code**
   - Go to: **https://subsaver-25.preview.emergentagent.com**
   - You'll see a QR code on the webpage
   - In Expo Go app, tap "Scan QR Code"
   - Point your camera at the QR code
   - App will start loading!

### **Method 2: Direct URL** (If QR doesn't work)

1. Open Expo Go app
2. Tap on "Enter URL manually"
3. Enter: `exp://subsaver-25.preview.emergentagent.com`
4. Tap "Connect"

### **Method 3: Development URL**

If you're on the same WiFi network:
```
exp://192.168.x.x:3000
```
(Replace x.x with your local IP)

---

## ❌ **Common Issues & Solutions**

### **Issue 1: "Unable to connect to development server"**

**Solutions:**
1. **Check WiFi Connection**
   - Make sure iPhone and development server are on the same network
   - OR use the tunnel URL (subsaver-25.preview.emergentagent.com)

2. **Restart Expo Go**
   - Close Expo Go completely (swipe up from app switcher)
   - Reopen Expo Go
   - Try scanning QR again

3. **Clear Expo Go Cache**
   - In Expo Go: Go to Profile tab
   - Scroll down and tap "Clear cache"
   - Try loading app again

### **Issue 2: "Something went wrong" or Red Error Screen**

**Solutions:**
1. **Check if tunnel is running**
   ```bash
   # On server
   sudo supervisorctl status expo
   # Should show: RUNNING
   ```

2. **Restart Development Server**
   ```bash
   sudo supervisorctl restart expo
   ```

3. **Clear Metro Bundler Cache**
   ```bash
   cd /app/frontend
   rm -rf .expo
   yarn start --clear
   ```

### **Issue 3: QR Code Won't Scan**

**Solutions:**
1. **Use Manual URL Entry** (Method 2 above)

2. **Check Camera Permissions**
   - iOS Settings → Expo Go → Camera → Enable

3. **Use Web QR Scanner**
   - Open https://subsaver-25.preview.emergentagent.com
   - Screenshot the QR code
   - Use another QR scanner app

### **Issue 4: App Loads but Shows White Screen**

**Solutions:**
1. **Check Logs in Expo Go**
   - Shake your device to open dev menu
   - Tap "Show Error Logs"

2. **Reload App**
   - Shake device → Tap "Reload"
   - OR close app and reopen

3. **Check Backend Connection**
   - Make sure backend is running
   - URL: https://subsaver-25.preview.emergentagent.com/api/templates
   - Should return JSON data

### **Issue 5: "Network request failed"**

**Solutions:**
1. **Check Internet Connection**
   - Make sure iPhone has internet access
   - Try opening Safari and loading a website

2. **VPN Issues**
   - Disable VPN if you're using one
   - Some VPNs block Expo tunnel connections

3. **Check Backend Status**
   ```bash
   curl https://subsaver-25.preview.emergentagent.com/api/templates
   ```

---

## 🔍 **Debugging Tools**

### **In Expo Go App:**

1. **Open Developer Menu**
   - Shake your iPhone
   - OR: Three finger tap (if shake doesn't work)

2. **Available Options:**
   - **Reload** - Refresh the app
   - **Enable Fast Refresh** - Auto-reload on save
   - **Enable Performance Monitor** - See FPS and memory
   - **Show Element Inspector** - Inspect UI elements
   - **Debug Remote JS** - Open browser debugger

### **Check App Status:**

```bash
# Check Expo service
sudo supervisorctl status expo

# View Expo logs
tail -f /var/log/supervisor/expo.out.log

# View error logs
tail -f /var/log/supervisor/expo.err.log

# Check if bundle is building
curl http://localhost:3000
```

---

## ✅ **Verification Checklist**

Before trying to open in Expo Go:

- [ ] Expo Go app installed on iPhone
- [ ] iPhone has internet connection
- [ ] Expo service is running (check server)
- [ ] QR code is visible at https://subsaver-25.preview.emergentagent.com
- [ ] No VPN blocking connections
- [ ] Camera permissions enabled for Expo Go

---

## 🎯 **Step-by-Step Troubleshooting**

If app won't load, try in this order:

1. **Restart Expo Go app** (close completely and reopen)
2. **Clear Expo Go cache** (in app settings)
3. **Restart your iPhone** (sometimes helps with network issues)
4. **Try manual URL entry** instead of QR scan
5. **Check server status** (contact developer)
6. **Try different network** (mobile data vs WiFi)

---

## 📱 **Device-Specific Tips**

### **iPhone Tips:**
- Make sure iOS is updated (iOS 13+)
- Enable "Allow Apps to Access Camera" in Privacy settings
- Disable "Low Power Mode" if enabled (can block background processes)
- Check that date/time are set correctly

### **Network Requirements:**
- Stable internet connection (WiFi or 4G/5G)
- No firewall blocking port 3000
- No corporate network restrictions

---

## 🆘 **Still Not Working?**

### **Try Development Build (Advanced):**

If Expo Go continues to have issues, create a development build:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build for iOS (requires Apple Developer account)
eas build --profile development --platform ios

# After build completes, install on device
```

### **Contact Support:**

If nothing works, provide these details:
1. iPhone model and iOS version
2. Expo Go version
3. Error message screenshots
4. Network type (WiFi/Mobile)
5. Steps you've tried

---

## 📊 **App Information**

- **App Name:** Subscription Manager
- **Preview URL:** https://subsaver-25.preview.emergentagent.com
- **Expo URL:** exp://subsaver-25.preview.emergentagent.com
- **Port:** 3000
- **Platform:** Expo SDK 52

---

## ✨ **Success Indicators**

You'll know the app loaded successfully when you see:
- ✅ Splash screen with app icon
- ✅ Welcome screen OR Dashboard (if you were logged in)
- ✅ Bottom navigation with 3 tabs
- ✅ Purple color theme
- ✅ "Subscription Manager" in the header

---

## 🔄 **Quick Reference Commands**

```bash
# Check Expo status
sudo supervisorctl status expo

# Restart Expo
sudo supervisorctl restart expo

# View live logs
tail -f /var/log/supervisor/expo.out.log

# Check bundle
curl http://localhost:3000/node_modules/expo-router/entry.js

# Test backend
curl https://subsaver-25.preview.emergentagent.com/api/templates
```

---

**Last Updated:** February 4, 2026  
**Version:** 1.0  
**Support:** Check logs and follow troubleshooting steps above
