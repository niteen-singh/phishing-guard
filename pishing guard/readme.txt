How to Install and Run the “Real-Time Phishing Guard” Extension in Firefox

Follow these steps to load and test the extension in Firefox as a temporary (unpacked) add-on:

1. Prepare the Extension Folder

    Ensure all extension files (manifest.json, background.js, content.js, details.html, details.css, details.js, popup.html, popup.css, popup.js, icon assets, etc.) are located together in a single directory on your computer.

    Confirm that the extension folder’s root contains manifest.json.

2. Open Firefox’s Debugging Page

    Launch Firefox and enter about:debugging#/runtime/this-firefox in the address bar.

    Press Enter to open the “This Firefox” debugging panel.

3. Load the Temporary Add-on

    Click the “Load Temporary Add-on…” button.

    In the file chooser dialog, navigate to your extension’s directory and select the manifest.json file.

    Firefox will install the extension for your current session and display its details in the list of temporary add-ons.

4. Verify the Extension Is Active

    Look for the “Real-Time Phishing Guard” entry under the “Temporary Extensions” list.

    Ensure its status shows Enabled.

    You should see the extension’s toolbar icon next to the address bar (the default icon from icon.png).

5. Test the Extension

    Open or reload any HTTPS or HTTP webpage.

    The extension will automatically analyze the current tab’s URL and, if applicable, page signals (password fields, form actions, title brands).

    Click the extension’s toolbar icon to open the popup:
    – It will display the URL, risk level badge (Safe / Suspicious / High Risk), and a list of detected issues.
    – Click “Details” to open the full breakdown page implemented in details.html.

