if (typeof importScripts != "undefined")
{
    importScripts("browser-polyfill.min.js");
}

const url_prefix = "https://heatmap-external-{switch:a,b,c}.strava.com/tiles-auth/";
const url_suffix = "/{zoom}/{x}/{y}.png"

async function getHeatmapUrl(map_color, map_type, tab_url, store_id)
{
    let pair = await getCookieValue('CloudFront-Key-Pair-Id', tab_url, store_id);
    let policy = await getCookieValue('CloudFront-Policy', tab_url, store_id);
    let signature = await getCookieValue('CloudFront-Signature', tab_url, store_id);
    let query_string = `?Key-Pair-Id=${pair}&Policy=${policy}&Signature=${signature}`

    let heatmap_url = url_prefix + map_type + '/' + map_color + url_suffix + query_string

    let error = (pair && policy && signature) ? false : true
    return { error, heatmap_url }
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
        message.map_color,
        message.map_type,
        sender.tab.url,
        sender.tab.cookieStoreId
    )
});
