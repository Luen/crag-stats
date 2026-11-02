# Offline mode

Installing the PWA while connected, or opening an installed app, automatically downloads an offline copy. In a normal browser tab, open **Offline copy** in the footer and choose **Download or refresh copy**. This browser saves a read-only dashboard summary (ascents, successful ascents and metres climbed) and up to the latest 5,000 logbook rows. Search works within those downloaded rows. The page states how many rows were downloaded; it does not download every dashboard chart or other app page.

After downloading, the installed PWA can reopen without internet or access to your homeserver. Opening a page when the server is unavailable takes you to the offline viewer. You can also bookmark `/offline`. A currently open app's navigation may show a connection error; use its **Offline copy** footer link. Sync, Settings, editing, theCrag links and other pages require a connection. There is no offline logbook editor.

The viewer labels the saved time in UTC and always says it is a snapshot. The installed app checks on launch, reconnect and return to the foreground, and once a minute while visible. Downloads refresh when at least an hour old; failed automatic attempts wait at least five minutes before retrying. A new installation downloads immediately when connected. If the network is available but your homeserver is unreachable, the last usable copy is retained. The offline viewer also refreshes an existing copy when opened or reconnected.

Where supported and allowed by your browser, the installed app requests daily background updates, even when closed. The browser decides when these run based on connectivity, battery and app usage; they are not guaranteed. Browsers without periodic background sync refresh while the installed app is open. Leave the app connected long enough for its first download before heading offline.

## Privacy and retention

Installing the app enables local downloads, so only install or download on a device where you are comfortable keeping a local copy of publicly viewable climb names, dates, grades and partners. Private notes, raw provider data, credentials and Settings responses are never included. Normal app pages and their server data responses are never saved by the offline worker.

Whole-app password protection (`APP_PASSWORD` plus `AUTH_SCOPE=all`) disables data downloads, including for signed-in owners. The empty offline viewer remains accessible. This avoids retaining authenticated logbook pages that could bypass login. With an external access proxy, a browser download remains a local copy: clearing it is your responsibility before sharing the device.

Choose **Clear offline copy** to remove downloaded data and pause automatic downloads, including after restarting or updating the app. **Download or refresh copy** resumes them. Logout and app mutations such as Settings wipe also clear this browser's download and pause automatic downloads, including in-flight downloads and other open viewer tabs. Other browsers learn about a wipe, changed note visibility/grade preferences or whole-app protection when they next reach the server. A server cannot revoke a copy on a disconnected device immediately.

Downloads expire after seven days (and are removed when opened/checked). The download is limited to 10 MB. App updates remove copies saved by older worker builds; the installed app downloads a replacement while connected unless automatic downloads are paused. Your browser may evict storage earlier, especially in private browsing or under storage pressure. Clearing the browser's site data removes all offline assets and the pause preference too.

## Installation and support

Service workers need HTTPS or localhost. A plain HTTP LAN address cannot use offline mode; configure HTTPS for phone/home-network installs. Storage must be permitted by your browser. Some browsers, including iOS home-screen apps, only expose installation when the installed app is first opened; open it while connected to prepare its copy. Offline mode works in a supporting browser tab as well as an installed PWA.
