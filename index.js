// Copyright 2022 Alexey Kutepov <reximkut@gmail.com>
// 
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
// 
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

let BACKGROUND_COLOR = "#181818";
let MARKER_COLOR = "#FF1818";
let MARKER_SIZE = 10;
let MIDDLE_COLOR = "#18FF18";
let MIDDLE_SIZE = 3;
let VERTS_COUNT = 3;
let VERTS_DIST = 100;
let EDGE_COLOR = "white";
let NORMAL_DIST = 30;
let NORMAL_COLOR = "#6060FF";

let app = document.getElementById("app");
let ctx = app.getContext("2d");

function markerHitbox(pos, size) {
    return {
        x: pos.x - size,
        y: pos.y - size,
        w: size*2,
        h: size*2,
    };
}

function putMarker(pos, size, color) {
    const rect = markerHitbox(pos, size);
    ctx.fillStyle = color;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

let verts = (() => {
    const angle = 2*Math.PI/VERTS_COUNT;
    const cx = app.width/2;
    const cy = app.height/2;

    const verts = [];
    for (let i = 0; i < VERTS_COUNT; ++i) {
        verts.push({
            x: cx + Math.cos(angle*i)*VERTS_DIST,
            y: cy + Math.sin(angle*i)*VERTS_DIST,
        });
    }

    return verts;
})();
let drag = null;

function rectContainsPoint(rect, pos) {
    return rect.x <= pos.x && pos.x < rect.x + rect.w &&
           rect.y <= pos.y && pos.y < rect.y + rect.h;
}

function vertAt(pos) {
    for (let i = 0; i < VERTS_COUNT; ++i) {
        const rect = markerHitbox(verts[i], MARKER_SIZE);
        if(rectContainsPoint(rect, pos)) {
            return i;
        }
    }
    return null;
}

const DIAGONAL_LINE = 0;
const VERTICAL_LINE = 1;

function linesIntersection(line1, line2)
{
    if (line1.type == DIAGONAL_LINE && line2.type == DIAGONAL_LINE) {
        const a1 = line1.a;
        const a2 = line2.a;
        const k1 = line1.k;
        const k2 = line2.k;
        if (a1 !== a2) {
            const x = (k2 - k1)/(a1 - a2);
            const y = a1*x + k1;
            return { x: x, y: y };
        } else {
            return null;
        }
    } else {
        // TODO: handle different kinds of lines
        return null;
    }
}

function renderState() {
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, app.width, app.height);

    for (let i = 0; i < VERTS_COUNT; ++i) {
        const j = (i + 1)%VERTS_COUNT;
        ctx.strokeStyle = EDGE_COLOR;
        ctx.beginPath();
        ctx.moveTo(verts[i].x, verts[i].y);
        ctx.lineTo(verts[j].x, verts[j].y);
        ctx.stroke();
    }

    for (const vert of verts) {
        putMarker(vert, MARKER_SIZE, MARKER_COLOR);
    }

    const middles = [];
    for (let i = 0; i < VERTS_COUNT; ++i) {
        const j = (i + 1)%VERTS_COUNT;
        const x = verts[j].x - verts[i].x;
        const y = verts[j].y - verts[i].y;
        middles.push({
            x: verts[i].x + x*0.5,
            y: verts[i].y + y*0.5,
        });
    }

    for (const mid of middles) {
        putMarker(mid, MIDDLE_SIZE, MIDDLE_COLOR);
    }

    const normals = [];
    for (let i = 0; i < VERTS_COUNT; ++i) {
        const x = middles[i].x - verts[i].x;
        const y = middles[i].y - verts[i].y;
        const d = Math.sqrt(x*x + y*y);
        normals.push({
            x: -y/d,
            y: x/d,
        });
    }

    const bisectors = [];
    for (let i = 0; i < VERTS_COUNT; ++i) {
        const x1 = middles[i].x;
        const y1 = middles[i].y;
        const x2 = middles[i].x + normals[i].x;
        const y2 = middles[i].y + normals[i].y;
        if (x2 != x1) {
            const a = (y2 - y1)/(x2 - x1);
            const k = y1 - a*x1;
            bisectors.push({
                type: DIAGONAL_LINE,
                a: a,
                k: k,
            });
        } else {
            bisectors.push({
                type: VERTICAL_LINE,
                x: x1,
            });
        }
    }

    for (let i = 0; i < VERTS_COUNT; ++i) {
        ctx.strokeStyle = NORMAL_COLOR;
        ctx.beginPath();
        switch (bisectors[i].type) {
            case DIAGONAL_LINE: {
                const a = bisectors[i].a;
                const k = bisectors[i].k;
                ctx.moveTo(0, a*0 + k);
                ctx.lineTo(app.width, a*app.width + k);
            } break;

            case VERTICAL_LINE: {
                const x1 = bisectors[i].x;
                ctx.moveTo(x1, 0);
                ctx.lineTo(x1, app.height);
            } break;

            default: {
                console.assert(false, "unreachable");
            }
        }
        ctx.stroke();
    }

    console.assert(VERTS_COUNT >= 2);
    const center = linesIntersection(bisectors[0], bisectors[1]);
    if (center !== null) {
        putMarker(center, 3, "#FFFF18");
        ctx.beginPath();
        const x = verts[0].x - center.x;
        const y = verts[0].y - center.y;
        const r = Math.sqrt(x*x + y*y);
        ctx.arc(center.x, center.y, r, 0, 2*Math.PI)
        ctx.stroke();
    }
}

 app.addEventListener("mousedown", (e) => {
    if (drag === null) {
        drag = vertAt({
            x: e.offsetX,
            y: e.offsetY,
        });
    }
});

app.addEventListener("touchstart", (e) => {
    if (drag === null) {
        const rect = app.getBoundingClientRect();
        drag = vertAt({
            x: e.touches[0].clientX - rect.x,
            y: e.touches[0].clientY - rect.y,
        });
    }
});

["mouseup", "touchend"].forEach((e) => {
    app.addEventListener(e, (e) => {
        drag = null;
    });
});

app.addEventListener("mousemove", (e) => {
    if (drag !== null) {
        verts[drag].x = e.offsetX;
        verts[drag].y = e.offsetY;
    }
});

app.addEventListener("touchmove", (e) => {
    if (drag !== null) {
        const rect = app.getBoundingClientRect();
        verts[drag].x = e.touches[0].clientX - rect.x;
        verts[drag].y = e.touches[0].clientY - rect.y;
    }
});

function loop() {
    renderState();
    window.requestAnimationFrame(loop);
}

window.requestAnimationFrame(loop);
