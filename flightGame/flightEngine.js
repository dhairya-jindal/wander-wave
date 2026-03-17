// Flight Mode Engine - Progressive Map Intelligence Game
import { showFlightMiniMap, destroyFlightMiniMap } from '../mapFeature/mapController.js';

// Load Styles
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'flightGame/flightStyles.css';
document.head.appendChild(link);

const GAME_GRAVITY = 0.5;
const FLIGHT_LIFT = -8;
const PIPE_WIDTH = 60;
const PIPE_GAP = 200;
const PIPE_SPEED = 4;

const MILESTONES = [
    { score: 1, id: 'ms1', icon: '🌍', title: 'Tourist Popularity', text: 'Over 2 million visitors annually. Peak season: June - August.' },
    { score: 3, id: 'ms2', icon: '📍', title: 'Hotspots Revealed', text: 'Green zones updated on your map. These are the most vibrant tourist hubs.', action: 'green' },
    { score: 5, id: 'ms3', icon: '⚠️', title: 'Caution Areas', text: 'Red zones updated. Advisable to avoid travelling alone here at night.', action: 'red' },
    { score: 7, id: 'ms4', icon: '🧭', title: 'Local Insights', text: 'Best route: Take the coastal train instead of the highway for scenic views.' },
    { score: 9, id: 'ms5', icon: '💎', title: 'Hidden Gem', text: 'You unlocked a secret beach coordinate completely untouched by algorithms.' }
];

class FlightEngine {
    constructor() {
        this.ctx = null;
        this.canvas = null;
        this.frameId = null;
        this.active = false;
        
        // Game state
        this.plane = { x: 100, y: 300, vY: 0, width: 40, height: 30 };
        this.pipes = [];
        this.score = 0;
        this.passedMilestones = new Set();
        this.currentDestTitle = '';
        this.currentDestId = '';
        this.isPaused = false;
        this.gameStarted = false;
        
        this.initDOM();
        this.attachTriggers();
    }

    initDOM() {
        const overlayHtml = `
            <div id="flight-overlay">
                <div id="flight-close">×</div>
                <div class="flight-game-area" id="flight-game-area">
                    <canvas id="flight-canvas"></canvas>
                    <div id="flight-score">0</div>
                    <div id="flight-start-msg">Tap / Click to Fly<br/><span style="font-size: 0.9rem; opacity: 0.8;">Avoid obstacles to unlock destination intel</span></div>
                    
                    <!-- Dynamic Map Overlay -->
                    <div id="flight-map-layer">
                        <div class="map-pin green" style="top: 30%; left: 40%;"></div>
                        <div class="map-pin green" style="top: 50%; left: 60%;"></div>
                        <div class="map-pin red" style="top: 70%; left: 20%;"></div>
                        <div class="map-pin red" style="top: 20%; left: 80%;"></div>
                    </div>
                </div>

                <div class="flight-sidebar" id="flight-sidebar">
                    <h2 class="flight-dest-title" id="flight-dest-title">Destination</h2>
                    <div id="flight-discovery-panel">
                        <!-- Cards injected here -->
                    </div>
                    <button id="flight-resume-btn">Resume Flight ✈️</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', overlayHtml);
        
        this.overlay = document.getElementById('flight-overlay');
        this.canvas = document.getElementById('flight-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        document.getElementById('flight-close').addEventListener('click', () => this.closeFlight());
        document.getElementById('flight-resume-btn').addEventListener('click', () => this.resumeFlight());
        
        const area = document.getElementById('flight-game-area');
        area.addEventListener('mousedown', () => this.flap());
        area.addEventListener('touchstart', (e) => { e.preventDefault(); this.flap(); }, { passive: false });
        // Also bind spacebar
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.active && !this.isPaused) {
                e.preventDefault();
                this.flap();
            }
        });
        
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    attachTriggers() {
        // Find existing Explore buttons. Overriding their default behavior.
        const exploreButtons = document.querySelectorAll('.pill-btn.explore');
        exploreButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const section = btn.closest('section');
                if (section) {
                    const title = section.querySelector('.location').innerText;
                    const destId = section.getAttribute('data-id') || 'bali';
                    this.openFlight(destId, title);
                }
            });
        });
    }

    resizeCanvas() {
        if (!this.canvas) return;
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;
    }

    openFlight(destId, destTitle) {
        this.currentDestTitle = destTitle;
        this.currentDestId = destId;
        document.getElementById('flight-dest-title').innerText = destTitle;
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        this.resizeCanvas();
        this.resetGame();
        this.active = true;
        this.updateFrame();
    }

    closeFlight() {
        this.active = false;
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('flight-sidebar').classList.remove('open');
        cancelAnimationFrame(this.frameId);
        destroyFlightMiniMap();
    }

    resetGame() {
        this.plane.y = this.canvas.height / 2;
        this.plane.vY = 0;
        this.pipes = [];
        this.score = 0;
        this.passedMilestones.clear();
        this.gameStarted = false;
        this.isPaused = false;
        
        document.getElementById('flight-score').innerText = '0';
        document.getElementById('flight-start-msg').style.display = 'block';
        document.getElementById('flight-sidebar').classList.remove('open');
        document.getElementById('flight-discovery-panel').innerHTML = '';
        destroyFlightMiniMap();
    }

    flap() {
        if (!this.active || this.isPaused) return;
        if (!this.gameStarted) {
            this.gameStarted = true;
            document.getElementById('flight-start-msg').style.display = 'none';
        }
        this.plane.vY = FLIGHT_LIFT;
        
        // Fake haptics
        if (navigator.vibrate) navigator.vibrate(30);
    }

    updateFrame() {
        if (!this.active) return;
        
        if (!this.isPaused && this.gameStarted) {
            this.updatePhysics();
            this.checkMilestones();
        }
        
        this.drawCanvas();
        
        this.frameId = requestAnimationFrame(() => this.updateFrame());
    }

    updatePhysics() {
        // Plane Gravity
        this.plane.vY += GAME_GRAVITY;
        this.plane.y += this.plane.vY;
        
        // Floor / ceiling collision
        if (this.plane.y + this.plane.height >= this.canvas.height || this.plane.y <= 0) {
            this.gameOver();
            return;
        }

        // Pipe generation
        if (this.pipes.length === 0 || this.pipes[this.pipes.length - 1].x < this.canvas.width - 300) {
            const topHeight = Math.random() * (this.canvas.height - PIPE_GAP - 100) + 50;
            this.pipes.push({
                x: this.canvas.width,
                top: topHeight,
                bottom: topHeight + PIPE_GAP,
                passed: false
            });
        }

        // Move pipes
        for (let i = 0; i < this.pipes.length; i++) {
            let p = this.pipes[i];
            p.x -= PIPE_SPEED;

            // Collision
            // AABB physics
            if (
                this.plane.x < p.x + PIPE_WIDTH &&
                this.plane.x + this.plane.width > p.x &&
                (this.plane.y < p.top || this.plane.y + this.plane.height > p.bottom)
            ) {
                this.gameOver();
                return;
            }

            // Score update
            if (p.x + PIPE_WIDTH < this.plane.x && !p.passed) {
                p.passed = true;
                this.score++;
                document.getElementById('flight-score').innerText = this.score;
            }
        }
        
        // Cleanup old pipes
        this.pipes = this.pipes.filter(p => p.x + PIPE_WIDTH > 0);
    }

    checkMilestones() {
        const ms = MILESTONES.find(m => m.score === this.score && !this.passedMilestones.has(m.id));
        if (ms) {
            this.passedMilestones.add(ms.id);
            this.triggerInsight(ms);
        }
    }

    triggerInsight(ms) {
        this.isPaused = true;
        if (navigator.vibrate) navigator.vibrate([50, 50, 100]);
        
        // Real Leaflet mini-map — lazy loaded on first map milestone
        if (ms.action === 'green' || ms.action === 'red') {
            showFlightMiniMap(this.currentDestId);
        }
        
        // Open Sidebar and Inject Card
        const sidebar = document.getElementById('flight-sidebar');
        const container = document.getElementById('flight-discovery-panel');
        
        const cardHtml = `
            <div class="discovery-card" id="card-${ms.id}">
                <div class="discovery-header">
                    <span class="discovery-icon">${ms.icon}</span>
                    <span class="discovery-title">${ms.title}</span>
                </div>
                <div class="discovery-body">${ms.text}</div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHtml);
        
