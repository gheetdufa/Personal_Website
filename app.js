let stickySections = [...document.querySelectorAll('.sticky')];

function animate() {
    for (let i = 0; i < stickySections.length; i++) {
        let { top } = stickySections[i].parentElement.getBoundingClientRect();
        let transTop = top > 0 ? 0 : -top;
        if (transTop >= 1000) transTop = 1000;

        if (top <= 0 && i !== stickySections.length - 1) {
            stickySections[i].style.filter = `blur(${0 + (transTop * 0.005)}px)`;
            stickySections[i].style.transform = `scale3d(${1 - (transTop * 0.001)}, ${1 - (transTop * 0.001)}, 1)`;
            stickySections[i].style.opacity = 1 - (transTop * 0.0015);
        }
    }

    requestAnimationFrame(animate);
}

animate();

const themeMap = {
    dark: "light",
    light: "solar",
    solar: "dark"
  };
  
  const theme = localStorage.getItem('theme')
    || (tmp = Object.keys(themeMap)[0],
        localStorage.setItem('theme', tmp),
        tmp);
  const bodyClass = document.body.classList;
  bodyClass.add(theme);
  
  function toggleTheme() {
    const current = localStorage.getItem('theme');
    const next = themeMap[current];
  
    bodyClass.replace(current, next);
    localStorage.setItem('theme', next);
  }


  function toggleIntroduction() {
    const modal = document.getElementById("intro-modal");
    modal.classList.toggle("active");
  }

  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    const modal = document.getElementById("intro-modal");
    if (event.target === modal) {
      modal.classList.remove("active");
    }
  });



