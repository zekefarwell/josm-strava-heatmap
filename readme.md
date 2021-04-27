# JOSM Strava Heatmap

This browser extension adds a button to the [Strava Global Heatmap][1] that
copies the TMS imagery url for use in the [Java OpenStreetMap Editor][2] (JOSM).

Accessing this imagery externally requires a set of key parameters that you obtain
by signing into the Strava website, copying the values from several cookies, and
then assembling into a query string at the end of the url.  The keys expire after a
week or so at which point you must repeat the process.  This extension builds the
url for you which makes this weekly process a bit less annoying.  

OSM Wiki: [Using the Strava Heatmap][3]

[1]: https://www.strava.com/heatmap
[2]: https://josm.openstreetmap.de/
[3]: https://wiki.openstreetmap.org/wiki/Strava

## Instructions

1. Install the [Firefox Add-On][4] or [Chrome extension][7]
2. Visit [strava.com/heatmap][5] and log in – sign up for a free account if you don't have one *
3. Click the button pictured below to copy the TMS imagery url prepopulated with the required
   `Key-Pair-Id`, `Policy`, and `Signature` parameters
4. Add a new [JOSM imagery layer][6] called Strava Heatmap with the copied url (or update existing if you already have one)

![Screenshot of Strava Heatmap with button added](screenshot.png)

[4]: https://addons.mozilla.org/en-US/firefox/addon/josm-strava-heatmap/
[5]: https://www.strava.com/heatmap
[6]: https://josm.openstreetmap.de/wiki/Help/Preferences/Imagery#SelectedEntries
[7]: https://chrome.google.com/webstore/detail/josm-strava-heatmap/hicmfobjcbinceoeegookkgllpdgkcdc

With a slight modification this url can be used as a custom background image in iD as well.
For use in iD, remove `tms[3,20]:` from the beginning so it starts with `https://heatmap-external- ...`.
