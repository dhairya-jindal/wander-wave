# WanderWave - Journey Above the World

A premium, immersive scroll-based storytelling website about travel. As the user scrolls down, clouds drift upward at varying speeds creating a parallax "ascending through the sky" effect, revealing stunning destinations and a shifting day-to-night gradient sky.

## 🌟 Key Features

*   **Deep Parallax Clouds**: Pure CSS-generated clouds floating across 3 distinct depth layers (`distant`, `mid`, `foreground`), perfectly synchronized to scroll depth for buttery-smooth depth effects.
*   **Dynamic Day/Night Cycle**: Advanced `IntersectionObserver` triggers seamless CSS gradient transitions matching the real-world aesthetic of each destination (Dawn → Paris Morning → Sahara Golden Hour → Iceland Night).
*   **Interactive Navigation & Tooltips**: Floating glassmorphism side navigation mapped to chapter waypoints, plus a premium elegant top navigation bar.
*   **Infinite Marquee**: A continuous, gapless, horizontally scrolling ticker at the base of the page showcasing the brand's core values.
*   **Progress Tracking**: A custom airplane indicator actively descends a dotted path on the right rail, mirroring precise scroll percentage.
*   **No Dependencies**: Built entirely with Vanilla HTML5, CSS3, and JavaScript.

## 🚀 Setup & Installation

Since the project uses absolute imports and modules, it is best run on a simple local web server to avoid CORS/file protocol restrictions.

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/wander-wave.git
   ```

2. Navigate into the directory:
   ```bash
   cd wander-wave
   ```

3. Start a local server. For example, using Python 3:
   ```bash
   python -m http.server 8080
   ```

4. Open your browser and visit: `http://localhost:8080`

## 🛠️ Built With
*   **HTML5**: Semantic document structure
*   **CSS3**: Custom variables, Keyframe Animations, Flexbox, CSS Filters, and Transitions
*   **JavaScript (ES6)**: DOM Manipulation, `requestAnimationFrame`, `IntersectionObserver` API

## 🎨 Design System
*   **Headings:** Playfair Display (Serif, Elegant)
*   **Body:** Cormorant (Serif, Editorial)
*   **UI System:** Glassmorphism (blur backdrops, semi-transparent borders)

---
*Where Every Journey Writes a Story.*
