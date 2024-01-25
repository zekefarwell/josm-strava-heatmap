
const url_prefix = "https://heatmap-external-{switch:a,b,c}.strava.com/tiles-auth/";
const url_suffix = "/{zoom}/{x}/{y}.png"

async function getHeatmapUrl(tab_url, store_id)
{
    // Strava url format:  https://www.strava.com/maps/global-heatmap?style=dark&terrain=false&sport=Ride&gColor=blue    
    let strava_url = new URL(tab_url);

    // Attempt to set map type based on sport url parameter.
    // Walk and hike are the same as run. Default to 'all'.
    let sport = strava_url.searchParams.get('sport').toLowerCase();
    if  (sport == 'walk' || sport == 'hike') {
        sport = 'run';
    }
    let map_type;
    switch (sport) {
        case 'all':
        case 'ride':
        case 'run':
        case 'water':
        case 'winter':
            map_type = sport;
            break;
        default:
            map_type = 'all';
    }

    // Attempt to set map color based on gColor url parameter. Default to  'hot'.
    let gColor = strava_url.searchParams.get('gColor');
    let map_color;
    switch (gColor) {
        case 'hot':
        case 'blue':
        case 'purple':
        case 'gray':
        case 'bluered':
        case 'mobileblue':
            map_color = gColor;
            break;
        default:
            map_color = 'hot';
    }

    let pair = await getCookieValue('CloudFront-Key-Pair-Id', tab_url, store_id);
    let policy = await getCookieValue('CloudFront-Policy', tab_url, store_id);
    let signature = await getCookieValue('CloudFront-Signature', tab_url, store_id);
    let query_string = `?Key-Pair-Id=${pair}&Policy=${policy}&Signature=${signature}`

    let heatmap_url = url_prefix + map_type + '/' + map_color + url_suffix + query_string

    let error = (pair && policy && signature) ? false : true
    return { error, heatmap_url, map_color, map_type }
}

async function getCookieValue(name, url, store_id)
{
    let cookie = await browser.cookies.get({
        url: url,
        name: name,
        storeId: store_id
    });
    return (cookie) ? cookie.value : false
}

browser.runtime.onMessage.addListener(async function (message, sender, sendResponse) {
    return getHeatmapUrl(
        sender.tab.url,
        sender.tab.cookieStoreId
    )
});
