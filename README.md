# Tuck

Tuck is a browser extension that saves groups of open tabs so you can close them and return later. It works with Chrome, Edge, and Brave. The same extension source can be converted for Safari on macOS.

## Features

- Save web tabs from the current window under a name
- Choose whether to close saved tabs
- Restore a session in a new window
- View, rename, search, and delete sessions
- Recover recent window snapshots saved automatically about every five minutes
- Keep sessions in local browser storage without an account

Tuck leaves pinned tabs open when closing a saved session. Browser settings pages, local files, and other restricted URLs are not saved. Tabs in private windows may depend on the browser's extension settings. Saving tabs does not preserve form contents, browsing history, or logged-in state.

## Requirements

- Chrome, Edge, or Brave on desktop, or Safari on macOS
- For Safari: a Mac with Xcode and its command-line tools
- Node.js 18 or newer to run the automated tests

## Install on Chrome, Edge, or Brave

1. Download this repository and extract it.
2. Open the browser's extension page: `chrome://extensions`, `edge://extensions`, or `brave://extensions`.
3. Turn on Developer mode.
4. Choose **Load unpacked** and select the `extension` folder.
5. Pin Tuck to the browser toolbar if you want quick access.

No dependency installation or build command is needed for Chromium.

## Install on Safari (macOS)

Safari requires a macOS app wrapper. On a Mac with Xcode installed, open Terminal in the project folder and run:

```sh
./scripts/package-safari.sh
```

The converter generates an Xcode project in `build/`. Open the generated project in Xcode, select your signing team if prompted, and run the macOS app. Follow its instructions to enable the extension in Safari Settings > Extensions. Allow access to tabs and websites when Safari asks.

Safari support uses Apple's converter and needs to be checked on a Mac. The Safari wrapper is generated locally rather than stored in this repository.

## Use

Click Tuck, then **Save current window**. Name the session and choose whether to close its tabs. Saved sessions can be restored, viewed, renamed, searched, or deleted. Open **Recovery** to see recent snapshots and restore one if needed.

Recovery snapshots are best-effort and depend on the browser running and allowing background extension work. They are not a replacement for browser history or backups.

## Tests

Run from the project root:

```sh
node --test tests/*.test.js
```

These tests cover session filtering, URL handling, and recovery history. To test the browser behavior, load the extension, save several ordinary web tabs, restore them, rename and delete a session, and try closing tabs after saving. Check Recovery after leaving the browser open for at least five minutes. Repeat on each supported browser.

## Troubleshooting

- **Extension won't load:** Select the `extension` folder, not the repository root.
- **A tab wasn't saved:** Browser settings, `file://` URLs, and other restricted pages are excluded.
- **Sessions are missing in another browser:** Data is stored separately in each browser. There is no cross-browser sync.
- **Safari converter isn't found:** Install Xcode, open it once to finish setup, and check that its command-line tools are selected.
- **Safari extension doesn't appear:** Run the generated macOS app from Xcode, then check Safari Settings > Extensions.

## Technologies

JavaScript, HTML, CSS, WebExtensions, Manifest V3, and Apple's Safari Web Extension converter.
