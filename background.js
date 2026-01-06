import browser from 'webextension-polyfill';

const browserApi = browser;
const url_prefix = "https://content-a.strava.com/identified/globalheat/";
const url_suffix = "/{zoom}/{x}/{y}.png"

/** @type {string[]} */
const required_cookie_names = [
    'CloudFront-Key-Pair-Id',
    'CloudFront-Policy',
    'CloudFront-Signature',
];

/** @type {string[]} */
const optional_cookie_names = [
    '_strava_idcf'
];

const all_cookie_names = [...required_cookie_names, ...optional_cookie_names];

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

    const cookie_entries = await Promise.all(
        all_cookie_names.map(async name => [
            name,
            await getCookieValue(name, tab_url, store_id)
        ])
    );
    const cookies = new Map(
        cookie_entries.filter(([_name, value]) => value !== null)
    );

    let heatmap_url = url_prefix + map_type + '/' + map_color + url_suffix;

    const hasRequiredCookies = required_cookie_names.every(name => cookies.has(name));

    return {
        error: !hasRequiredCookies,
        heatmap_url,
        map_color,
        map_type,
        cookies,
    };
}

async function getCookieValue(name, url, store_id)
{
    const details = { url, name };
    if (store_id) {
        details.storeId = store_id;
    }

    try {
        const cookie = await browserApi.cookies.get(details);
        return cookie ? cookie.value : null;
    } catch {
        return null;
    }
}

browserApi.runtime.onMessage.addListener(async function (_message, sender, _sendResponse) {
    return getHeatmapUrl(
        sender.tab.url,
        sender.tab.cookieStoreId
    )
});
