// Progressive reveal animation for project detail pages
class ProjectReveal {
    constructor() {
        this.elements = {
            backBtn: document.querySelector('.back-btn'),
            projectImg: document.querySelector('.project-detail-img'),
            projectTitle: document.querySelector('.project-detail-title'),
            description: document.querySelector('.project-description'),
            buttons: document.querySelector('.project-buttons')
        };
        this.init();
    }

    wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    async init() {
        // Initially hide all elements
        Object.values(this.elements).forEach(el => {
            if (el) {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
            }
        });

        // Hide text content initially
        const paragraphs = document.querySelectorAll('.project-content p, .project-content ul');
        paragraphs.forEach(p => {
            p.style.opacity = '0';
            p.style.transform = 'translateY(10px)';
        });

        // Reveal back button first (small delay)
        if (this.elements.backBtn) {
            await this.revealElement(this.elements.backBtn, 200);
        }

        // Type out project title first
        if (this.elements.projectTitle) {
            await this.typeTitle(this.elements.projectTitle);
        }

        // Reveal project image below title
        if (this.elements.projectImg) {
            await this.revealElement(this.elements.projectImg, 400);
        }

        // Reveal description section (container first, then content)
        if (this.elements.description) {
            await this.revealElement(this.elements.description, 200);
            await this.wait(600); // Wait for heading to start typing
            
            // Type out all description paragraphs after heading starts typing
            const descParagraphs = this.elements.description.querySelectorAll('p');
            if (descParagraphs.length > 0) {
                await this.wait(2000); // Wait for heading to finish typing
                for (const paragraph of descParagraphs) {
                    await this.typeText(paragraph, 20); // Type out each paragraph
                    await this.wait(300); // Small pause between paragraphs
                }
            }
        }

        // Reveal buttons last
        if (this.elements.buttons) {
            await this.wait(300);
            await this.revealElement(this.elements.buttons, 0);
        }
    }

    async revealText(el, delay = 0) {
        await this.wait(delay);
        // For paragraphs, type them out character by character
        if (el.tagName === 'P') {
            await this.typeText(el, 20); // Faster typing speed
        } else if (el.tagName === 'UL') {
            // For lists, type each item
            await this.typeList(el);
        } else {
            // Fallback to fade-in
            el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }
    }

    async typeText(el, speed = 20) {
        const text = el.textContent.trim();
        el.textContent = '';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        el.classList.add('typing');
        
        for (const letter of text) {
            el.textContent += letter;
            await this.wait(speed);
        }
        
        el.classList.remove('typing');
    }

    async typeList(ul) {
        ul.style.opacity = '1';
        ul.style.transform = 'translateY(0)';
        const items = ul.querySelectorAll('li');
        
        for (const item of items) {
            const text = item.textContent.trim();
            item.textContent = '';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
            item.classList.add('typing');
            
            // Type out the list item text
            for (const letter of text) {
                item.textContent += letter;
                await this.wait(15); // Fast typing for list items
            }
            
            item.classList.remove('typing');
            await this.wait(100); // Small pause between items
        }
    }

    async revealElement(el, delay = 0) {
        await this.wait(delay);
        if (el) {
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }
    }

    async typeTitle(el) {
        const text = el.textContent.trim();
        el.textContent = '';
        el.style.opacity = '1';
        el.classList.add('typing');
        
        await this.wait(300);
        
        for (const letter of text) {
            el.textContent += letter;
            await this.wait(80);
        }
        
        el.classList.remove('typing');
        await this.wait(300);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Only run on project detail pages
    if (document.querySelector('.project-detail-container')) {
        new ProjectReveal();
    }
});

