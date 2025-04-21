const url_prefix = "https://content-a.strava.com/identified/globalheat/";
const url_suffix = "/{zoom}/{x}/{y}.png"

/** @type {string[]} */
const cookie_names = [
    'CloudFront-Key-Pair-Id',
    'CloudFront-Policy',
    'CloudFront-Signature',
    '_strava_idcf'
];

async function getHeatmapUrl(tab_url, store_id)
{
    // Strava url format:  https://www.strava.com/maps/global-heatmap?style=dark&terrain=false&sport=Ride&gColor=blue    
    let strava_url = new URL(tab_url);

    // Attempt to set map type based on sport url parameter.
    // Walk and hike are the same as run. Default to 'all'.
    let sport = strava_url.searchParams.get('sport')?.toLowerCase() || 'all';
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


    const cookies = new Map(
        await Promise.all(
            cookie_names.map(async name => [
                name,
                await getCookieValue(name, tab_url, store_id)
            ]).filter(cookie => cookie[1] !== null)
        )
    );

    let heatmap_url = url_prefix + map_type + '/' + map_color + url_suffix;

    return {
        error: cookies.size !== cookie_names.length,
        heatmap_url,
        map_color,
        map_type,
        cookies,
    };
}

async function getCookieValue(name, url, store_id)
{
    let cookie = await browser.cookies.get({
        url: url,
        name: name,
        storeId: store_id
    });

    return (cookie) ? cookie.value : null;
}

browser.runtime.onMessage.addListener(async function (_message, sender, _sendResponse) {
    return getHeatmapUrl(
        sender.tab.url,
        sender.tab.cookieStoreId
    )
});
