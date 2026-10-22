# JOSM Strava Heatmap

This browser extension makes it easy to use the [Strava Global Heatmap][1] in
[JOSM][2].

Accessing this imagery externally requires a set of key parameters that you obtain
by signing into the Strava website, copying the values from several cookies which 
must be included with imagery requests from JOSM in a custom header.  The keys expire 
frequently and the process must be repeated.  This extension gathers the url and cookie
values automatically so you can quickly open the imagery in JOSM.

This extension used to also allow for opening the imagery as a background in the iD Editor.
The cookie requirement for imagery access makes this no longer possible.  Thankfully 
[julcnx/strava-heatmap-extension][10] now extends the iD editor itself, 
adding the heatmap as an overlay.

OSM Wiki: [Using the Strava Heatmap][3]

[1]: https://www.strava.com/heatmap
[2]: https://josm.openstreetmap.de/ "Java OpenStreetMap Editor"
[3]: https://wiki.openstreetmap.org/wiki/Strava
[8]: https://www.openstreetmap.org
[10]: https://github.com/julcnx/strava-heatmap-extension

## Installation

Available as a [Firefox Add-On][4] or [Chrome extension][7].  The Chrome extension
should also work in Microsoft Edge and other Chromium based browsers.

## Instructions

1. Visit [strava.com/heatmap][5] and log in – sign up for a free account if you don't have one
2. *Optional* - Select the heatmap color and activity type you want to use
3. Click the button pictured below

<img src=screenshot.jpg width=640 alt="Screenshot of Strava Heatmap with button added"/>

4. Click the Open in JOSM button ([JOSM, Remote control][9] must be enabled)

<img src=screenshot2.jpg width=640 alt="Screenshot of modal dialog with heatmap url pattern and cookie header"/>

[9]: https://josm.openstreetmap.de/wiki/Help/Preferences/RemoteControl

### Adding the imagery to JOSM manually

If Remote Control isn't available or the Open in JOSM button doesn't work, you can add
the layer by hand using the URL pattern and cookie header shown in the dialog:

1. In JOSM, open Preferences (F12) → Imagery and click the **+TMS** button
2. Paste the URL pattern exactly as shown, starting with `https://` – do **not** add a
   `tms:` prefix, JOSM adds it for you
3. Set the maximum zoom level to **15** (the highest zoom Strava heatmaps support)
4. Under "Set custom HTTP headers", add a header named `Cookie` and paste the cookie
   header string as its value
5. Give the layer a name, click OK, and enable it from the Imagery menu

When the cookies expire, the tiles stop loading.  Get a fresh cookie header from the
extension and replace the value in the layer's settings (Preferences → Imagery, select
the layer, edit).  A recent version of JOSM is required for custom HTTP headers.

### Using the imagery in other applications

The raw URL pattern and cookie header strings are also exposed for other potential uses.  These can theoretically be used in any mapping application that supports adding a TMS imagery source with a custom cookie header like JOSM does.

[4]: https://addons.mozilla.org/en-US/firefox/addon/josm-strava-heatmap/
[5]: https://www.strava.com/heatmap
[7]: https://chrome.google.com/webstore/detail/josm-strava-heatmap/hicmfobjcbinceoeegookkgllpdgkcdc
