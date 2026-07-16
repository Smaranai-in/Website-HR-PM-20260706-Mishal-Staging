# Google Sheets Integration Guide (Secure Web App Sync)

This guide outlines how the SmaranAI website synchronizes candidate applications directly with the Google Sheet. It supports two parallel flows to ensure maximum flexibility and reliability.

---

## 🔄 Dual Integration Flows

1. **Secure Web App Flow (New / Primary):**
   * **How it works:** The website's frontend sends the application to the Supabase Edge Function (`w_edge`). The Edge Function securely sends a POST request directly to the Google Sheet's Apps Script Web App.
   * **Why it's better:** It bypasses public Google Forms entirely. This prevents public spam, keeps the Google Sheet secure, and guarantees immediate sync of the generated `ApplicationID` back to the database in a single request.
   
2. **Legacy Form Trigger Flow (Backup / Manual):**
   * **How it works:** Handles submissions submitted directly through the public Google Form itself, executing the logic automatically via a spreadsheet trigger.

---

## 🛠️ Step-by-Step Setup Guide

### Step 1: Append the Webhook Functions
You **do not need to delete or touch your existing code**. Simply open your spreadsheet script editor and append the new functions at the bottom.

1. Open your Google Sheet $\rightarrow$ **Extensions** $\rightarrow$ **Apps Script**.
2. Scroll to the very bottom of the script editor (`Code.gs`).
3. Copy the [New Code Block to Append](#-new-code-block-to-append) below and paste it at the bottom.
4. Press **Ctrl + S** (or click the floppy disk icon) to save.

### Step 2: Deploy the Web App
1. Click the blue **Deploy** button in the top-right corner $\rightarrow$ **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Configure the deployment settings:
   * **Description:** `SmaranAI Secure Sync Webhook`
   * **Execute as:** `Me (your-google-account)`
   * **Who has access:** `Anyone` *(Secure because requests must contain the secret key)*
4. Click **Deploy**.
5. When prompted, click **Authorize access** and select your account.
6. If Google shows a warning ("Google hasn't verified this app"):
   * Click **Advanced** (bottom left).
   * Click **Go to Untitled project (unsafe)**.
   * Click **Allow**.
7. Copy the generated **Web app URL** and send it to the developer to link to Supabase.

---

## 📦 New Code Block to Append

Paste this exact block of code at the very bottom of your script editor:

```javascript
// =======================================================
// PASTE THIS AT THE VERY BOTTOM OF YOUR SCRIPT
// =======================================================

function doPost(e) {
  try {
    var requestData = JSON.parse(e.postData.contents);
    var secret = requestData.secret;
    
    // Secure webhook authentication key
    if (secret !== "smaranai-gsheet-webhook-secret-2026") {
      return ContentService.createTextOutput(JSON.stringify({ error: "Unauthorized webhook key" }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    
    var action = requestData.action;
    if (action === "add_application") {
      var application = requestData.application;
      
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form responses 1");
      if (!sheet) {
        sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
      }

      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      
      var row = [];
      for (var i = 0; i < headers.length; i++) {
        var header = headers[i];
        if (header === "Timestamp") {
          row.push(new Date());
        } else if (header === "ApplicationID") {
          row.push(""); 
        } else {
          var fieldKey = getFieldKeyFromHeader(header);
          row.push(application[fieldKey] !== undefined ? application[fieldKey] : "");
        }
      }
      
      sheet.appendRow(row);
      var newRowNum = sheet.getLastRow();
      
      var idColIdx = headers.indexOf("ApplicationID") + 1;
      var newID = "";
      if (idColIdx > 0) {
        var maxNum = 0;
        if (newRowNum > 2) {
          var data = sheet.getRange(2, idColIdx, newRowNum - 2).getValues();
          for (var j = 0; j < data.length; j++) {
            if (data[j][0]) {
              var num = parseInt(data[j][0].toString().replace("A", ""), 10);
              if (!isNaN(num) && num > maxNum) maxNum = num;
            }
          }
        }
        newID = "A" + ("0000" + (maxNum + 1)).slice(-4);
        sheet.getRange(newRowNum, idColIdx).setValue(newID);
      }
      
      var summaryColIndex = headers.indexOf('Summary-Auto') + 1;
      if (summaryColIndex > 0) {
        var dataEndCol = Math.min(38, sheet.getLastColumn()); 
        var rowVals = sheet.getRange(newRowNum, 1, 1, dataEndCol).getValues()[0];
        sheet.getRange(newRowNum, summaryColIndex).setValue(formatRow(headers, rowVals));
      }
      
      // Return the new ID back to Supabase in the response payload
      return ContentService.createTextOutput(JSON.stringify({ success: true, gsheet_id: newID }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ error: "Unknown action" }))
                         .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

function getFieldKeyFromHeader(header) {
  var normalized = String(header).toLowerCase().trim().replace(/[^a-z0-9]/g, "");
  
  if (normalized.includes("fullname")) return "full_name";
  if (normalized === "email" || normalized.includes("emailaddress")) return "email";
  if (normalized.includes("phonenumber") || normalized === "phone") return "phone_number";
  if (normalized.includes("linkedin")) return "linkedin_profile";
  if (normalized.includes("nativestate") || normalized === "state" || normalized.includes("nativeof")) return "native_state";
  if (normalized.includes("currentlocation") || normalized.includes("countrystatecity")) return "country_state_city";
  if (normalized.includes("programtype")) return "program_type";
  if (normalized.includes("majorspecialization") || normalized === "branch") return "major_specialization";
  if (normalized.includes("graduationyear")) return "graduation_year";
  if (normalized.includes("university") || normalized.includes("institution")) return "university";
  if (normalized.includes("skills")) return "skills_description";
  if (normalized.includes("priorityrole") || normalized === "role") return "top_priority_role";
  if (normalized.includes("raterole") || normalized.includes("rating")) return "role_rating";
  if (normalized.includes("availability")) return "availability";
  if (normalized.includes("daystimings")) return "days_timings";
  if (normalized.includes("dateyoucanjoin") || normalized.includes("jointodate") || normalized.includes("availabletojoin")) return "available_to_join";
  if (normalized.includes("plantostay") || normalized.includes("durationstay") || normalized.includes("durationofstay")) return "duration_stay";
  if (normalized.includes("experience") || normalized.includes("exp")) return "experience_months";
  if (normalized.includes("stipend")) return "highest_stipend";
  if (normalized.includes("portfolio") || normalized.includes("website")) return "portfolio_url";
  if (normalized.includes("remarks") || normalized.includes("comments")) return "remarks";
  if (normalized.includes("howheard")) return "how_heard_about_us";
  if (normalized.includes("applyconfirmation") || normalized.includes("confirm")) return "apply_confirmation";
  if (normalized.includes("cv") || normalized.includes("resume")) return "cv_url";
  
  return String(header).toLowerCase().trim().replace(/[\s\-\_]+/g, "_");
}
```

---

## 🔍 Function Breakdowns & Descriptions

Here is a detailed explanation of what each function in the Apps Script project is responsible for:

### Webhook API Functions (New)
* **`doPost(e)`**  
  An HTTP POST handler that acts as a secure API endpoint. When the database edge function submits a payload containing a new application:
  1. Validates the `secret` key.
  2. Maps standard database keys to sheet columns dynamically.
  3. Appends the new application record as a row in the sheet.
  4. Generates a unique sequential `ApplicationID` (e.g. `A0042`).
  5. Assembles all columns to write a summary inside the `Summary-Auto` cell.
  6. Returns the generated ID back to the backend database instantly in the JSON response body.
  
* **`getFieldKeyFromHeader(header)`**  
  A mapping helper. It normalizes headers (e.g. `"Full Name"`, `"Email Address"`) by removing spaces and symbols to match the JSON keys sent by the backend.

### Legacy Form Trigger Functions (Existing)
* **`onFormSubmit(e)`**  
  Triggered automatically whenever a user manually submits the public Google Form. Calls `handleApplicationId`, `handleSummaryAuto`, and triggers the webhook back to Supabase.
  
* **`handleApplicationId(e)`**  
  Iterates through all existing entries in the Sheet to find the highest sequential number, then generates the next `ApplicationID` (e.g. `A0001`) and saves it to the row.
  
* **`handleSummaryAuto(e)`**  
  Retrieves all columns for the submitted row and compiles them into a single string formatted to display inside the `Summary-Auto` cell.
  
* **`syncGsheetIdToDb(e)`**  
  Fires a POST request back to Supabase Edge Function to update the synced `gsheet_id` matching the applicant's email address.
  
* **`formatRow(headers, rowVals)`**  
  Concatenates headers and their corresponding values into a multi-line string used for the automated summaries.
