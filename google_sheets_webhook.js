/**
 * Google Apps Script Webhook for Aarav & Anaya RSVP Form
 * 
 * INSTRUCTIONS:
 * 1. Open Google Sheets (create a new blank spreadsheet).
 * 2. Set the sheet headers in Row 1:
 *    Column A: Timestamp
 *    Column B: Guest Name
 *    Column C: Phone Number
 *    Column D: Number of Guests
 *    Column E: Attendance (attending / declined)
 *    Column F: Food Preference
 *    Column G: Blessing / Message
 * 3. Go to the menu: Extensions -> Apps Script.
 * 4. Delete any code in the editor and paste this entire script.
 * 5. Click Save (floppy disk icon).
 * 6. Click Deploy -> New Deployment.
 * 7. Click Select Type (gear icon) -> Web App.
 * 8. Set the settings:
 *    - Description: RSVP Webhook
 *    - Execute As: Me (your-email)
 *    - Who has access: Anyone (This is critical to allow form POST submissions)
 * 9. Click Deploy.
 * 10. Copy the Web App URL returned (e.g. https://script.google.com/macros/s/.../exec).
 * 11. Open `app.js` in your project and assign this URL to `const GOOGLE_SHEET_WEBHOOK_URL`.
 */

function doPost(e) {
  try {
    // Parse the incoming JSON payload
    var data = JSON.parse(e.postData.contents);
    
    // Get the active spreadsheet and the first sheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Create timestamp
    var timestamp = new Date();
    
    // Map form properties to row columns
    var guestName = data.guest_name || "N/A";
    var phone = data.guest_phone || "N/A";
    var count = data.guest_count || "1";
    var attendance = data.attendance || "attending";
    var dietary = data.dietary || "veg";
    var message = data.message || "";
    
    // Append row
    sheet.appendRow([
      timestamp,
      guestName,
      phone,
      count,
      attendance,
      dietary,
      message
    ]);
    
    // Return standard success response with CORS headers
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "RSVP logged successfully"
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "POST");
    
  } catch (error) {
    // Return error log
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "POST");
  }
}

// Handle CORS Preflight OPTIONS requests
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
    .setHeader("Access-Control-Allow-Headers", "Content-Type");
}
