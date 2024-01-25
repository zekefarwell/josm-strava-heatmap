
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
                <h4 id="jsh-modal-header" class="modal-header"></h4>
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
    let ctrl_top_right = document.querySelector('.mapboxgl-ctrl-top-right');
    // Sometimes the mapbox controls aren't loaded right away and we need to wait a little bit
    for (let i = 0; ctrl_top_right === null && i < 10; i++) {
        await new Promise(r => setTimeout(r, 300));
        ctrl_top_right = document.querySelector('.mapboxgl-ctrl-top-right');
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
    ctrl_top_right.prepend(button);
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
                response.heatmap_url,
                response.map_color,
                response.map_type,
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
 * Set the HTML content of the modal after successfully building the heatmap url
 */
function setModalHtmlSuccess(heatmap_url, map_color, map_type)
{
    let title = `Strava Heatmap (${map_color}/${map_type})`;
    let encoded_heatmap_url = encodeURIComponent(heatmap_url);
    let open_in_josm_url = `http://127.0.0.1:8111/imagery?title=${title}&type=tms&max_zoom=15&url=${encoded_heatmap_url}`;
    let open_in_id_url = `https://www.openstreetmap.org/edit?editor=id#background=custom:${encoded_heatmap_url}`;
    let heatmap_url_tms = `tms:${heatmap_url}`;

    document.querySelector('#jsh-modal-header').textContent = "Open heatmap in OSM editor";
    document.querySelector('#jsh-modal-body').innerHTML = `
        <p>
            <a id="jsh-open-in-josm" href="" target="_blank" rel="noopener noreferrer" class="btn btn-default">
                Open in JOSM
            </a>
            <a id="jsh-open-in-id" href="" target="_blank" rel="noopener noreferrer" class="btn btn-default">
                Open in iD
            </a>
        </p>
        <p>Or, copy the URL to manually add a custom imagery layer in your editor of choice: </p>
        <div class="btn-group btn-group-sm" data-toggle="buttons">
            <label id="jsh-tms-prefix-true" class="btn btn-default active" data-tms-prefix="true">
                <input name="tms_prefix" type="radio" value="true">
                tms prefix
            </label>
            <label id="jsh-tms-prefix-false" class="btn btn-default" data-tms-prefix="false">
                <input name="tms_prefix" type="radio" value="false">
                no prefix
            </label>
        </div>
        <code>
            <button id="jsh-click-to-copy" class="copy-button btn btn-xs" aria-label="Copy to clipboard" title="Copy to clipboard">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000">
                    <path d="M0 0h24v24H0V0z" fill="none" />
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                </svg>
            </button>
            <pre id="jsh-imagery-url"></pre>
        </code>
    `;
    document.querySelector("#jsh-open-in-josm").setAttribute("href", open_in_josm_url);
    document.querySelector("#jsh-open-in-id").setAttribute("href", open_in_id_url);
    document.querySelector("#jsh-imagery-url").textContent = heatmap_url_tms;
    document.querySelector("#jsh-click-to-copy").addEventListener("click", copyUrlToClipboard);
    document.querySelector("#jsh-tms-prefix-true").addEventListener("click", function () {
        document.querySelector("#jsh-imagery-url").textContent = heatmap_url_tms;
    });
    document.querySelector("#jsh-tms-prefix-false").addEventListener("click", function () {
        document.querySelector("#jsh-imagery-url").textContent = heatmap_url;
    });
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
 * Event listener function to copy the heatmap url on click
 */
function copyUrlToClipboard()
{
    let heatmap_url_manual_copy = document.querySelector("#jsh-imagery-url").textContent;
    navigator.clipboard.writeText(heatmap_url_manual_copy);
}
