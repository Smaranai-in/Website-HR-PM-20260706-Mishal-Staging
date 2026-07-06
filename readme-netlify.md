# SmaranAI Dual-SPA Netlify Deployment Guide

This guide explains how to build, combine, and deploy both the **User Portal** (serving from the root `/`) and the **Admin Dashboard** (serving from `/admin`) under the same domain name on a single Netlify site.

---

## 1. Project Directory Structure
*   `/User` - Intern/Student portal application (React).
*   `/Admin` - Supervisor/Administrator portal application (React).
*   `/package.json` - Root package config containing the sanity test suite.
*   `/run_tests.js` - Automated check script.

---

## 2. Prerequisites & Build Steps

To prepare both portals for deployment, compile them individually to optimize assets and configure routing basenames.

### A. Compile User Portal (Root `/`)
1. Navigate to the `User` folder:
   ```bash
   cd User
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Compile the production build:
   ```bash
   npm run build
   ```
   *Note: This creates the compiled files inside `User/build/`. It is compiled to run from the root `/` path (based on `"homepage": "/"` in `User/package.json` and `<Router basename="/">` in `User/src/App.js`).*

### B. Compile Admin Portal (Subpath `/admin`)
1. Navigate to the `Admin` folder:
   ```bash
   cd Admin
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Compile the production build:
   ```bash
   npm run build
   ```
   *Note: This creates the compiled files inside `Admin/build/`. It is compiled to run from the `/admin/` path (based on `"homepage": "/admin"` in `Admin/package.json` and `<Router basename="/admin">` in `Admin/src/App.js`).*

---

## 3. Unified Deployment Setup

To host both portals under the same Netlify URL, combine the built files and configure the rewrite rules.

### Step 1: Combine Build Directories
Create a subfolder named `admin` inside the compiled User build directory, and copy the Admin build contents into it:
1. Create directory:
   *   **Windows (PowerShell):** `New-Item -ItemType Directory -Force -Path User/build/admin`
   *   **macOS/Linux:** `mkdir -p User/build/admin`
2. Copy files:
   *   **Windows (PowerShell):** `Copy-Item -Path Admin/build/* -Destination User/build/admin/ -Recurse -Force`
   *   **macOS/Linux:** `cp -R Admin/build/* User/build/admin/`

### Step 2: Configure Netlify Rewrite Rules (`_redirects`)
Create or edit the `_redirects` file directly at the root of your unified build directory (`User/build/_redirects`) to contain the following routing rules:
```text
/admin/*    /admin/index.html   200
/*          /index.html         200
```
*This configuration tells Netlify's router to serve the Admin SPA index for any `/admin` path and redirect other page requests to the User SPA.*

### Step 3: Package the Build
Compress the **contents** of the `User/build/` directory into a zip file (making sure `index.html` is at the root of the archive):
*   **Windows/macOS/Linux (Recommended command):**
    ```bash
    tar -a -c -f combined_build.zip -C User/build/ .
    ```
*   This generates a clean deployment package named `combined_build.zip` in your root folder.

### Step 4: Deploy to Netlify
1. Go to the [Netlify App Dashboard](https://app.netlify.com/).
2. Drag-and-drop the **`combined_build.zip`** file directly into the Netlify manual deploy container.

---

## 4. Run Automated Sanity Checks

Before zipping and deploying, you can run the automated tests at the root of the project to check that compilation is intact and backend APIs are online:
```bash
npm test
```
This runs `run_tests.js` which verifies User compilation, Admin compilation, and live Supabase edge function status.

---

## ⚠️ Important Windows Zipping Note (By Antigravity)

When packaging the `combined_build.zip` on a Windows host, do not use the default PowerShell `Compress-Archive` cmdlet. `Compress-Archive` packages folder paths with backslash (`\`) separators, which are not recognized by Netlify's Linux-based servers. This causes the files to extract with backslashes in their filenames at the root level, causing JS requests to fall back to the index page and failing with:
`Uncaught SyntaxError: Unexpected token '<'`

### Correct Zipping Method in PowerShell:
Use a script that explicitly forces standard Unix forward-slash (`/`) directory separators for zip entries:
```powershell
[System.Reflection.Assembly]::LoadWithPartialName("System.IO.Compression.FileSystem") | Out-Null
$zipFile = [System.IO.Compression.ZipFile]::Open("combined_build.zip", "Create")
Get-ChildItem -Path "User/build" -Recurse | Where-Object { !$_.PSIsContainer } | ForEach-Object {
    $relative = $_.FullName.Substring((Get-Item "User/build").FullName.Length + 1)
    $zipPath = $relative.Replace("\", "/")
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zipFile, $_.FullName, $zipPath) | Out-Null
}
$zipFile.Dispose()
```

### MKM: either the folder netlify can be uploaded or the zip file. both works.
