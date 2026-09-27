/*
 * world.js — the exploration engine.
 *
 * The map is one big tilted plane built with CSS 3D transforms. This file owns
 * the camera (pan, zoom, rotation, tilt), builds the terrain and markers from
 * content.js, reveals sites as you get near them, and drives the dossier panel.
 */

(function () {
    'use strict';

    const RAD = Math.PI / 180;
    const root = document.documentElement;
    const vp = document.getElementById('viewport');
    const regionLayer = document.getElementById('regionLayer');
    const labelLayer = document.getElementById('labelLayer');
    const trailLayer = document.getElementById('trailLayer');
    const siteLayer = document.getElementById('siteLayer');
    const navEl = document.getElementById('regionNav');
    const minimap = document.getElementById('minimap');
    const minimapView = document.getElementById('minimapView');
    const dossier = document.getElementById('dossier');
    const legend = document.getElementById('legend');
    const intro = document.getElementById('intro');

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const STORAGE_KEY = 'kc-map-progress';

    const LIMITS = {
        x: [-2400, 2400],
        y: [-2000, 2300],
        zoom: [0.3, 1.7]
    };

    const OVERVIEW = { x: 0, y: 80, zoom: 0.42 };
    const TILT_MAP = 56;
    const TILT_FLAT = 6;

    const cam = { x: 0, y: 0, zoom: 0.55, spin: 0, tilt: TILT_MAP };
    let tween = null;
    let activeRegion = null;
    let openSite = null;
    let flat = false;
    /* Nothing is revealed by proximity until the visitor actually starts exploring. */
    let surveying = false;

    const regionById = new Map(REGIONS.map((r) => [r.id, r]));
    const hueFor = { basecamp: 200, contact: 210, projects: 172, experience: 202, service: 222, person: 262 };

    /* Sites get a DOM node plus a bit of runtime state. */
    const sites = SITES.map((data, index) => ({
        data,
        index,
        el: null,
        dot: null,
        found: false,
        read: false
    }));

    const progress = loadProgress();

    /* ------------------------------------------------------------- build */

    function buildTerrain() {
        REGIONS.forEach((region) => {
            const hue = hueFor[region.id] || 200;

            const disc = document.createElement('div');
            disc.className = 'region';
            disc.dataset.region = region.id;
            disc.style.setProperty('--x', region.x + 'px');
            disc.style.setProperty('--y', region.y + 'px');
            disc.style.setProperty('--r', region.r);
            disc.style.setProperty('--h', hue);
            if (region.coast) disc.style.setProperty('--coast', region.coast);
            if (region.rot != null) disc.style.setProperty('--rot', region.rot + 'deg');
            regionLayer.appendChild(disc);

            const name = document.createElement('div');
            name.className = 'region-name';
            name.dataset.region = region.id;
            name.style.setProperty('--x', region.x + 'px');
            name.style.setProperty('--y', (region.y - region.r * 0.88) + 'px');
            name.style.setProperty('--h', hue);
            name.innerHTML = escapeHtml(region.name) +
                (region.kicker ? '<small>' + escapeHtml(region.kicker) + '</small>' : '');
            labelLayer.appendChild(name);
        });

        PLATEAUS.forEach((p) => {
            const el = document.createElement('div');
            el.className = 'plateau';
            el.style.setProperty('--x', p.x + 'px');
            el.style.setProperty('--y', p.y + 'px');
            el.style.setProperty('--rx', p.rx);
            el.style.setProperty('--ry', p.ry);
            if (p.coast) el.style.setProperty('--coast', p.coast);
            if (p.rot != null) el.style.setProperty('--rot', p.rot + 'deg');
            regionLayer.appendChild(el);
        });

        GROUND_LABELS.forEach((label) => {
            const el = document.createElement('div');
            el.className = 'ground-label';
            el.style.setProperty('--x', label.x + 'px');
            el.style.setProperty('--y', label.y + 'px');
            el.style.setProperty('--size', label.size);
            el.textContent = label.text;
            labelLayer.appendChild(el);
        });

        TRAILS.forEach(([fromId, toId]) => {
            const a = regionById.get(fromId);
            const b = regionById.get(toId);
            if (!a || !b) return;
            appendTrail(a.x, a.y, b.x, b.y, false);
        });

        const siteById = new Map(SITES.map((s) => [s.id, s]));
        if (typeof SITE_TRAILS !== 'undefined') {
            SITE_TRAILS.forEach(([fromId, toId]) => {
                const a = siteById.get(fromId);
                const b = siteById.get(toId);
                if (!a || !b) return;
                appendTrail(a.x, a.y, b.x, b.y, true);
            });
        }
    }

    function appendTrail(x1, y1, x2, y2, local) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy);
        const el = document.createElement('div');
        el.className = 'trail' + (local ? ' is-local' : '');
        el.style.setProperty('--x', x1 + 'px');
        el.style.setProperty('--y', y1 + 'px');
        el.style.setProperty('--len', len);
        el.style.setProperty('--a', (Math.atan2(dy, dx) / RAD).toFixed(2) + 'deg');
        trailLayer.appendChild(el);
    }

    function buildSites() {
        sites.forEach((site) => {
            const d = site.data;
            const el = document.createElement('div');
            const pics = [d.image, d.image2].filter(Boolean);
            el.className = 'site' + (d.featured ? ' is-featured' : '') + (d.wide ? ' is-wide' : '') +
                (pics.length ? ' is-image' : '');
            el.dataset.site = d.id;
            el.style.setProperty('--x', d.x + 'px');
            el.style.setProperty('--y', d.y + 'px');
            el.style.setProperty('--z', (d.z || 100) + 'px');
            el.style.setProperty('--bob-dur', (6 + (site.index % 5) * 0.9).toFixed(1) + 's');
            el.style.setProperty('--bob-delay', ((site.index % 7) * 0.42).toFixed(2) + 's');
            const card =
                '<span class="site-card">' +
                    '<span class="site-code">' + escapeHtml(d.code) + '</span>' +
                    '<span class="site-title">' + escapeHtml(d.title) + '</span>' +
                    '<span class="site-short">' + escapeHtml(d.short) + '</span>' +
                    '<span class="site-open">Open site</span>' +
                '</span>';
            const face = pics.length
                ? '<span class="pin-flip">' +
                    '<span class="pin-front">' +
                        pics.map((src) => '<img class="pin-img" src="' + escapeHtml(src) + '" alt="" draggable="false" decoding="async">').join('') +
                    '</span>' +
                    '<span class="pin-back" aria-hidden="true"></span>' +
                  '</span>' + card
                : '<span class="site-stem"></span>' +
                  '<span class="site-dot"></span>' +
                  '<span class="site-ping" aria-hidden="true"></span>' + card;
            el.innerHTML =
                '<span class="site-anchor"></span>' +
                '<span class="site-base"></span>' +
                '<span class="site-lift"><span class="site-bob"><span class="site-face">' +
                    '<button type="button" class="site-hit" aria-label="' +
                        escapeHtml(d.title + ' — ' + d.short) + '">' +
                        face +
                    '</button>' +
                '</span></span></span>';

            site.el = el;
            site.anchor = el.querySelector('.site-anchor');
            site.btn = el.querySelector('.site-hit');
            siteLayer.appendChild(el);

            if (progress.read.includes(d.id)) {
                site.read = true;
                el.classList.add('is-read');
            }
            if (progress.found.includes(d.id)) {
                reveal(site, { restore: true, deferHud: true });
            }

            site.btn.addEventListener('click', () => {
                if (drag.moved) return;
                openDossier(site);
            });

            site.btn.addEventListener('focus', () => {
                reveal(site);
                if (site.btn.matches(':focus-visible')) travelToSite(site, 620);
            });
        });
    }

    function buildNav() {
        REGIONS.forEach((region) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.dataset.region = region.id;
            btn.innerHTML = escapeHtml(region.nav) + '<span class="nav-count"></span>';
            btn.addEventListener('click', () => travelToRegion(region.id));
            navEl.appendChild(btn);
        });
    }

    function buildMinimap() {
        REGIONS.forEach((region) => {
            const el = document.createElement('div');
            el.className = 'minimap-region';
            el.dataset.region = region.id;
            el.style.setProperty('--mx', pct(region.x, 'x'));
            el.style.setProperty('--my', pct(region.y, 'y'));
            el.style.setProperty('--rw', (region.r * 2 / (LIMITS.x[1] - LIMITS.x[0]) * 100).toFixed(2));
            el.style.setProperty('--rh', (region.r * 2 / (LIMITS.y[1] - LIMITS.y[0]) * 100).toFixed(2));
            el.style.setProperty('--h', hueFor[region.id] || 200);
            minimap.insertBefore(el, minimapView);
        });

        sites.forEach((site) => {
            const el = document.createElement('div');
            el.className = 'minimap-site';
            el.style.setProperty('--mx', pct(site.data.x, 'x'));
            el.style.setProperty('--my', pct(site.data.y, 'y'));
            site.dot = el;
            minimap.insertBefore(el, minimapView);
        });
    }

    function buildLegend() {
        const body = document.getElementById('legendBody');
        REGIONS.forEach((region) => {
            const group = sites.filter((s) => s.data.region === region.id);
            if (!group.length) return;

            const wrap = document.createElement('div');
            wrap.className = 'legend-group';
            const list = document.createElement('ul');

            group.forEach((site) => {
                const li = document.createElement('li');
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.innerHTML = escapeHtml(site.data.title) + '<small>' + escapeHtml(site.data.short) + '</small>';
                btn.addEventListener('click', () => {
                    closeLegend();
                    openDossier(site);
                });
                li.appendChild(btn);
                list.appendChild(li);
            });

            const heading = document.createElement('h3');
            heading.textContent = region.nav;
            wrap.appendChild(heading);
            wrap.appendChild(list);
            body.appendChild(wrap);
        });
    }

    /* ------------------------------------------------------------ camera */

    function apply() {
        setVar('--cam-x', cam.x.toFixed(2));
        setVar('--cam-y', cam.y.toFixed(2));
        setVar('--zoom', cam.zoom.toFixed(4));
        setVar('--spin', cam.spin.toFixed(2) + 'deg');
        setVar('--tilt', cam.tilt.toFixed(2) + 'deg');
        setVar('--stem', Math.max(Math.sin(cam.tilt * RAD), 0.06).toFixed(3));
        setVar('--inv', Math.pow(1 / cam.zoom, 0.65).toFixed(4));
        document.body.classList.toggle('is-far', cam.zoom < 0.52);
        surveyNearby();
        updateActiveRegion();
        updateReadouts();
        queueFacing();
    }

    const styleCache = {};

    function setVar(name, value) {
        if (styleCache[name] === value) return;
        styleCache[name] = value;
        root.style.setProperty(name, value);
    }

    let facingQueued = false;

    function queueFacing() {
        if (facingQueued) return;
        facingQueued = true;
        requestAnimationFrame(() => {
            facingQueued = false;
            updateFacing();
        });
    }

    /* World-space check. Measuring the pins with getBoundingClientRect on every
       drag frame forced a full layout of the 3D scene. */
    function pinOnScreen(site) {
        const s = cam.spin * RAD;
        const cos = Math.cos(s);
        const sin = Math.sin(s);
        const dx = site.data.x - cam.x;
        const dy = site.data.y - cam.y;
        const a = dx * cos - dy * sin;
        const b = dx * sin + dy * cos;
        const pad = 160;
        const halfW = window.innerWidth / 2 + pad;
        const halfH = window.innerHeight / 2 + pad;
        const cosT = Math.max(Math.cos(cam.tilt * RAD), 0.12);
        return Math.abs(a * cam.zoom) < halfW && Math.abs(b * cam.zoom * cosT) < halfH;
    }

    function updateFacing() {
        let changed = false;
        for (let i = 0; i < sites.length; i++) {
            const site = sites[i];
            if (!site.data.image) continue;
            const on = pinOnScreen(site);
            if (site.el.classList.contains('is-facing') !== on) {
                site.el.classList.toggle('is-facing', on);
            }
            if (on && reveal(site, { deferHud: true })) changed = true;
        }
        if (changed) {
            updateSurvey();
            saveProgress();
        }
    }

    function clampCam() {
        cam.x = clamp(cam.x, LIMITS.x[0], LIMITS.x[1]);
        cam.y = clamp(cam.y, LIMITS.y[0], LIMITS.y[1]);
        cam.zoom = clamp(cam.zoom, LIMITS.zoom[0], LIMITS.zoom[1]);
    }

    function flyTo(target, duration) {
        if (reduceMotion) {
            Object.assign(cam, target);
            clampCam();
            tween = null;
            apply();
            return;
        }
        const from = { x: cam.x, y: cam.y, zoom: cam.zoom, spin: cam.spin, tilt: cam.tilt };
        const to = Object.assign({}, from, target);
        tween = { from, to, start: performance.now(), duration: duration || 1100 };
        requestAnimationFrame(step);
    }

    function step(now) {
        if (!tween) return;
        const t = Math.min((now - tween.start) / tween.duration, 1);
        const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        Object.keys(tween.to).forEach((key) => {
            cam[key] = tween.from[key] + (tween.to[key] - tween.from[key]) * e;
        });
        clampCam();
        apply();
        if (t < 1) {
            requestAnimationFrame(step);
        } else {
            tween = null;
        }
    }

    /* Screen pixels -> world units, ignoring perspective (close enough to feel right). */
    function screenToWorldDelta(dx, dy) {
        const s = cam.spin * RAD;
        const a = dx / cam.zoom;
        const b = dy / (cam.zoom * Math.max(Math.cos(cam.tilt * RAD), 0.12));
        return {
            x: a * Math.cos(s) + b * Math.sin(s),
            y: -a * Math.sin(s) + b * Math.cos(s)
        };
    }

    function travelToRegion(id) {
        const region = regionById.get(id);
        if (!region) return;
        closeDossier();
        flyTo({ x: region.x, y: region.y, zoom: region.zoom }, 1250);
    }

    function travelToSite(site, duration) {
        const panelOffset = window.innerWidth > 860
            ? screenToWorldDelta(Math.min(window.innerWidth * 0.16, 230), -40)
            : screenToWorldDelta(0, -Math.min(window.innerHeight * 0.2, 190));
        const zoom = Math.max(cam.zoom, 0.95);
        flyTo({
            x: site.data.x + panelOffset.x,
            y: site.data.y + panelOffset.y,
            zoom: zoom
        }, duration || 950);
    }

    /* --------------------------------------------------------- discovery */

    function revealRadius() {
        return clamp(430 / cam.zoom, 380, 900);
    }

    function surveyNearby() {
        /* Zoomed out to survey altitude you can see terrain, not detail, so
           nothing new is uncovered until you drop back down into a region. */
        if (!surveying || cam.zoom < 0.48) return;
        const r = revealRadius();
        let changed = false;
        for (let i = 0; i < sites.length; i++) {
            const site = sites[i];
            if (site.found) continue;
            if (Math.hypot(site.data.x - cam.x, site.data.y - cam.y) < r) {
                if (reveal(site, { deferHud: true })) changed = true;
            }
        }
        if (changed) {
            updateSurvey();
            saveProgress();
        }
    }

    function reveal(site, options) {
        const opts = options || {};
        if (site.found) return false;
        site.found = true;
        site.el.classList.add('is-found');
        if (site.dot) site.dot.classList.add('is-found');
        if (!opts.restore && !reduceMotion) {
            site.el.classList.add('is-just-found');
            window.setTimeout(() => site.el.classList.remove('is-just-found'), 1200);
        }
        if (!opts.deferHud) {
            updateSurvey();
            saveProgress();
        }
        return true;
    }

    function updateSurvey() {
        const found = sites.filter((s) => s.found).length;
        document.getElementById('surveyCount').textContent = found + ' / ' + sites.length;
        document.getElementById('surveyBar').style.width = (found / sites.length * 100) + '%';

        navEl.querySelectorAll('button').forEach((btn) => {
            const group = sites.filter((s) => s.data.region === btn.dataset.region);
            const seen = group.filter((s) => s.found).length;
            const counter = btn.querySelector('.nav-count');
            if (counter) counter.textContent = seen + '/' + group.length;
        });
    }

    /* ---------------------------------------------------------- readouts */

    function updateActiveRegion() {
        let nearest = null;
        let best = Infinity;
        REGIONS.forEach((region) => {
            const d = Math.hypot(region.x - cam.x, region.y - cam.y);
            if (d < region.r * 1.05 && d < best) {
                best = d;
                nearest = region;
            }
        });
        const id = nearest ? nearest.id : null;
        if (id === activeRegion) return;
        activeRegion = id;

        navEl.querySelectorAll('button').forEach((b) => b.classList.toggle('is-active', b.dataset.region === id));
        document.querySelectorAll('.region, .region-name, .minimap-region').forEach((el) => {
            el.classList.toggle('is-active', el.dataset.region === id);
        });
        document.getElementById('regionReadout').textContent = nearest ? nearest.name : 'Open terrain';
    }

    let readoutAt = 0;

    function updateReadouts() {
        const now = performance.now();
        if (now - readoutAt < 100) return;
        readoutAt = now;
        document.getElementById('coordReadout').textContent = Math.round(cam.x) + ', ' + Math.round(cam.y);

        const w = (LIMITS.x[1] - LIMITS.x[0]);
        const h = (LIMITS.y[1] - LIMITS.y[0]);
        const viewW = window.innerWidth / cam.zoom;
        const viewH = window.innerHeight / (cam.zoom * Math.max(Math.cos(cam.tilt * RAD), 0.2));
        minimapView.style.left = pct(cam.x, 'x');
        minimapView.style.top = pct(cam.y, 'y');
        minimapView.style.width = clamp(viewW / w * 100, 6, 100) + '%';
        minimapView.style.height = clamp(viewH / h * 100, 6, 100) + '%';
        minimapView.style.transform = 'translate(-50%, -50%) rotate(' + cam.spin.toFixed(1) + 'deg)';
    }

    function pct(value, axis) {
        const range = axis === 'x' ? LIMITS.x : LIMITS.y;
        return clamp((value - range[0]) / (range[1] - range[0]) * 100, 0, 100).toFixed(2) + '%';
    }

    /* ----------------------------------------------------------- dossier */

    function openDossier(site) {
        reveal(site);
        if (openSite && openSite.el) openSite.el.classList.remove('is-open');
        openSite = site;
        site.el.classList.add('is-open');

        if (!site.read) {
            site.read = true;
            site.el.classList.add('is-read');
            saveProgress();
        }

        const d = site.data;
        const region = regionById.get(d.region);
        document.getElementById('dossierKind').textContent = d.kind;
        document.getElementById('dossierTitle').textContent = d.title;
        document.getElementById('dossierMeta').textContent =
            (region ? region.name + ' · ' : '') + (d.meta || []).join(' · ');
        document.getElementById('dossierBody').innerHTML = d.body;

        const image = document.getElementById('dossierImage');
        if (d.image) {
            image.src = d.image;
            image.hidden = false;
        } else {
            image.removeAttribute('src');
            image.hidden = true;
        }

        const tags = document.getElementById('dossierTags');
        tags.innerHTML = '';
        (d.tags || []).forEach((tag) => {
            const li = document.createElement('li');
            li.textContent = tag;
            tags.appendChild(li);
        });

        const actions = document.getElementById('dossierActions');
        actions.innerHTML = '';
        if (d.link) {
            const a = document.createElement('a');
            a.className = 'button-link';
            a.href = d.link.href;
            a.textContent = d.link.label;
            if (/^https?:/i.test(d.link.href)) {
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
            }
            actions.appendChild(a);
        }
        if (d.action) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'button-link';
            btn.textContent = d.action.label;
            btn.addEventListener('click', () => travelToRegion(d.action.target));
            actions.appendChild(btn);
        }

        const next = nextSite(site);
        const nextBtn = document.getElementById('dossierNext');
        nextBtn.textContent = next ? next.data.title : 'Back to overview';
        nextBtn.onclick = () => {
            if (next) {
                openDossier(next);
            } else {
                closeDossier();
                flyTo(OVERVIEW, 1300);
            }
        };

        dossier.hidden = false;
        dossier.scrollTop = 0;
        requestAnimationFrame(() => dossier.classList.add('is-open'));
        travelToSite(site);
        updateSurvey();
    }

    function closeDossier() {
        if (dossier.hidden) return;
        dossier.classList.remove('is-open');
        if (openSite && openSite.el) openSite.el.classList.remove('is-open');
        openSite = null;
        window.setTimeout(() => {
            if (!dossier.classList.contains('is-open')) dossier.hidden = true;
        }, 340);
    }

    /* Nearest unread site, so "keep exploring" always has somewhere to go. */
    function nextSite(from) {
        const pool = sites.filter((s) => s !== from && !s.read);
        const list = pool.length ? pool : sites.filter((s) => s !== from);
        let best = null;
        let bestDist = Infinity;
        list.forEach((s) => {
            const d = Math.hypot(s.data.x - from.data.x, s.data.y - from.data.y);
            if (d < bestDist) {
                bestDist = d;
                best = s;
            }
        });
        return best;
    }

    /* ------------------------------------------------------------ legend */

    function openLegend() {
        legend.hidden = false;
        requestAnimationFrame(() => legend.classList.add('is-open'));
    }

    function closeLegend() {
        legend.classList.remove('is-open');
        window.setTimeout(() => {
            if (!legend.classList.contains('is-open')) legend.hidden = true;
        }, 320);
    }

    /* ------------------------------------------------------ interaction */

    const drag = { active: false, moved: false, id: null, x: 0, y: 0 };
    const pointers = new Map();
    let pinchStart = null;

    vp.addEventListener('pointerdown', (e) => {
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (pointers.size === 2) {
            const [p1, p2] = [...pointers.values()];
            pinchStart = { dist: Math.hypot(p2.x - p1.x, p2.y - p1.y), zoom: cam.zoom };
            drag.active = false;
            return;
        }

        tween = null;
        drag.active = true;
        drag.moved = false;
        drag.id = e.pointerId;
        drag.x = e.clientX;
        drag.y = e.clientY;
    });

    vp.addEventListener('pointermove', (e) => {
        if (!pointers.has(e.pointerId)) return;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (pointers.size === 2 && pinchStart) {
            const [p1, p2] = [...pointers.values()];
            const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            cam.zoom = clamp(pinchStart.zoom * (dist / pinchStart.dist), LIMITS.zoom[0], LIMITS.zoom[1]);
            apply();
            return;
        }

        if (!drag.active || e.pointerId !== drag.id) return;
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        if (!drag.moved && Math.hypot(dx, dy) > 6) {
            drag.moved = true;
            vp.classList.add('is-dragging');
        }
        if (!drag.moved) return;

        const delta = screenToWorldDelta(dx, dy);
        cam.x -= delta.x;
        cam.y -= delta.y;
        drag.x = e.clientX;
        drag.y = e.clientY;
        clampCam();
        apply();
    });

    function endPointer(e) {
        pointers.delete(e.pointerId);
        if (pointers.size < 2) pinchStart = null;
        if (e.pointerId === drag.id) {
            drag.active = false;
            vp.classList.remove('is-dragging');
            /* Let the click handler read drag.moved, then reset it. */
            window.setTimeout(() => { drag.moved = false; }, 0);
        }
    }

    vp.addEventListener('pointerup', endPointer);
    vp.addEventListener('pointercancel', endPointer);
    vp.addEventListener('pointerleave', endPointer);

    vp.addEventListener('wheel', (e) => {
        e.preventDefault();
        tween = null;
        const rect = vp.getBoundingClientRect();
        const px = e.clientX - rect.left - rect.width / 2;
        const py = e.clientY - rect.top - rect.height / 2;
        const before = screenToWorldDelta(px, py);
        cam.zoom = clamp(cam.zoom * Math.exp(-e.deltaY * 0.0013), LIMITS.zoom[0], LIMITS.zoom[1]);
        const after = screenToWorldDelta(px, py);
        cam.x += before.x - after.x;
        cam.y += before.y - after.y;
        clampCam();
        apply();
    }, { passive: false });

    /* Tools */
    document.querySelectorAll('[data-tool]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const tool = btn.dataset.tool;
            if (tool === 'zoom-in') flyTo({ zoom: cam.zoom * 1.45 }, 420);
            if (tool === 'zoom-out') flyTo({ zoom: cam.zoom / 1.45 }, 420);
            if (tool === 'rotate') flyTo({ spin: cam.spin + 45 }, 700);
            if (tool === 'reset') {
                closeDossier();
                flyTo({ x: OVERVIEW.x, y: OVERVIEW.y, zoom: OVERVIEW.zoom, spin: 0 }, 1200);
            }
            if (tool === 'flatten') {
                flat = !flat;
                document.body.classList.toggle('is-flat', flat);
                btn.classList.toggle('is-active', flat);
                flyTo({ tilt: flat ? TILT_FLAT : TILT_MAP }, 800);
            }
        });
    });

    minimap.addEventListener('click', (e) => {
        const rect = minimap.getBoundingClientRect();
        const x = LIMITS.x[0] + (e.clientX - rect.left) / rect.width * (LIMITS.x[1] - LIMITS.x[0]);
        const y = LIMITS.y[0] + (e.clientY - rect.top) / rect.height * (LIMITS.y[1] - LIMITS.y[0]);
        flyTo({ x: x, y: y, zoom: Math.max(cam.zoom, 0.6) }, 900);
    });

    document.getElementById('dossierClose').addEventListener('click', closeDossier);
    document.getElementById('legendToggle').addEventListener('click', openLegend);
    document.getElementById('legendClose').addEventListener('click', closeLegend);
    legend.addEventListener('click', (e) => { if (e.target === legend) closeLegend(); });

    document.addEventListener('keydown', (e) => {
        const tag = document.activeElement ? document.activeElement.tagName : '';
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;

        if (e.key === 'Escape') {
            if (!legend.hidden) closeLegend();
            else closeDossier();
            return;
        }
        if (e.key === 'i' || e.key === 'I') {
            legend.hidden ? openLegend() : closeLegend();
            return;
        }

        const pan = 260 / cam.zoom;
        let handled = true;
        switch (e.key) {
            case 'ArrowUp': case 'w': case 'W': nudge(0, -pan); break;
            case 'ArrowDown': case 's': case 'S': nudge(0, pan); break;
            case 'ArrowLeft': case 'a': case 'A': nudge(-pan, 0); break;
            case 'ArrowRight': case 'd': case 'D': nudge(pan, 0); break;
            case '+': case '=': flyTo({ zoom: cam.zoom * 1.35 }, 340); break;
            case '-': case '_': flyTo({ zoom: cam.zoom / 1.35 }, 340); break;
            case 'q': case 'Q': flyTo({ spin: cam.spin - 45 }, 600); break;
            case 'e': case 'E': flyTo({ spin: cam.spin + 45 }, 600); break;
            case '0': flyTo({ x: OVERVIEW.x, y: OVERVIEW.y, zoom: OVERVIEW.zoom, spin: 0 }, 900); break;
            default: handled = false;
        }
        if (handled) e.preventDefault();
    });

    function nudge(dx, dy) {
        const s = cam.spin * RAD;
        flyTo({
            x: cam.x + dx * Math.cos(s) + dy * Math.sin(s),
            y: cam.y - dx * Math.sin(s) + dy * Math.cos(s)
        }, 420);
    }

    window.addEventListener('resize', updateReadouts);

    /* ---------------------------------------------------------- progress */

    function loadProgress() {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : null;
            return {
                found: Array.isArray(parsed && parsed.found) ? parsed.found : [],
                read: Array.isArray(parsed && parsed.read) ? parsed.read : []
            };
        } catch (err) {
            return { found: [], read: [] };
        }
    }

    function saveProgress() {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
                found: sites.filter((s) => s.found).map((s) => s.data.id),
                read: sites.filter((s) => s.read).map((s) => s.data.id)
            }));
        } catch (err) {
            /* Private browsing or storage disabled — progress just won't persist. */
        }
    }

    /* ------------------------------------------------------------ helpers */

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /* --------------------------------------------------------------- go */

    buildTerrain();
    buildSites();
    document.querySelectorAll('.pin-img').forEach((img) => {
        if (!img.complete) img.addEventListener('load', queueFacing);
    });
    buildNav();
    buildMinimap();
    buildLegend();
    updateSurvey();
    apply();

    let started = false;

    function start() {
        if (started) return;
        started = true;
        surveying = true;
        intro.classList.add('is-gone');
        flyTo({ x: 0, y: 0, zoom: 0.82 }, 1900);
        window.setTimeout(() => { intro.hidden = true; }, 800);
    }

    document.getElementById('introStart').addEventListener('click', start);
    intro.addEventListener('click', (e) => { if (e.target === intro) start(); });
})();
