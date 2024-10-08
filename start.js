document.addEventListener('DOMContentLoaded', () => {
    let intro = document.querySelector('.intro');
    let startSpans = document.querySelectorAll('.start');
  
    setTimeout(() => {
      startSpans.forEach((span, idx) => {
        setTimeout(() => {
          span.classList.add('active');
        }, (idx + 1) * 400);
      });
  
      setTimeout(() => {
        startSpans.forEach((span, idx) => {
          setTimeout(() => {
            span.classList.remove('active');
            span.classList.add('fade');
          }, (idx + 1) * 50);
        });
      }, 2000);
  
      setTimeout(() => {
        intro.style.top = '-100vh';
      }, 4500);
    });
  });
