import browser from 'webextension-polyfill';

// Constants
const URL_PREFIX = "https://content-a.strava.com/identified/globalheat/";
const URL_SUFFIX = "/{zoom}/{x}/{y}.png";

/** @type {string[]} */
const VALID_SPORT_TYPES = ['all', 'ride', 'run', 'water', 'winter'];

/** @type {string[]} */
const VALID_COLORS = ['hot', 'blue', 'purple', 'gray', 'bluered', 'mobileblue'];

/** @type {string[]} */
const REQUIRED_COOKIE_NAMES = [
    'CloudFront-Key-Pair-Id',
    'CloudFront-Policy',
    'CloudFront-Signature',
];

/** @type {string[]} */
const OPTIONAL_COOKIE_NAMES = [
    '_strava_idcf'
];

const ALL_COOKIE_NAMES = [...REQUIRED_COOKIE_NAMES, ...OPTIONAL_COOKIE_NAMES];

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
    const map_type = VALID_SPORT_TYPES.includes(sport) ? sport : 'all';

    // Attempt to set map color based on gColor url parameter. Default to 'hot'.
    const gColor = strava_url.searchParams.get('gColor');
    const map_color = VALID_COLORS.includes(gColor) ? gColor : 'hot';

    const cookie_entries = await Promise.all(
        ALL_COOKIE_NAMES.map(async name => [
            name,
            await getCookieValue(name, tab_url, store_id)
        ])
    );
    const cookies = new Map(
        cookie_entries.filter(([_name, value]) => value !== null)
    );

    const heatmap_url = URL_PREFIX + map_type + '/' + map_color + URL_SUFFIX;

    const hasRequiredCookies = REQUIRED_COOKIE_NAMES.every(name => cookies.has(name));

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
        const cookie = await browser.cookies.get(details);
        return cookie ? cookie.value : null;
    } catch {
        return null;
    }
}

browser.runtime.onMessage.addListener(async function (_message, sender, _sendResponse) {
    return getHeatmapUrl(
        sender.tab.url,
        sender.tab.cookieStoreId
    )
});
