// ─────────────────────────────────────────────────────────────────
//  FLAPPY PASSENGER — Complete Game Engine
//  Travel-mode themed stages: ✈ Plane → 🚂 Train → 🚌 Bus → 🚕 Cab
// ─────────────────────────────────────────────────────────────────
import { showFlightMiniMap, destroyFlightMiniMap } from '../mapFeature/mapController.js';

const cssLink = document.createElement('link');
cssLink.rel = 'stylesheet';
cssLink.href = 'flightGame/flightStyles.css';
document.head.appendChild(cssLink);

// ── Constants ────────────────────────────────────────────────────
const GRAVITY   = 0.48;
const LIFT      = -9;
const PIPE_W    = 55;
const PIPE_SPEED_BASE = 3.2;

// Travel modes — each unlocked as the score rises
const MODES = [
    { id: 'plane',  icon: '✈️',  label: 'Flight',    color: '#7ec8e3', gap: 210, speed: 3.2 },
    { id: 'train',  icon: '🚂',  label: 'Train',     color: '#a8e6cf', gap: 190, speed: 3.9 },
    { id: 'bus',    icon: '🚌',  label: 'Bus',       color: '#ffd3b6', gap: 175, speed: 4.5 },
    { id: 'cab',    icon: '🚕',  label: 'Taxi',      color: '#ffaaa5', gap: 160, speed: 5.2 },
];

// Per-destination sky gradient & backdrop
const DEST_THEME = {
    bali:     { sky: ['#ff6e7f', '#bfe9ff'], ground: '#3a7d44' },
    croatia:  { sky: ['#1e3c72', '#2a5298'], ground: '#1a472a' },
    maldives: { sky: ['#00b4db', '#0083b0'], ground: '#006994' },
};

// Progressive insights per destination
const INSIGHTS = {
    bali: [
        { score: 2,  icon: '🌴', title: 'Tropical Heaven',    body: '2M+ visitors annually. Best time: April–October.' },
        { score: 5,  icon: '📍', title: 'Hotspots',           body: 'Ubud & Uluwatu revealed on your live map. 🟢', action: 'green' },
        { score: 8,  icon: '⚠️', title: 'Caution Areas',      body: 'Mount Agung activity zone flagged. 🔴', action: 'red' },
        { score: 12, icon: '🧭', title: 'Local Tip',           body: 'Hire a local driver instead of tourist shuttles.' },
        { score: 16, icon: '💎', title: 'Hidden Gem',          body: 'Secret rice terraces of Jatiluwih — untouched.' },
    ],
    croatia: [
        { score: 2,  icon: '⛵', title: 'Adriatic Coast',      body: 'Top-rated European destination. 1.4M visitors yearly.' },
        { score: 5,  icon: '📍', title: 'Hotspots',            body: 'Dubrovnik & Split Old Town on your map. 🟢', action: 'green' },
        { score: 8,  icon: '⚠️', title: 'Seasonal Info',       body: 'Velebit Pass closed in winter. 🔴', action: 'red' },
        { score: 12, icon: '🧭', title: 'Travel Tip',           body: 'Island-hop via ferry for the real Dalmatian experience.' },
        { score: 16, icon: '💎', title: 'Hidden Gem',           body: 'Vis Island — far fewer tourists than Hvar.' },
    ],
    maldives: [
        { score: 2,  icon: '🪸', title: 'Ocean Paradise',      body: 'Avg. 1.7M visitors. Dry season: November–April.' },
        { score: 5,  icon: '📍', title: 'Hotspots',            body: 'Malé & Maafushi island displayed on map. 🟢', action: 'green' },
        { score: 8,  icon: '⚠️', title: 'Navigation Alert',    body: 'Southern uncharted reefs flagged on map. 🔴', action: 'red' },
        { score: 12, icon: '🧭', title: 'Local Tip',            body: 'Pick a local guesthouse over resort — 60% cheaper.' },
        { score: 16, icon: '💎', title: 'Hidden Gem',           body: 'Fuvahmulah — only place on Earth with tiger sharks + whale sharks.' },
    ],
};

// ── Engine ────────────────────────────────────────────────────────
class FlappyPassenger {
    constructor() {
        // State
        this.destId    = '';
        this.destTitle = '';
        this.active    = false;
        this.started   = false;
        this.paused    = false;
        this.score     = 0;
        this.highScore = 0;
        this.frameId   = null;
        this.modeIdx   = 0;
        this.triggeredInsights = new Set();

        // Physics
        this.player = { x: 120, y: 300, vY: 0, w: 46, h: 34 };
        this.pipes  = [];
        this.stars  = [];

        this._buildDOM();
        this._attachCardButtons();
    }

