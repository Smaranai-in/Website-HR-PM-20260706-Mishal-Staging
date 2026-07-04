# SmaranAI Testing Suite Guide

This guide explains how to run the automated sanity checks and the End-to-End (E2E) UI tests for the SmaranAI project.

---

## 1. Automated Sanity & API Test (`npm test`)

This is a lightweight sanity check that verifies the React build systems compile correctly and the live backend serverless API is responsive.

### How to Run:
1. Open the project root directory.
2. Run the test script:
   ```bash
   npm test
   ```

### What it does:
*   **User App Build Check:** Runs `npm run build` inside `/User` to check for frontend compile errors.
*   **Admin App Build Check:** Runs `npm run build` inside `/Admin` to check for frontend compile errors.
*   **Backend Health Check:** Makes a secure connection request to the live Deno Edge Function (`w_edge`) to verify it is online and responding.

---

## 2. Cypress End-to-End (E2E) UI Tests

Cypress is used to run browser-automated UI tests, simulating real candidate/admin logins and verifying page loads.

### Prerequisites:
Make sure both portals are running locally:
*   **User App** should be running on `http://localhost:3002`
*   **Admin App** should be running on `http://localhost:3001`

### Steps to Run:

1. **Install Cypress:**
   Open the root directory and install dependencies from `package.json`:
   ```bash
   npm install
   ```

2. **Open Cypress Interactive Runner:**
   To run the tests visually in a browser:
   ```bash
   npm run cypress:open
   ```
   *This opens the Cypress Test Runner app. Select "E2E Testing", choose your browser (Chrome/Edge), and click on `spec.cy.js` to run the tests.*

3. **Run Cypress Headlessly:**
   To run the tests directly in the terminal without opening a browser window:
   ```bash
   npm run cypress:run
   ```
