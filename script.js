function toggleMenu(){
    const menu = document.querySelector(".menu_links")
    //function already in javascript, we are just selecting the code we created in index.html
    const icon = document.querySelector(".hamburger_icon")
    menu.classList.toggle("open")
    icon.classList.toggle("open")
}