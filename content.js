import browser from 'webextension-polyfill';

// Constants
const JOSM_IMAGERY_URL = 'http://127.0.0.1:8111/imagery';
const MAX_ZOOM = '15';

let button = null;

insertButton();

/**
 * Insert the overlay button into the Strava map controls
 */
async function insertButton()
{
    let ctrlTopRight = document.querySelector('.mapboxgl-ctrl-top-right');
    // Sometimes the mapbox controls aren't loaded right away and we need to wait a little bit
    for (let i = 0; ctrlTopRight === null && i < 10; i++) {
        await new Promise(r => setTimeout(r, 300));
        ctrlTopRight = document.querySelector('.mapboxgl-ctrl-top-right');
    }
    if (ctrlTopRight === null) {
        console.warn('Could not find .mapboxgl-ctrl-top-right element after 10 attempts');
        return;
    }
    button = document.createElement('button');
    button.className = 'jsh-button';
    button.title = 'Open heatmap in JOSM';
    button.innerHTML = `
        <svg class="icon-default" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 48 48" fill-rule="evenodd" clip-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2">
            <defs>
                <linearGradient id="a">
                    <stop offset="0"/>
                    <stop offset=".5" stop-color="#f50"/>
                    <stop offset="1" stop-opacity=".9"/>
                </linearGradient>
                <linearGradient xlink:href="#a" id="b" x1="43.8" y1="43.4" x2="4.7" y2="5.5" gradientUnits="userSpaceOnUse"/>
            </defs>
            <path d="M46 32.8H32.8V46H46zm-30.8 0H2V46h13.2zm15.4 0H17.4V46h13.2zm0-15.4H17.4v13.2h13.2zm-15.4 0H2v13.2h13.2zm30.8 0H32.8v13.2H46zM15.2 2H2v13.2h13.2zM46 2H32.8v13.2H46zM30.6 2H17.4v13.2h13.2z" fill="url(#b)"/>
        </svg>
        <svg class="icon-success" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="22" fill="#2e7d32"/>
            <path d="M20 34l-10-10 2.8-2.8L20 28.4l15.2-15.2L38 16z" fill="white"/>
        </svg>
        <svg class="icon-error" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="22" fill="#c62828"/>
            <path d="M14 16.8L16.8 14 24 21.2 31.2 14 34 16.8 26.8 24 34 31.2 31.2 34 24 26.8 16.8 34 14 31.2 21.2 24z" fill="white"/>
        </svg>
    `;
    ctrlTopRight.prepend(button);
    button.addEventListener('click', handleButtonClick);
    button.addEventListener('animationend', handleAnimationEnd);
}

/**
 * Handle button click - fetch heatmap URL and open in JOSM
 */
async function handleButtonClick()
{
    // Remove any existing status class
    button.classList.remove('jsh-success', 'jsh-error');
    // Force reflow to restart animation if clicking again
    void button.offsetWidth;

    button.disabled = true;

    try {
        const response = await browser.runtime.sendMessage({ name: 'getHeatmapUrl' });

        if (response.error) {
            console.error('Missing cookies:', response);
            button.classList.add('jsh-error');
            return;
        }

        const title = `Strava Heatmap (${response.mapColor}/${response.mapType})`;
        const josmUrl = buildJosmUrl(title, response.cookies, response.heatmapUrl);

        await fetch(josmUrl, { mode: 'no-cors' });
        button.classList.add('jsh-success');
    } catch (err) {
        console.error('JOSM remote control error:', err);
        button.classList.add('jsh-error');
    } finally {
        button.disabled = false;
    }
}

/**
 * Handle animation end - remove status class so animation can trigger again
 */
function handleAnimationEnd()
{
    button.classList.remove('jsh-success', 'jsh-error');
}

/**
 * Builds a JOSM URL for opening the heatmap as a TMS layer
 * @param {string} title - The title of the layer
 * @param {Array<[string, string]>} cookies - The cookies needed for authentication
 * @param {string} heatmapUrl - The heatmap URL
 * @returns {string} The complete JOSM URL
 */
function buildJosmUrl(title, cookies, heatmapUrl)
{
    const josmUrl = new URL(JOSM_IMAGERY_URL);
    const cookiesValue = cookies
        .filter(([_key, value]) => value !== null && value !== undefined)
        .map(([key, value]) => `${key}=${value}`)
        .join(';');
    josmUrl.searchParams.set('title', title);
    josmUrl.searchParams.set('type', 'tms');
    josmUrl.searchParams.set('max_zoom', MAX_ZOOM);
    josmUrl.searchParams.set('cookies', cookiesValue);
    josmUrl.searchParams.set('url', heatmapUrl);
    return josmUrl.toString();
}
