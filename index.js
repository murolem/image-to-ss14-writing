const shadeBlocks = ["░░", "▒▒", "▓▓", "██"];
// more and its starts wrapping in the game
const maxWidthPixels = 26;

// 1.8 times the limit size
const pixelsCountWarnThreshold = maxWidthPixels ** 2 * 1.8;

// 10 times the limit size
const pixelsCountErrorThreshold = maxWidthPixels ** 2 * 10;

// ===================

/** @type {HTMLInputElement} */
const imgInputHiddenEl = document.querySelector('#image-input-hidden');
assertNotNullish(imgInputHiddenEl, "img input el not found");

/** @type {HTMLCanvasElement} */
const sourceImgCanvas = document.querySelector('#source-image');
assertNotNullish(sourceImgCanvas, "source image canvas el not found");

/** @type {CanvasRenderingContext2D} */
const sourceImgCanvasCtx = sourceImgCanvas.getContext('2d');

/** @type {HTMLCanvasElement} */
const bbImageCanvas = document.querySelector('#bb-image');
assertNotNullish(bbImageCanvas, "bb image canvas el not found");

/** @type {CanvasRenderingContext2D} */
const bbImgCanvasCtx = bbImageCanvas.getContext('2d');

/** @type {HTMLTextAreaElement} */
const bbCodeOutputEl = document.querySelector('#bb-code');
assertNotNullish(bbCodeOutputEl, "bb code el not found");

/** @type {HTMLButtonElement} */
const copyBbCodeButton = document.querySelector('#copy-bbcode');
assertNotNullish(copyBbCodeButton, "copy bb code button el not found");

/** @type {HTMLCanvasElement} */
const hiddenBufferCanvasEl = document.querySelector('#hidden-buffer-canvas');
assertNotNullish(hiddenBufferCanvasEl, "hidden buffer canvas el not found");

/** @type {CanvasRenderingContext2D} */
const bufferCanvasCtx = hiddenBufferCanvasEl.getContext('2d', { willReadFrequently: true });

/** @type {HTMLDivElement} */
const imageDropEl = document.querySelector('#image-drop')
assertNotNullish(imageDropEl, "image drop el not found");

const imageDropElInnerLabel = document.querySelector('#image-drop-label2')
assertNotNullish(imageDropElInnerLabel, "image drop inner label el not found");

const alertsBoxEl = document.querySelector('#alerts-box')
assertNotNullish(alertsBoxEl, "alerts box el not found");

// =================

sourceImgCanvasCtx.imageSmoothingEnabled = false;
bbImgCanvasCtx.imageSmoothingEnabled = false;

bbImgCanvasCtx.fillStyle = 'black';
bbImgCanvasCtx.textAlign = 'center';
bbImgCanvasCtx.textBaseline = 'middle';

let lastAlertLevel = '';

// =========

imageDropEl.addEventListener('click', e => {
    imgInputHiddenEl.click();
});

imgInputHiddenEl.addEventListener('change', function (e) {
    clearAlert();

    const fileList = this.files ? [...this.files] : [];
    if (!fileList || !Array.isArray(fileList) || fileList.length === 0) {
        return;
    }

    /** @type {File} */
    const file = fileList[0];

    fileToImage(file)
        .then(tryWithImage);
});

imgInputHiddenEl.removeAttribute('disabled');

copyBbCodeButton.addEventListener('click', () => {
    copyBbCodeButton.classList.add('clicked');
    copyBbCodeButton.setAttribute('disabled', true);

    let elapsedSinceCopyStartedMs = performance.now();
    navigator.clipboard.writeText(bbCodeOutputEl.value)
        .then(() => {
            let tookMs = performance.now() - elapsedSinceCopyStartedMs;
            let waitForMs = clamp(300 - tookMs, 0, Infinity);

            setTimeout(() => {
                copyBbCodeButton.classList.remove('clicked');
                copyBbCodeButton.removeAttribute('disabled');
            }, waitForMs);
        })
        .catch(err => {
            alert("failed to copy, error in console");
            throw err;
        })
});

