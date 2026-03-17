import { QuestService } from './questService.js';

// Styles injection
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'atlas/atlasStyles.css';
document.head.appendChild(link);

// Map Box minimal stub for visual
const DUMMY_MAP_BG = 'url("https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80")';

class AtlasEngine {
    constructor() {
        this.currentDestId = null;
        this.currentDestTitle = null;
        this.initModal();
        this.augmentCards();
    }

    initModal() {
        const modalHtml = `
            <div id="atlas-modal">
                <div id="atlas-modal-close">×</div>
                <div class="atlas-layout">
                    <div class="atlas-map-container">
                        <div id="atlas-map" style="background-image: ${DUMMY_MAP_BG}; background-size: cover; background-position: center; border-right: 1px solid rgba(255,255,255,0.1);">
                            <!-- Map UI Overlay layer -->
                            <div style="position: absolute; top:0; left:0; width:100%; height:100%; background: radial-gradient(circle at center, transparent, rgba(10,10,15,0.8)); pointer-events:none;"></div>
                        </div>
                    </div>
                    <div class="atlas-sidebar">
                        <h2 class="atlas-title" id="atlas-sidebar-title">Destination</h2>
                        <div class="atlas-subtitle" id="atlas-sidebar-metrics">0/7 Quests Completed</div>
                        
                        <div id="atlas-quests-container"></div>
                        
                        <button class="atlas-memory-btn" id="atlas-memory-btn">Extract Memory Fragment</button>
                        <div class="atlas-story-panel" id="atlas-story-panel"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        this.modal = document.getElementById('atlas-modal');
        document.getElementById('atlas-modal-close').addEventListener('click', () => this.closeModal());
        document.getElementById('atlas-memory-btn').addEventListener('click', () => this.extractMemory());
    }

    augmentCards() {
        // Find all destination cards (Bali, Croatia, Maldives)
        const destSections = document.querySelectorAll('section[data-theme="bali"], section[data-theme="croatia"], section[data-theme="maldives"]');
        
        destSections.forEach(section => {
            const destId = section.getAttribute('data-id');
            const destTitle = section.querySelector('.location').innerText;
            const container = section.querySelector('.layer-content');
            const actionRow = container.querySelector('.card-actions');
            
            // 1. Inject Badge
            const progress = QuestService.getProgress(destId);
            const badgeInfo = QuestService.getBadgeStatus(progress.completed.length);
            
            const badge = document.createElement('div');
            badge.className = `atlas-badge ${badgeInfo.class}`;
            badge.innerHTML = `★ <span class="badge-text">${badgeInfo.label}</span>`;
            badge.setAttribute('data-id', destId);
            // Append badge logic - finding a safe place that preserves Z space
            container.appendChild(badge); // Add at the end of content, visually absolute positioned
            
            // 2. Inject Quest Hub Button next to EXPLORE
            const questBtn = document.createElement('button');
            questBtn.className = 'pill-btn atlas-start-btn';
            questBtn.innerHTML = `QUESTS <span>✦</span>`;
            questBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openModal(destId, destTitle);
            });
            
            actionRow.appendChild(questBtn);
        });
    }

    updateBadges() {
        const badges = document.querySelectorAll('.atlas-badge');
        badges.forEach(badge => {
            const destId = badge.getAttribute('data-id');
            const progress = QuestService.getProgress(destId);
            const badgeInfo = QuestService.getBadgeStatus(progress.completed.length);
            badge.className = `atlas-badge ${badgeInfo.class}`;
            badge.innerHTML = `★ <span class="badge-text">${badgeInfo.label}</span>`;
        });
    }

    openModal(destId, title) {
        this.currentDestId = destId;
        this.currentDestTitle = title;
        document.getElementById('atlas-sidebar-title').innerText = title;
        this.renderQuests();
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // prevent scrolling behind
    }

    closeModal() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        this.updateBadges();
    }

    renderQuests() {
        const container = document.getElementById('atlas-quests-container');
        container.innerHTML = '';
        
        const progress = QuestService.getProgress(this.currentDestId);
        const quests = QuestService.getQuests(this.currentDestId);
        const count = progress.completed.length;
        
        document.getElementById('atlas-sidebar-metrics').innerText = `${count}/7 Quests Completed`;
        
        quests.forEach(q => {
            const isDone = progress.completed.includes(q.id);
            const el = document.createElement('div');
            el.className = `atlas-quest ${isDone ? 'completed' : ''}`;
            el.innerHTML = `
                <div class="atlas-quest-header">
                    <span class="atlas-quest-title">${q.title}</span>
                    <span class="atlas-quest-type">${q.type}</span>
                </div>
                <div class="atlas-quest-desc">${q.desc}</div>
                <div class="atlas-quest-done">✓ Quest Completed</div>
                <button class="atlas-quest-btn">Start Quest</button>
            `;
            
            if (!isDone) {
                el.querySelector('.atlas-quest-btn').addEventListener('click', () => {
                    this.completeQuest(q.id);
                });
            }
            container.appendChild(el);
        });
        
        // Show Memory button if progress allows
        document.getElementById('atlas-memory-btn').style.display = count > 0 ? 'block' : 'none';
        
        // Update Story panel
        const storyPanel = document.getElementById('atlas-story-panel');
        if (count > 0) {
            storyPanel.style.display = 'block';
            storyPanel.innerHTML = `<strong>Memory Chronicle:</strong><br/>${QuestService.getStory(this.currentDestId, this.currentDestTitle)}`;
        } else {
            storyPanel.style.display = 'none';
        }
    }

    completeQuest(questId) {
        QuestService.completeQuest(this.currentDestId, questId);
        // Add fake haptic feedback
        if (navigator.vibrate) navigator.vibrate(50);
        this.renderQuests(); // re-render sidebar
    }

    extractMemory() {
        // Simple mock effect for memory extraction
        const btn = document.getElementById('atlas-memory-btn');
        btn.innerHTML = 'Extracting...';
        setTimeout(() => {
            btn.innerHTML = 'Memory Fragment Saved ✓';
            setTimeout(() => {
                btn.innerHTML = 'Extract Memory Fragment';
            }, 2000);
        }, 1000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.atlas = new AtlasEngine();
});
