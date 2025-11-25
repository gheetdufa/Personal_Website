// Simple typewriter effect for section headings (types once, no deletion)
class SectionTypewriter {
    constructor(el, options) {
        this.el = el;
        this.text = el.textContent.trim();
        this.speed = options?.speed || 80;
        this.delay = options?.delay || 200;
        this.el.textContent = '';
        this.el.classList.add('typing');
        this.initTyping();
    }

    wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    async initTyping() {
        await this.wait(this.delay);
        for (const letter of this.text) {
            this.el.textContent += letter;
            await this.wait(this.speed);
        }
        // Remove typing class to hide cursor after typing is complete
        this.el.classList.remove('typing');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit longer before starting section typewriter to sync with reveal animation
    setTimeout(() => {
        document.querySelectorAll('[data-section-typewriter]').forEach((el, index) => {
            new SectionTypewriter(el, {
                speed: 80,
                delay: index * 100, // Stagger each heading slightly
            });
        });
    }, 2000); // Start after title finishes typing
});

