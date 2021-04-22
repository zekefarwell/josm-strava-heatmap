

const heatmap_url = "tms[3,20]:https://heatmap-external-{switch:a,b,c}.strava.com/tiles-auth/all/purple/{zoom}/{x}/{y}.png";

main();

async function main() 
{
    pair = await getCookieValue('CloudFront-Key-Pair-Id');
    policy = await getCookieValue('CloudFront-Policy');
    signature = await getCookieValue('CloudFront-Signature');
    custom_url = `${heatmap_url}?Key-Pair-Id=${pair}&Policy=${policy}&Signature=${signature}`;
    dom_node = document.getElementById('josm-url');
    dom_node.append(custom_url);
    navigator.clipboard.writeText(custom_url)
}

async function getCookieValue(name)
{
    cookie = await browser.cookies.get({
        url: 'https://www.strava.com',
        name: name,
    });
    return cookie.value;
}