    // ── DOM ─────────────────────────────────────────────────────
    _buildDOM() {
        const html = `
        <div id="fp-overlay">
            <canvas id="fp-canvas"></canvas>

            <div id="fp-header">
                <span id="fp-dest-name">—</span>
                <div id="fp-score-box">
                    <div class="fp-stat">Score <strong id="fp-live-score">0</strong></div>
                    <div class="fp-stat">Best <strong id="fp-live-hs">0</strong></div>
                </div>
            </div>

            <button id="fp-close">×</button>

            <div id="fp-msg">
                <span class="fp-mode-icon" id="fp-mode-icon">✈️</span>
                <h2 id="fp-msg-title">Flappy Passenger</h2>
                <p id="fp-msg-body">Dodge the clouds. Unlock travel intel. Reach your destination.</p>
                <p id="fp-tap-hint">Tap / Click / Space to launch</p>
            </div>

            <div id="fp-insight-panel">
                <div class="fp-panel-title" id="fp-panel-dest">Destination</div>
                <div class="fp-panel-sub" id="fp-panel-sub">0 insights unlocked</div>
                <div id="fp-cards-container"></div>
                <div class="fp-mode-strip" id="fp-mode-strip">
                    ${MODES.map(m => `<span class="fp-mode-badge" id="mode-badge-${m.id}">${m.icon} ${m.label}</span>`).join('')}
                </div>
                <button id="fp-resume-btn">Resume ✈️</button>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);

        this.overlay   = document.getElementById('fp-overlay');
        this.canvas    = document.getElementById('fp-canvas');
        this.ctx       = this.canvas.getContext('2d');
        this.panel     = document.getElementById('fp-insight-panel');
        this.msgBox    = document.getElementById('fp-msg');

        document.getElementById('fp-close').addEventListener('click', () => this._close());
        document.getElementById('fp-resume-btn').addEventListener('click', () => this._resume());

        // Tap to flap
        this.canvas.addEventListener('mousedown', () => this._flap());
        this.canvas.addEventListener('touchstart', e => { e.preventDefault(); this._flap(); }, { passive: false });
        document.addEventListener('keydown', e => {
            if (e.code === 'Space' && this.active) { e.preventDefault(); this._flap(); }
        });

        window.addEventListener('resize', () => this._resize());
    }

    _attachCardButtons() {
        const DEST_SELECTORS = [
            'section[data-theme="bali"]',
            'section[data-theme="croatia"]',
            'section[data-theme="maldives"]',
        ];
        document.querySelectorAll(DEST_SELECTORS.join(',')).forEach(sec => {
            const destId    = sec.getAttribute('data-id');
            const destTitle = sec.querySelector('.location')?.innerText || destId;
            const actions   = sec.querySelector('.card-actions');
            if (!actions) return;

            // Prevent double inject
            if (actions.querySelector('.fp-play-btn')) return;

            // Restore any saved high-score badge
            const hs = +localStorage.getItem(`fp_hs_${destId}`) || 0;
            if (hs > 0) {
                const card = sec.querySelector('.interactive-card');
                let badge = document.createElement('div');
                badge.className = 'fp-hs-badge visible';
                badge.setAttribute('data-dest', destId);
                badge.innerText = `✈ Best: ${hs}`;
                card.appendChild(badge);
            }

            const btn = document.createElement('button');
            btn.className = 'pill-btn fp-play-btn';
            btn.innerHTML = `PLAY ✈️`;
            btn.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                this._open(destId, destTitle);
            });
            actions.appendChild(btn);
        });
    }

    // ── Open / Close ─────────────────────────────────────────────
    _open(destId, destTitle) {
        this.destId    = destId;
        this.destTitle = destTitle;
        this.highScore = +localStorage.getItem(`fp_hs_${destId}`) || 0;

        document.getElementById('fp-dest-name').innerText = destTitle;
        document.getElementById('fp-live-hs').innerText   = this.highScore;
        document.getElementById('fp-panel-dest').innerText = destTitle;
        document.body.style.overflow = 'hidden';

        this.overlay.classList.add('active');
        this._resize();
        this._resetGame();
        this.active = true;
        this._showMsg('✈️', 'Flappy Passenger', `Fly to <em>${destTitle}</em> — tap to flap, dodge the clouds!`, true);
        this._loop();
    }

    _close() {
        this.active = false;
        this.overlay.classList.remove('active');
        this.panel.classList.remove('open');
        document.body.style.overflow = '';
        cancelAnimationFrame(this.frameId);
        destroyFlightMiniMap();
        // Update HS badge on card
        const badge = document.querySelector(`.fp-hs-badge[data-dest="${this.destId}"]`);
        if (badge) { badge.innerText = `✈ Best: ${this.highScore}`; badge.classList.add('visible'); }
    }

    _resize() {
        if (!this.canvas) return;
        this.canvas.width  = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    // ── Game lifecycle ───────────────────────────────────────────
    _resetGame() {
        this.started = false;
        this.paused  = false;
        this.score   = 0;
        this.modeIdx = 0;
        this.pipes   = [];
        this.triggeredInsights = new Set();

        this.player.y  = this.canvas.height / 2;
        this.player.vY = 0;

        document.getElementById('fp-live-score').innerText = '0';
        document.getElementById('fp-cards-container').innerHTML = '';
        document.getElementById('fp-panel-sub').innerText = '0 insights unlocked';
        this.panel.classList.remove('open');

        MODES.forEach(m => {
            const el = document.getElementById(`mode-badge-${m.id}`);
            if (el) el.classList.remove('active');
        });
        const el = document.getElementById(`mode-badge-${MODES[0].id}`);
        if (el) el.classList.add('active');

        destroyFlightMiniMap();
        this._buildStars();
    }

    _buildStars() {
        this.stars = Array.from({ length: 60 }, () => ({
            x: Math.random() * 2000, y: Math.random() * 600,
            r: Math.random() * 1.5 + 0.5, speed: Math.random() * 0.4 + 0.1,
        }));
    }

    _flap() {
        if (!this.active || this.paused) return;
        if (!this.started) {
            this.started = true;
            this.msgBox.style.opacity = '0';
            setTimeout(() => this.msgBox.style.display = 'none', 300);
        }
        this.player.vY = LIFT;
        if (navigator.vibrate) navigator.vibrate(25);
    }

    _loop() {
        if (!this.active) return;
        if (!this.paused && this.started) {
            this._physics();
            this._checkInsights();
        }
        this._draw();
        this.frameId = requestAnimationFrame(() => this._loop());
    }

    // ── Physics ──────────────────────────────────────────────────
    _physics() {
        const mode  = MODES[this.modeIdx];
        const speed = mode.speed;

        this.player.vY += GRAVITY;
        this.player.y  += this.player.vY;

        // Floor / ceiling
        if (this.player.y <= 0 || this.player.y + this.player.h >= this.canvas.height) {
            this._gameOver(); return;
        }

        // Pipe spawn
        const last = this.pipes[this.pipes.length - 1];
        const spawnX = this.canvas.width + 20;
        const spacing = this.canvas.width * 0.55;
        if (!last || spawnX - last.x >= spacing) {
            const topH = Math.random() * (this.canvas.height - mode.gap - 120) + 60;
            this.pipes.push({ x: spawnX, topH, botY: topH + mode.gap, passed: false });
        }

        // Move + collision
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const p = this.pipes[i];
            p.x -= speed;

            const px = this.player.x, py = this.player.y, pw = this.player.w, ph = this.player.h;
            const hit = px + pw > p.x && px < p.x + PIPE_W && (py < p.topH || py + ph > p.botY);
            if (hit) { this._gameOver(); return; }

            if (!p.passed && p.x + PIPE_W < px) {
                p.passed = true;
                this.score++;
                document.getElementById('fp-live-score').innerText = this.score;
                this._checkModeUpgrade();
            }
            if (p.x + PIPE_W < 0) this.pipes.splice(i, 1);
        }

        // Stars parallax
        this.stars.forEach(s => { s.x -= s.speed; if (s.x < 0) s.x = this.canvas.width; });
    }

    _checkModeUpgrade() {
        const thresholds = [0, 6, 12, 18];
        const newIdx = thresholds.filter(t => this.score >= t).length - 1;
        if (newIdx > this.modeIdx && newIdx < MODES.length) {
            this.modeIdx = newIdx;
            MODES.forEach(m => document.getElementById(`mode-badge-${m.id}`)?.classList.remove('active'));
            document.getElementById(`mode-badge-${MODES[this.modeIdx].id}`)?.classList.add('active');
        }
    }

    // ── Draw ─────────────────────────────────────────────────────
    _draw() {
        const ctx = this.ctx;
        const W = this.canvas.width, H = this.canvas.height;
        const theme = DEST_THEME[this.destId] || DEST_THEME.bali;
        const mode  = MODES[this.modeIdx];

        // Sky gradient
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, theme.sky[0]);
        sky.addColorStop(1, theme.sky[1]);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        // Stars
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        this.stars.forEach(s => {
            ctx.beginPath();
            ctx.arc(s.x, s.y * (H / 600), s.r, 0, Math.PI * 2);
            ctx.fill();
        });

        // Ground strip
        ctx.fillStyle = theme.ground;
        ctx.fillRect(0, H - 40, W, 40);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(0, H - 40, W, 4);

        // Pipes (glassmorphic columns)
        this.pipes.forEach(p => {
            const grad = ctx.createLinearGradient(p.x, 0, p.x + PIPE_W, 0);
            grad.addColorStop(0, 'rgba(255,255,255,0.18)');
            grad.addColorStop(1, 'rgba(255,255,255,0.04)');
            ctx.fillStyle = grad;
            ctx.shadowColor = mode.color;
            ctx.shadowBlur  = 12;
            // Top
            ctx.beginPath();
            ctx.roundRect(p.x, 0, PIPE_W, p.topH, [0, 0, 10, 10]);
            ctx.fill();
            // Bottom
            ctx.beginPath();
            ctx.roundRect(p.x, p.botY, PIPE_W, H - p.botY - 40, [10, 10, 0, 0]);
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        // Player emoji
        ctx.save();
        ctx.translate(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2);
        const tilt = Math.min(0.5, Math.max(-0.5, this.player.vY * 0.06));
        ctx.rotate(tilt);

        const icon = mode.icon;
        ctx.font      = `${this.player.h * 1.1}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Glow
        ctx.shadowColor = mode.color;
        ctx.shadowBlur  = 20;
        ctx.fillText(icon, 0, 0);
        ctx.shadowBlur = 0;
        ctx.restore();

        // Idle overlay: draw the player at rest
        if (!this.started) {
            // Gentle hover
            const hover = Math.sin(Date.now() * 0.003) * 6;
            ctx.save();
            ctx.translate(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2 + hover);
            ctx.font = `${this.player.h * 1.2}px serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.shadowColor = mode.color; ctx.shadowBlur = 25;
            ctx.fillText(icon, 0, 0);
            ctx.shadowBlur = 0;
            ctx.restore();
        }
    }

    // ── Insights ─────────────────────────────────────────────────
    _checkInsights() {
        const pool = INSIGHTS[this.destId] || [];
        pool.forEach(ins => {
            if (!this.triggeredInsights.has(ins.score) && this.score >= ins.score) {
                this.triggeredInsights.add(ins.score);
                this._fireInsight(ins);
            }
        });
    }

    _fireInsight(ins) {
        this.paused = true;
        if (navigator.vibrate) navigator.vibrate([40, 30, 80]);

        // Map layers
        if (ins.action === 'green' || ins.action === 'red') showFlightMiniMap(this.destId);

        // Inject card
        const container = document.getElementById('fp-cards-container');
        const card = document.createElement('div');
        card.className = 'fp-card';
        card.innerHTML = `
            <div class="fp-card-head">
                <span class="fp-card-icon">${ins.icon}</span>
                <span class="fp-card-title">${ins.title}</span>
            </div>
            <div class="fp-card-body">${ins.body}</div>`;
        container.appendChild(card);
        requestAnimationFrame(() => card.classList.add('in'));

        const count = this.triggeredInsights.size;
        document.getElementById('fp-panel-sub').innerText = `${count} insight${count > 1 ? 's' : ''} unlocked`;

        this.panel.classList.add('open');
        document.getElementById('fp-resume-btn').style.display = 'block';
        this._showMsg(ins.icon, ins.title, ins.body, false);
    }

    _showMsg(icon, title, body, isPersist) {
        const mb = this.msgBox;
        mb.style.display = '';
        mb.style.opacity = '1';
        document.getElementById('fp-mode-icon').innerText  = icon;
        document.getElementById('fp-msg-title').innerText  = title;
        document.getElementById('fp-msg-body').innerHTML   = body;
        document.getElementById('fp-tap-hint').style.display = isPersist ? 'block' : 'none';
    }

    _resume() {
        this.panel.classList.remove('open');
        this.msgBox.style.display = 'none';

        let cnt = 3;
        this._showMsg('✈️', `Resuming in ${cnt}…`, 'Get ready to flap!', false);
        const iv = setInterval(() => {
            cnt--;
            if (cnt > 0) document.getElementById('fp-msg-title').innerText = `Resuming in ${cnt}…`;
            else {
                clearInterval(iv);
                this.msgBox.style.opacity = '0';
                setTimeout(() => { this.msgBox.style.display = 'none'; }, 300);
                this.player.vY = 0;
                this.paused = false;
            }
        }, 800);
    }

    _gameOver() {
        this.started = false;
        if (navigator.vibrate) navigator.vibrate([80, 40, 150]);

        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem(`fp_hs_${this.destId}`, this.highScore);
            document.getElementById('fp-live-hs').innerText = this.highScore;
        }

        const crashed = this.score;
        this._showMsg('💥', 'Crashed!',
            `Score: <strong>${crashed}</strong> &nbsp;|&nbsp; Best: <strong>${this.highScore}</strong>`,
            false);
        document.getElementById('fp-tap-hint').style.display = 'block';
        document.getElementById('fp-tap-hint').innerHTML = 'Tap to try again';

        setTimeout(() => {
            this._resetGame();
            this._showMsg('✈️', 'Try Again?', `Reach <em>${this.destTitle}</em> — flap to restart!`, true);
            this.started = false;
        }, 1400);
    }
}

// ── Bootstrap ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    window.flappyPassenger = new FlappyPassenger();
});
