// Fix scrolling on project detail pages
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.project-detail-container')) {
        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
        document.body.style.height = '100vh';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        
        // Ensure html also doesn't scroll
        document.documentElement.style.overflow = 'hidden';
        document.documentElement.style.height = '100vh';
    }
});