imageDropEl.addEventListener('dragenter', e => {
    imageDropEl.classList.add('drag-above')
});

imageDropEl.addEventListener('dragleave', e => {
    imageDropEl.classList.remove('drag-above')
});


imageDropEl.addEventListener('drop', e => {
    // Prevent default behavior (Prevent file from being opened)
    e.preventDefault();

    imageDropEl.classList.remove('drag-above')

    if (e.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        [...e.dataTransfer.items].forEach((item, i) => {
            // If dropped items aren't files, reject them
            if (item.kind === "file") {
                const file = item.getAsFile();
                fileToImage(file)
                    .then(tryWithImage);
            }
        });
    } else {
        // Use DataTransfer interface to access the file(s)
        [...e.dataTransfer.files].forEach((file, i) => {
            fileToImage(file)
                .then(tryWithImage);
        });
    }
});

imageDropEl.addEventListener('dragover', e => {
    e.preventDefault();
});

wavifyElement(imageDropElInnerLabel, 1.3, 5, 700, 600);

// ==================

/**
 * 
 * @param {HTMLImageElement} img 
 * @param {{ 
    * suppressTooWideAlert?: boolean, 
    * suppressPixelsCountThresholdExceededWarning?: boolean 
 * }?} params
 */
function tryWithImage(img, params = {}) {
    const pixelsCount = img.width * img.height;
    if (pixelsCount >= pixelsCountWarnThreshold && !params.suppressPixelsCountThresholdExceededWarning) {
        const continueButton = generateContinueButton(() => {
            tryWithImage(img, { suppressPixelsCountThresholdExceededWarning: true, suppressTooWideAlert: true });
            clearAlert();
        });

        const maxWidthLimitExceedFactor = pixelsCount / maxWidthPixels ** 2;
        const maxWidthLimitExceedFactorStr = roundToDigit(maxWidthLimitExceedFactor, 1);

        const howBigIsImageWording = pixelsCount >= pixelsCountErrorThreshold
            ? "super giga juicy big"
            : "pretty big";

        const areYouSureWording = pixelsCount >= pixelsCountErrorThreshold
            ? "Are you totally sure you want to continue? It's gonna take <b>a while</b> to process."
            : "Want to continue? It's gonna take a bit of time to process.";

        const icon = pixelsCount >= pixelsCountErrorThreshold
            ? "./assets/shark-pink.png"
            : "./assets/shark-blue.png"

        const level = pixelsCount >= pixelsCountErrorThreshold
            ? "error"
            : "warn";

        setAlertDANGEROUSLY(level, `<b class="text-${level}">Warning:</b> the image you are trying to load is <b>${howBigIsImageWording}</b> (<b class="text-${level}">${maxWidthLimitExceedFactorStr}X</b> the width limit of <b>${maxWidthPixels}px x ${maxWidthPixels}px</b>). ${areYouSureWording} <img class="alert-img" src="${icon}"><br><br>`);
        alertsBoxEl.append(continueButton);

        return;
    } else if (img.width > maxWidthPixels && !params.suppressTooWideAlert) {
        const continueButton = generateContinueButton(() => {
            tryWithImage(img, { suppressTooWideAlert: true });
            clearAlert();
        });

        setAlertDANGEROUSLY("warn", `<b class="text-warn">Warning:</b> the image is <b>wider</b> than the limit of <b>${maxWidthPixels}px</b>. That means the image <b>will not fit</b> in the game's writing. Continue at your own risk <img class="alert-img" src="./assets/weh.png"><br><br>`);
        alertsBoxEl.append(continueButton);

        return;
    }

    drawImageToCanvas(sourceImgCanvasCtx, img);

    const { bb, bbPixels } = convertImageToBb(img);
    drawBbPixelsToCanvas(img, bbPixels, img);
    outputBbCode(bb);
}

