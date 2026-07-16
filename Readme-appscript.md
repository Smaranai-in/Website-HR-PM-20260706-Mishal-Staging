# Google Sheets Integration (Secure Web App Sync) for SmaranAI

This document contains the Google Apps Script code used to handle internship application synchronizations. It supports two flows:
1. **Secure Web App Flow (Recommended):** Bypasses Google Forms entirely. The backend sends a POST request directly to this script deployed as a Web App, which writes the row, generates the ID, and returns it. This protects the form from public spam.
2. **Legacy Form Trigger Flow:** Handles standard Google Form submissions and triggers automatically using an spreadsheet trigger.

---

## Web App Deployment Setup
To deploy this script as a secure backend API endpoint:
1. Open your Google Sheet $\rightarrow$ **Extensions** $\rightarrow$ **Apps Script**.
2. Replace all code in `Code.gs` with the script below.
3. Click the blue **Deploy** button in the top right corner $\rightarrow$ **New deployment**.
4. Select **Web app** as the deployment type:
   * **Execute as:** `Me (your-google-account)`
   * **Who has access:** `Anyone` *(secure because the script validates the secret payload key)*
5. Click **Deploy** and copy the generated **Web app URL**.
6. Set this URL as the secret `GOOGLE_GSHEET_WEBAPP_URL` in your Supabase environment/vault secrets.

---

## Trigger Setup (For Legacy Form Trigger Flow only)
If you still use the Google Form directly, create an installable trigger:
* **Function to run:** `onFormSubmit`
* **Deployment:** `Head`
* **Event source:** `From spreadsheet`
* **Event type:** `On form submit`

---

## Code Implementation

```javascript
// doPost handles secure backend-to-backend submissions from Supabase Edge Function
function doPost(e) {
  try {
    var requestData = JSON.parse(e.postData.contents);
    var secret = requestData.secret;
    
    // Secure webhook key check
    if (secret !== "smaranai-gsheet-webhook-secret-2026") {
      return ContentService.createTextOutput(JSON.stringify({ error: "Unauthorized webhook key" }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    
    var action = requestData.action;
    if (action === "add_application") {
      var application = requestData.application;
      
      // Open the sheet (matches default sheet names)
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form responses 1");
      if (!sheet) {
        sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
      }
      
      // Get headers to match fields
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      
      // Build row values matching headers
      var row = [];
      for (var i = 0; i < headers.length; i++) {
        var header = headers[i];
        if (header === "Timestamp") {
          row.push(new Date());
        } else if (header === "ApplicationID") {
          row.push(""); // Will generate below
        } else {
          var fieldKey = getFieldKeyFromHeader(header);
          row.push(application[fieldKey] !== undefined ? application[fieldKey] : "");
        }
      }
      
      // Append row and get index
      sheet.appendRow(row);
      var newRowNum = sheet.getLastRow();
      
      // Generate ApplicationID
      var idColIdx = headers.indexOf("ApplicationID") + 1;
      var newID = "";
      if (idColIdx > 0) {
        var data = sheet.getRange(2, idColIdx, newRowNum - 2).getValues();
        var maxNum = 0;
        for (var j = 0; j < data.length; j++) {
          if (data[j][0]) {
            var num = parseInt(data[j][0].toString().replace("A", ""), 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
          }
        }
        newID = "A" + ("0000" + (maxNum + 1)).slice(-4);
        sheet.getRange(newRowNum, idColIdx).setValue(newID);
      }
      
      // Compute Summary-Auto
      var summaryColIndex = headers.indexOf('Summary-Auto') + 1;
      if (summaryColIndex > 0) {
        var dataEndCol = Math.min(38, sheet.getLastColumn()); 
        var rowVals = sheet.getRange(newRowNum, 1, 1, dataEndCol).getValues()[0];
        sheet.getRange(newRowNum, summaryColIndex).setValue(formatRow(headers, rowVals));
      }
      
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

// Maps spreadsheet headers to JSON object keys
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

// 09.01.26 handles both ApplicationID and Summary-Auto - automatically upon form submission. 
// Needs Summary-Auto_backfill_2.gs

function onFormSubmit(e) {
  const sheet = e.range.getSheet();
  const name = sheet.getName().toLowerCase();
  
  // Robust check: matches "Form Responses 1", "Form responses 1", "Form_Responses", or "Sheet1"
  if (!name.includes("form") && !name.includes("responses") && !name.includes("sheet")) return;

  handleApplicationId(e);
  handleSummaryAuto(e);
  syncGsheetIdToDb(e); // to sync with supabase
}

function handleApplicationId(e) {
  const sheet = e.range.getSheet();

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const col = headers.indexOf("ApplicationID") + 1;
  if (col === 0) return;

  const row = e.range.getRow();
  const cell = sheet.getRange(row, col);

  if (cell.getValue() !== "") return;

  const data = sheet.getRange(2, col, row - 2).getValues();
  let maxNum = 0;

  for (let i = 0; i < data.length; i++) {
    if (data[i][0]) {
      const num = parseInt(data[i][0].toString().replace("A", ""), 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  }

  const newID = "A" + ("0000" + (maxNum + 1)).slice(-4);
  cell.setValue(newID);
}

function handleSummaryAuto(e) {
  const sheet = e.range.getSheet();
  const row = e.range.getRow();

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const summaryColIndex = headers.indexOf('Summary-Auto') + 1;
  if (summaryColIndex < 1) return;

  const dataEndCol = Math.min(38, sheet.getLastColumn()); 
  const rowVals = sheet.getRange(row, 1, 1, dataEndCol).getValues()[0];

  sheet.getRange(row, summaryColIndex)
       .setValue(formatRow(headers, rowVals));
}

function syncGsheetIdToDb(e) { // sync the AID with supabase
  const sheet = e.range.getSheet();
  const row = e.range.getRow();
  
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  var emailColIdx = headers.indexOf("Email address") + 1;
  if (emailColIdx <= 0) {
    emailColIdx = headers.indexOf("Email Address") + 1;
  }
  if (emailColIdx <= 0) {
    emailColIdx = headers.indexOf("Email") + 1;
  }
  
  var idColIdx = headers.indexOf("ApplicationID") + 1;
  
  if (emailColIdx <= 0 || idColIdx <= 0) {
    Logger.log("Email or ApplicationID column not found in headers.(syncGsheetIdToDb)");
    return;
  }
  
  var email = sheet.getRange(row, emailColIdx).getValue();
  var gsheetId = sheet.getRange(row, idColIdx).getValue();
  
  if (!email || !gsheetId) {
    Logger.log("Email or ApplicationID value is missing (in syncGsheetIdToDb).");
    return;
  }
  
  var payload = {
    action: "sync_gsheet_id",
    email: String(email).trim(),
    gsheet_id: String(gsheetId).trim(),
    secret: "smaranai-gsheet-webhook-secret-2026"
  };
  
  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  var url = "https://uqkqewydjbqqiuezxnqk.supabase.co/functions/v1/w_edge";
  
  try {
    var response = UrlFetchApp.fetch(url, options);
    Logger.log("Response: " + response.getContentText());
  } catch (err) {
    Logger.log("Error: " + err.toString());
  }
}

function formatRow(headers, rowVals) {
  var summary = [];
  for (var i = 0; i < Math.min(headers.length, rowVals.length); i++) {
    if (headers[i] && rowVals[i] !== undefined && rowVals[i] !== null && rowVals[i] !== "") {
      summary.push(headers[i] + ": " + rowVals[i]);
    }
  }
  return summary.join("\n");
}
```