        sidebar.classList.add('open');
        document.getElementById('flight-resume-btn').style.display = 'block';
        
        // Trigger animation reflow
        setTimeout(() => {
            document.getElementById(`card-${ms.id}`).classList.add('revealed');
        }, 100);
    }

    resumeFlight() {
        document.getElementById('flight-sidebar').classList.remove('open');
        
        // Countdown to resume
        let cnt = 3;
        const msg = document.getElementById('flight-start-msg');
        msg.style.display = 'block';
        msg.innerHTML = `Continuing in ${cnt}...`;
        
        const inv = setInterval(() => {
            cnt--;
            if (cnt > 0) {
                msg.innerHTML = `Continuing in ${cnt}...`;
            } else {
                clearInterval(inv);
                msg.style.display = 'none';
                this.isPaused = false;
                // Minor boost to prevent dropping immediately
                this.plane.vY = 0; 
            }
        }, 800);
    }

    gameOver() {
        this.gameStarted = false;
        if (navigator.vibrate) navigator.vibrate([100, 50, 200]);
        
        const msg = document.getElementById('flight-start-msg');
        msg.style.display = 'block';
        msg.innerHTML = `<strong>CRASHED</strong><br/>Score: ${this.score}<br/><span style="font-size: 0.9rem;">Tap to fly again</span>`;
        
        // Let them tap to reset
        this.active = false;
        setTimeout(() => {
            this.active = true; // allow flap to start over
            this.resetGame();
        }, 1500);
    }

    drawCanvas() {
        // Clear
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!this.gameStarted && !this.isPaused && this.score === 0) {
            // Idle background maybe
            return;
        }

        // Draw Pipes (Use stylized columns)
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'; // Glassmorphic obstacles
        this.ctx.shadowColor = '#f5af19';
        this.ctx.shadowBlur = 10;
        
        this.pipes.forEach(p => {
            // Top pipe
            this.ctx.fillRect(p.x, 0, PIPE_WIDTH, p.top);
            // Bottom pipe
            this.ctx.fillRect(p.x, p.bottom, PIPE_WIDTH, this.canvas.height - p.bottom);
        });

        // Draw Plane
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#00ffcc';
        this.ctx.fillStyle = '#fff';
        
        // Simple shape of a glider/plane
        this.ctx.save();
        this.ctx.translate(this.plane.x + this.plane.width/2, this.plane.y + this.plane.height/2);
        // Tilt based on velocity
        let angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (this.plane.vY * 0.1)));
        this.ctx.rotate(angle);
        
        // Triangle/Jet shape
        this.ctx.beginPath();
        this.ctx.moveTo(this.plane.width/2, 0); // nose
        this.ctx.lineTo(-this.plane.width/2, -this.plane.height/2); // top tail
        this.ctx.lineTo(-this.plane.width/4, 0); // indent
        this.ctx.lineTo(-this.plane.width/2, this.plane.height/2); // bottom tail
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
        
        this.ctx.shadowBlur = 0; // reset
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.flightEngine = new FlightEngine();
});
