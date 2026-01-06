import browser from 'webextension-polyfill';

// Constants
const JOSM_IMAGERY_URL = 'http://127.0.0.1:8111/imagery';
const MAX_ZOOM = '15';

insertModalHtml();
insertButtonHtml();

/**
 * Insert HTML skeleton for modal dialog box.
 * To be filled with content when the user clicks the button to open.
 */
function insertModalHtml()
{
    document.body.insertAdjacentHTML('afterbegin', `
        <div id="jsh-modal" class="jsh-modal">
            <div id="jsh-modal-dialog" class="jsh-modal-dialog">
                <h4 id="jsh-modal-header" class="modal-header">Open heatmap in JOSM</h4>
                <div id="jsh-modal-body" class="modal-body"></div>
            </div>
        </div>
    `);
    document.querySelector('#jsh-modal').addEventListener("click", e => {
        e.target.classList.remove('active');
    })
}

/**
 * Insert HTML for modal toggle button
 */
async function insertButtonHtml()
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
    let button = document.createElement('button');
    button.className = 'jsh-modal-toggle';
    button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 48 48" fill-rule="evenodd" clip-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2">
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
    `;
    ctrlTopRight.prepend(button);
    button.addEventListener("click", openModalDialog);
}

/**
 * Event listener function to open the modal dialog box and populate its content.
 * If cookies are found, content will show the heatmap url and various actions.
 * If not found, the content will show an error message instead.
 */
async function openModalDialog(e)
{
    // Attempt to build the heatmap url from key pair, policy, and signature cookies
    try {
        let response = await browser.runtime.sendMessage({
            "name": "getHeatmapUrl",
        });
        if (response.error) {
            setModalHtmlError(
                "Error: missing cookies", 
                "One or more cookies not found - 'CloudFront-Key-Pair-Id', 'CloudFront-Policy', 'CloudFront-Signature'"
            );
        } else {
            setModalHtmlSuccess(
                response.heatmapUrl,
                response.mapColor,
                response.mapType,
                response.cookies,
            );
        }
    } catch(err) {
        console.log(err);
        setModalHtmlError("Unknown error", "Couldn't build url.  Check console for errors.");
    }

    // Open the modal now containing a success or failure message
    document.querySelector('#jsh-modal').classList.add('active');
}

/**
 * Builds a JOSM URL for opening the heatmap as a TMS layer
 * @param {string} title - The title of the layer
 * @param {Map<string, string>} cookies - The cookies needed for authentication
 * @param {string} heatmapUrl - The heatmap URL
 * @returns {string} The complete JOSM URL
 */
function buildJosmUrl(title, cookies, heatmapUrl)
{
    const josmUrl = new URL(JOSM_IMAGERY_URL);
    const cookiesValue = Array.from(
        cookies.entries(),
        ([key, value]) => `${key}=${value}`
    ).join(';');
    josmUrl.searchParams.set('title', title);
    josmUrl.searchParams.set('type', 'tms');
    josmUrl.searchParams.set('max_zoom', MAX_ZOOM); // the max zoom that Strava heatmaps support
    josmUrl.searchParams.set('cookies', cookiesValue);
    josmUrl.searchParams.set('url', heatmapUrl);
    return josmUrl.toString();
}

/**
 * Set the HTML content of the modal after successfully building the heatmap url
 */
function setModalHtmlSuccess(heatmapUrl, mapColor, mapType, cookies)
{
    let title = `Strava Heatmap (${mapColor}/${mapType})`;
    let openInJosmUrl = buildJosmUrl(title, cookies, heatmapUrl);

    document.querySelector('#jsh-modal-body').innerHTML = `
        <p>
            <button id="jsh-open-in-josm" class="btn btn-default">
                Open in JOSM
            </button>
            <span id="jsh-josm-status"></span>
        </p>
    `;
    document.querySelector("#jsh-open-in-josm").addEventListener("click", () => openInJosm(openInJosmUrl));
}

/**
 * Set the HTML content of the modal with an error message
 * after failure building the heatmap url
 */
function setModalHtmlError(header, body)
{
    document.querySelector('#jsh-modal-header').textContent = header;
    document.querySelector('#jsh-modal-body').textContent = body;
}

/**
 * Open the heatmap layer in JOSM via Remote Control
 * @param {string} josmUrl - The JOSM remote control URL
 */
async function openInJosm(josmUrl)
{
    const status = document.querySelector("#jsh-josm-status");
    const button = document.querySelector("#jsh-open-in-josm");

    button.disabled = true;
    status.textContent = "Adding layer...";
    status.className = "";

    try {
        // mode: 'no-cors' required because JOSM is HTTP and Strava is HTTPS
        // We can't read the response, but the request will still be made
        await fetch(josmUrl, { mode: 'no-cors' });
        status.textContent = "Layer added!";
        status.className = "jsh-status-success";
    } catch (err) {
        console.error('JOSM remote control error:', err);
        status.textContent = "Failed - is JOSM running?";
        status.className = "jsh-status-error";
    } finally {
        button.disabled = false;
    }
}
