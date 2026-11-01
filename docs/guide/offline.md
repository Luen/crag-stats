# Offline mode

Open **Offline copy** in the footer while connected, then choose **Download or refresh copy**. This browser saves a read-only dashboard summary (ascents, successful ascents and metres climbed) and up to the latest 5,000 logbook rows. Search works within those downloaded rows. The page states how many rows were downloaded; it does not download every dashboard chart or other app page.

After downloading, the installed PWA can reopen without internet or access to your homeserver. Opening a page when the server is unavailable takes you to the offline viewer. You can also bookmark `/offline`. A currently open app's navigation may show a connection error; use its **Offline copy** footer link. Sync, Settings, editing, theCrag links and other pages require a connection. There is no offline logbook editor.

The viewer labels the saved time in UTC and always says it is a snapshot. When the browser reconnects while the viewer is open, an existing download is checked and refreshed. If the network is available but your homeserver is unreachable, use the saved copy and refresh later. Saving for the first time always needs the download button.

## Privacy and retention

Only download on a device where you are comfortable keeping a local copy of publicly viewable climb names, dates, grades and partners. Private notes, raw provider data, credentials and Settings responses are never included. Normal app pages and their server data responses are never saved by the offline worker.

Whole-app password protection (`APP_PASSWORD` plus `AUTH_SCOPE=all`) disables data downloads, including for signed-in owners. The empty offline viewer remains accessible. This avoids retaining authenticated logbook pages that could bypass login. With an external access proxy, a browser download remains a local copy: clearing it is your responsibility before sharing the device.

Choose **Clear offline copy** to remove downloaded data. Logout and app mutations such as Settings wipe also clear this browser's download, including in-flight downloads and other open viewer tabs. Other browsers learn about a wipe, changed note visibility/grade preferences or whole-app protection when they next reach the server. A server cannot revoke a copy on a disconnected device immediately.

Downloads expire after seven days (and are removed when opened/checked). The download is limited to 10 MB. App updates remove copies saved by older worker builds; download again after an update. Your browser may evict storage earlier, especially in private browsing or under storage pressure. Clearing the browser's site data removes all offline assets too.

## Installation and support

Service workers need HTTPS or localhost. A plain HTTP LAN address cannot use offline mode; configure HTTPS for phone/home-network installs. Storage must be permitted by your browser. Visit once while connected to prepare the app assets, then download before leaving. Offline mode works in a supporting browser tab as well as an installed PWA; standalone installation alone does not download the logbook.