function generateContinueButton(onClick) {
    const continueButton = document.createElement('button');
    continueButton.innerText = "Continue?";
    continueButton.classList.add('button');
    continueButton.addEventListener("click", onClick);

    return continueButton;

}

function setAlertDANGEROUSLY(level, alertTextDANGEROUSInnerHtml) {
    clearAlert();
    alertsBoxEl.innerHTML = alertTextDANGEROUSInnerHtml;
    alertsBoxEl.classList.add(level);

    lastAlertLevel = level;
}

function clearAlert() {
    alertsBoxEl.innerHTML = '';
    if (lastAlertLevel !== '') {
        alertsBoxEl.classList.remove(lastAlertLevel);
    }
}

function outputBbCode(bb) {
    bbCodeOutputEl.value = bb.join("");
}

/**
 * 
 * @param {HTMLImageElement} sourceImg
 * @param {BbPixels} bbPixels 
 */
function drawBbPixelsToCanvas(sourceImg, bbPixels) {
    const { canvasSize, size, offset } = calculateImageDrawingParams(bbImgCanvasCtx, sourceImg);

    bbImgCanvasCtx.clearRect(0, 0, canvasSize[0], canvasSize[1]);

    const pixelSize = size[0] / sourceImg.width;

    bbImgCanvasCtx.save();
    bbImgCanvasCtx.font = `bold ${pixelSize}px sans-serif`
    bbImgCanvasCtx.translate(offset[0], offset[1]);

    for (let i = 0; i < bbPixels.length; i++) {
        const { shadeBlockI, colHex } = bbPixels[i];
        if (colHex) {
            bbImgCanvasCtx.fillStyle = colHex;
        }

        const row = Math.floor(i / sourceImg.width);
        const col = i - row * sourceImg.width;

        const y = row * pixelSize + pixelSize / 2;
        const x = col * pixelSize + pixelSize / 2;

        bbImgCanvasCtx.fillText(shadeBlocks[shadeBlockI], x, y);
    }

    bbImgCanvasCtx.restore();
}

/**
 * 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {HTMLImageElement} image 
 */
function drawImageToCanvas(ctx, image) {
    const { canvasSize, size, offset } = calculateImageDrawingParams(ctx, image);

    ctx.clearRect(0, 0, canvasSize[0], canvasSize[1]);
    ctx.drawImage(image, offset[0], offset[1], size[0], size[1]);
}


/**
 * Calculates parameters needed to draw images on visible canvases centered and scaled up without crop.
 * @param {CanvasRenderingContext2D} ctx 
 * @param {HTMLImageElement} image 
 * @returns {{ canvasSize: [number, number], size: [number, number], offset: [number, number] }}
 */
function calculateImageDrawingParams(ctx, image) {
    const canvasW = ctx.canvas.width;
    const canvasH = ctx.canvas.width;

    const largestImgDim = Math.max(image.width, image.height);
    let imageW;
    let imageH;
    if (largestImgDim === image.width) {
        // width is scaled to fill canvas
        imageW = canvasW;
        // height aspect-ratio is kept
        imageH = image.height * (canvasW / image.width);
    } else {
        // height is scaled to fill canvas
        imageH = canvasH;
        // width aspect-ratio is kept
        imageW = image.width * (canvasH / image.height);
    }

    const imgOffsetHor = (canvasW - imageW) / 2;
    const imgOffsetVer = (canvasH - imageH) / 2;

    return {
        canvasSize: [canvasW, canvasH],
        size: [imageW, imageH],
        offset: [imgOffsetHor, imgOffsetVer]
    }
}

/**
 * Converts image to BB markup.
 * @param {HTMLImageElement} image 
 * @returns {{ bb: string[], bbPixels: BbPixels }}
 */
