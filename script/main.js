import NDSlider from "./NDSlider.js";

const mySlider = new NDSlider(".mySlider", {
    navigation: {
        prevEl: ".ndslider-button-prev",
        nextEl: ".ndslider-button-next",
    },
    loop: true,
    pagination: {
        el: ".ndslider-pagination",
        clickable: true,
    },
});
