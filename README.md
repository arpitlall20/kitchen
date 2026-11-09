# Kitchen Low-Stock Log — setup guide

The app lives on **GitHub Pages** (free web link your team opens on their phones).
The shared list lives in a **Google Sheet** you own. Setup takes about 15 minutes, once.

What's in this folder:

| File | Where it goes |
|---|---|
| `google-sheet/Code.gs` | Pasted into your Google Sheet (Part A) |
| `index.html`, `config.js`, `manifest.webmanifest`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` | Uploaded to GitHub (Part B) |

---

## Part A — the Google Sheet (the storeroom)

1. Go to **sheets.new** (signed in to your Google account). Name the sheet **Kitchen Stock**.
2. Menu **Extensions → Apps Script**. A code editor opens.
3. Delete everything in the editor, open `google-sheet/Code.gs` from this folder, copy all of it, paste it in. Click the **💾 Save** icon.
4. In the toolbar's function dropdown pick **setup**, then click **Run**.
   - Google asks for permission: **Review permissions** → choose your account.
   - You'll see "Google hasn't verified this app". That's normal for a script you wrote yourself: click **Advanced → Go to Kitchen Stock (unsafe)** → **Allow**.
   - Back in your Sheet you'll now have three tabs — **Items** (21 starter items), **Flags** and **Weeks**.
5. **Set your team PIN.** Click the ⚙️ **Project Settings** gear (left sidebar) → scroll to **Script Properties** → edit **TEAM_PIN** (it starts as `1234`) → Save.
6. **Publish the script.** Top right: **Deploy → New deployment** → click the ⚙️ next to "Select type" → **Web app**.
   - Description: `Kitchen stock`
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**, then **copy the Web app URL** (ends in `/exec`). Keep it handy.

## Part B — GitHub (the dining room)

1. Sign up / sign in at **github.com**.
2. Top right **+ → New repository**. Name: `kitchen-stock`. Choose **Public**. Click **Create repository**.
3. On the next page click **uploading an existing file**. Drag in these six files: `index.html`, `config.js`, `manifest.webmanifest`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`. Click **Commit changes**.
4. Click **config.js** in the file list → the ✏️ pencil (Edit). Replace `PASTE_YOUR_WEB_APP_URL_HERE` with the URL from Part A step 6 (keep the quotes). Click **Commit changes**.
5. **Turn on the website:** repository **Settings → Pages**. Under "Build and deployment", Source: **Deploy from a branch**, Branch: **main**, folder **/ (root)** → **Save**.
6. Wait a minute or two, refresh that page, and GitHub shows your link:
   `https://YOUR-USERNAME.github.io/kitchen-stock/`

## Part C — on everyone's phone

1. Open the link in **Safari** (iPhone) or **Chrome** (Android).
2. Enter the team PIN (asked once per phone).
3. Put it on the home screen:
   - iPhone: Share button → **Add to Home Screen**
   - Android: ⋮ menu → **Add to Home screen** / **Install app**

---

## Day to day

- **Daily check:** tick what's low today, − / + sets the order quantity.
- **Sunday order:** the week's list, adjustable, with **Copy order** / **Copy as CSV** and **Mark as ordered**. Use ‹ › at the top to look at past weeks.
- **Items:** add or remove products. You can also edit names, units or usual quantities directly in the **Items** tab of the Sheet.
- Phones refresh every 20 seconds, so everyone sees the same list.

## Good to know

- **Changing the PIN:** edit TEAM_PIN in Script Properties (Part A step 5). Every phone is asked for the new PIN next time it opens. Do this if a staff member leaves.
- **The GitHub page is public**, but it's only the app's code. Your stock data stays in your Google Sheet and needs the PIN.
- **If you ever change `Code.gs`:** Deploy → **Manage deployments** → ✏️ edit → Version: **New version** → Deploy. The URL stays the same, so `config.js` doesn't need changing.
- **"The Google Sheet returned an error"** in the app usually means `setup` wasn't run, or a tab was renamed. Tabs must stay named Items, Flags, Weeks.
