# Troubleshooting Guide

## Common Issues and Solutions

### Issue: Node.js v22+ Compatibility Error

**Error Message:**
```
Error: No such module: http_parser
```

**Cause:**
This project uses `react-scripts-ts` which is not compatible with Node.js v22 or higher. Node.js v22 removed the legacy `http_parser` module.

**Solution:**
Use Node.js v18 LTS or v20 LTS instead.

**Option 1: Install Node.js v20 LTS (Recommended)**
1. Uninstall current Node.js (or use NVM)
2. Download Node.js v20 LTS from: https://nodejs.org/
3. Install and restart your terminal
4. Run the setup script again

**Option 2: Use NVM for Windows (Best for developers)**
1. Install NVM for Windows: https://github.com/coreybutler/nvm-windows/releases
2. Open a new terminal and run:
   ```bash
   nvm install 20
   nvm use 20
   node --version  # Should show v20.x.x
   ```
3. Run the setup script again

---

### Issue: "node-sass" or "node-gyp" build errors

**Error Message:**
```
Error: Command failed: ... node-gyp rebuild ...
gyp ERR! configure error
```

**Solution:**
This project has been updated to use modern `sass` instead of `node-sass`. The issue occurs when you have old dependencies cached.

**Steps to fix:**
1. Delete the `node_modules` folder
2. Delete `yarn.lock` file (if it exists)
3. Run `yarn install` again

Or simply run the `setup-and-run.bat` file again - it will automatically detect and clean up old installations.

---

### Issue: Python-related errors during installation

**Error Message:**
```
gyp ERR! stack SyntaxError: Missing parentheses in call to 'print'
```

**Solution:**
The old `node-sass` package required Python 2.7. This project now uses modern `sass` which doesn't require Python at all.

Follow the steps above to clean and reinstall.

---

### Issue: Port 3000 is already in use

**Error Message:**
```
Something is already running on port 3000
```

**Solution:**
Another application is using port 3000. You can either:

1. **Stop the other application**
2. **Change the port** by creating/editing `.env` file:
   ```
   PORT=3001
   ```
3. **Kill the process** (Windows):
   ```bash
   netstat -ano | findstr :3000
   taskkill /PID <process_id> /F
   ```

---

### Issue: API calls not working / No live data

**Symptoms:**
- Stock prices not updating
- Console warnings about API keys

**Solution:**
1. Make sure you've created a `.env` file (copy from `.env.example`)
2. Add your API key:
   ```
   REACT_APP_FINNHUB_API_KEY=your_key_here
   REACT_APP_USE_LIVE_DATA=true
   ```
3. Restart the development server
4. Check browser console for error messages

Get free API keys:
- Finnhub: https://finnhub.io/register
- Alpha Vantage: https://www.alphavantage.co/support/#api-key

---

### Issue: Yarn command not found

**Error Message:**
```
'yarn' is not recognized as an internal or external command
```

**Solution:**
Install Yarn globally:
```bash
npm install -g yarn
```

Or use the batch file which will install it automatically.

---

### Issue: Module not found errors after updating

**Error Message:**
```
Module not found: Can't resolve 'node-sass-chokidar'
```

**Solution:**
Clear cache and reinstall:
```bash
yarn cache clean
rmdir /s /q node_modules
del yarn.lock
yarn install
```

---

### Issue: Browser doesn't open automatically

**Solution:**
Manually open your browser and navigate to:
```
http://localhost:3000
```

The development server is still running even if the browser doesn't open.

---

### Issue: CSS not compiling / Styles not loading

**Symptoms:**
- App loads but has no styling
- Console errors about missing CSS

**Solution:**
1. Stop the server (Ctrl+C)
2. Run: `yarn build-css`
3. Start again: `yarn start`

The watch-css process should compile SCSS files automatically.

---

## Need More Help?

1. Check the [Issues](https://github.com/stockmarkat/stockmarket-simulation/issues) page
2. Create a new issue with:
   - Your Node.js version (`node --version`)
   - Your operating system
   - Full error message
   - Steps you've already tried

## System Requirements

- **Node.js**: Version 12.x or higher (LTS recommended)
- **Operating System**: Windows, macOS, or Linux
- **RAM**: 4GB minimum
- **Disk Space**: 500MB for dependencies
