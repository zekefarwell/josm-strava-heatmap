

const heatmap_url = "tms[3,20]:https://heatmap-external-{switch:a,b,c}.strava.com/tiles-auth/all/purple/{zoom}/{x}/{y}.png";

async function getHeatmapUrl() 
{
    let pair = await getCookieValue('CloudFront-Key-Pair-Id');
    let policy = await getCookieValue('CloudFront-Policy');
    let signature = await getCookieValue('CloudFront-Signature');
    let custom_url = `${heatmap_url}?Key-Pair-Id=${pair}&Policy=${policy}&Signature=${signature}`;
    return custom_url
}

async function getCookieValue(name)
{
    let cookie = await browser.cookies.get({
        url: 'https://www.strava.com',
        name: name,
    });
    return cookie.value;
}

browser.runtime.onMessage.addListener(respond);

async function respond(message) {
    return getHeatmapUrl()
}
