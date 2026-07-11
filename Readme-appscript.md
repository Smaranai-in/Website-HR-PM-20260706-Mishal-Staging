# Google Apps Script Integration for SmaranAI

This document contains the Google Apps Script code used to handle form submissions in Google Sheets. It automatically generates a unique `ApplicationID`, constructs an automated candidate summary (`Summary-Auto`), and synchronizes the generated IDs back to the Supabase database.

## Trigger Setup
Create an **onFormSubmit** installable trigger in your Google Apps Script project bound to your Google Sheet:
- **Function to run:** `onFormSubmit`
- **Deployment:** `Head`
- **Event source:** `From spreadsheet`
- **Event type:** `On form submit`

---

## Code Implementation

```javascript
// 09.01.26 handles both ApplicationID and Summary-Auto - automatically upon form submission. 
// Needs Summary-Auto_backfill_2.gs

function onFormSubmit(e) {
  const sheet = e.range.getSheet();
  if (sheet.getName() !== 'Form responses 1') return;

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

  const dataEndCol = 38; // AL
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
```
