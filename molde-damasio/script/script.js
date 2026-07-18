const upload = document.getElementById("upload");
const zoomSlider = document.getElementById("zoom");
const downloadBtn = document.getElementById("download");
const overlay = document.getElementById("overlay");

const canvas = document.getElementById("preview");
const ctx = canvas.getContext("2d");

canvas.width = 810;
canvas.height = 761;

let image = null;

let scale = 1;
let posX = 0;
let posY = 0;

// -------------------
// TOUCH / MOUSE
// -------------------

let pointers = new Map();

let dragging = false;
let lastX = 0;
let lastY = 0;

let pinchStartDistance = 0;
let pinchStartScale = 1;

// -------------------
// DESENHO
// -------------------

function draw() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!image) return;

    ctx.drawImage(
        image,
        posX,
        posY,
        image.width * scale,
        image.height * scale
    );
}

// -------------------
// CARREGAR FOTO
// -------------------

upload.addEventListener("change", (e) => {

    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {

        const img = new Image();

        img.onload = () => {

            image = img;

            const scaleX = canvas.width / image.width;
            const scaleY = canvas.height / image.height;

            scale = Math.max(scaleX, scaleY);

            zoomSlider.value = scale;

            posX = (canvas.width - image.width * scale) / 2;
            posY = (canvas.height - image.height * scale) / 2;

            draw();
        };

        img.src = event.target.result;
    };

    reader.readAsDataURL(file);
});

// -------------------
// ZOOM SLIDER
// -------------------

zoomSlider.addEventListener("input", () => {

    if (!image) return;

    const newScale = parseFloat(zoomSlider.value);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    posX = centerX - ((centerX - posX) * newScale / scale);
    posY = centerY - ((centerY - posY) * newScale / scale);

    scale = newScale;

    draw();
});

// -------------------
// ZOOM MOUSE
// -------------------

canvas.addEventListener("wheel", (e) => {

    if (!image) return;

    e.preventDefault();

    const factor = e.deltaY > 0 ? 0.95 : 1.05;

    scale *= factor;

    scale = Math.max(0.3, Math.min(scale, 5));

    zoomSlider.value = scale;

    draw();

}, { passive: false });

// -------------------
// POINTER DOWN
// -------------------

canvas.addEventListener("pointerdown", (e) => {

    canvas.setPointerCapture(e.pointerId);

    pointers.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY
    });

    if (pointers.size === 1) {

        dragging = true;

        lastX = e.clientX;
        lastY = e.clientY;
    }

    if (pointers.size === 2) {

        const pts = [...pointers.values()];

        pinchStartDistance = Math.hypot(
            pts[0].x - pts[1].x,
            pts[0].y - pts[1].y
        );

        pinchStartScale = scale;
    }
});

// -------------------
// POINTER MOVE
// -------------------

canvas.addEventListener("pointermove", (e) => {

    if (!image) return;

    if (!pointers.has(e.pointerId)) return;

    pointers.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY
    });

    // ARRASTAR
    if (pointers.size === 1 && dragging) {

        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;

        posX += dx;
        posY += dy;

        lastX = e.clientX;
        lastY = e.clientY;

        draw();
    }

    // PINÇA
    if (pointers.size === 2) {

        const pts = [...pointers.values()];

        const currentDistance = Math.hypot(
            pts[0].x - pts[1].x,
            pts[0].y - pts[1].y
        );

        scale =
            pinchStartScale *
            (currentDistance / pinchStartDistance);

        scale = Math.max(0.3, Math.min(scale, 5));

        zoomSlider.value = scale;

        draw();
    }

});

// -------------------
// POINTER UP
// -------------------

function removePointer(e) {

    pointers.delete(e.pointerId);

    if (pointers.size < 2) {
        pinchStartDistance = 0;
    }

    if (pointers.size === 0) {
        dragging = false;
    }
}

canvas.addEventListener("pointerup", removePointer);
canvas.addEventListener("pointercancel", removePointer);
canvas.addEventListener("pointerleave", removePointer);

// -------------------
// DOWNLOAD
// -------------------

downloadBtn.addEventListener("click", () => {

    if (!image) {

        alert("Selecione uma foto primeiro.");

        return;
    }

    const finalCanvas = document.createElement("canvas");
    const finalCtx = finalCanvas.getContext("2d");

    finalCanvas.width = canvas.width;
    finalCanvas.height = canvas.height;

    finalCtx.drawImage(
        image,
        posX,
        posY,
        image.width * scale,
        image.height * scale
    );

    finalCtx.drawImage(
        overlay,
        0,
        0,
        finalCanvas.width,
        finalCanvas.height
    );

    const url = finalCanvas.toDataURL("image/png");

    const link = document.createElement("a");

    link.href = url;
    link.download = "arte-pronta.png";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
});