function convertImageToBb(image) {
    const canvasW = bufferCanvasCtx.canvas.width;
    const canvasH = bufferCanvasCtx.canvas.width;

    bufferCanvasCtx.clearRect(0, 0, canvasW, canvasH);
    bufferCanvasCtx.drawImage(image, 0, 0);

    const pixels = bufferCanvasCtx.getImageData(0, 0, image.width, image.height);

    // char + 4 color channels
    /** @type {BbPixels} */
    const outputCharsForCanvas = [];

    /** @type {string[]} */
    const outputBb = [];
    let lastColorRGBA = [0, 0, 0, 0];
    let lastColorHex = '#FFFFFFFF';

    for (let row = 0; row < pixels.height; row++) {
        for (let col = 0; col < pixels.width; col++) {
            const i = (row * pixels.width + col) * 4;
            const rgba = pixels.data.subarray(i, i + 4);
            const [r, g, b, a] = rgba;

            // color
            const isNewColor = !areVectorsEqual(lastColorRGBA, rgba);
            if (isNewColor) {
                lastColorRGBA = rgba;
                lastColorHex = rgbToHex(r, g, b);
                outputBb.push("[color=" + lastColorHex + "]");
            }

            // shade
            const shadeCharI = Math.round(a / 255 * (shadeBlocks.length - 1));
            const shadeChar = shadeBlocks[shadeCharI];
            outputBb.push(shadeChar);
            outputCharsForCanvas.push({
                shadeBlockI: shadeCharI,
                colHex: isNewColor ? lastColorHex : undefined
            });
        }

        outputBb.push("\n");
    }

    // closes last color tag
    outputBb.push("[/color]");

    return {
        bb: outputBb,
        bbPixels: outputCharsForCanvas
    }
}


function areVectorsEqual(vec1, vec2) {
    if (vec1.length !== vec2.length) {
        return false;
    }

    for (let i = 0; i < vec1.length; i++) {
        if (vec1[i] !== vec2[i]) {
            return false;
        }
    }

    return true;
}

// function imageToBbCode(image) {

// }

/**
 * 
 * @param {File} file 
 * @returns {Promise<HTMLImageElement>}
 */
async function fileToImage(file) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;

    return new Promise(resolve => {
        img.onload = () => resolve(img);
    });
}

// ==================

function rgbComponentToHex(c) {
    let hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + rgbComponentToHex(r) + rgbComponentToHex(g) + rgbComponentToHex(b);
}


function assertNotNullish(value, msg) {
    if (value === null || value == undefined) {
        throw new Error(msg ? msg : "value is null");
    }
}

function wavifyElement(el, freqSec, heightPx, additiveDelayMs) {
    let text = el.textContent;
    let resultingEls = [];
    for (const [i, char] of [...text].entries()) {
        const el = document.createElement('span');
        el.innerText = char;
        if (char === ' ') {
            // add a skip (s) class because customizing styles here breaks the space
            el.classList.add('s');
        }

        const offsetVerPx = randomInRange(0, heightPx / 2);
        const rotMax = Math.PI / 6;
        let rot1 = randomInRange(-rotMax / 2, rotMax / 2);
        const rot2 = randomInRange(-rotMax / 2, rotMax / 2);

        const keyframes = [
            {
                // top
                transform: `translate(0, ${-offsetVerPx}px) rotate(${rot1}rad)`,
            },
            {
                // bottom
                transform: `translate(0, ${offsetVerPx}px) rotate(${rot2}rad)`,
            }
        ];

        el.animate(keyframes, {
            iterations: Infinity,
            duration: freqSec * 1000,
            delay: -randomInRange(100, additiveDelayMs) * i,
            direction: 'alternate',
            easing: 'ease'
        })

        resultingEls.push(el);
    }

    el.innerHTML = '';
    el.classList.add('wavyfied');
    el.append(...resultingEls);
}

function randomInRange(from, to) {
    return from + Math.random() * (to - from);
}

function roundToDigit(value, digits) {
    const factor = Math.pow(10, digits);

    return Math.round(value * factor) / factor;
}

function clamp(value, rangeFrom, rangeTo) {
    return value < rangeFrom
        ? rangeFrom
        : value > rangeTo
            ? rangeTo
            : value;
}