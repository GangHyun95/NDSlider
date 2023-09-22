import NDSlider from "./NDSlider.js";

const mySlider = new NDSlider(".mySlider", {
    slidesPerView: 2,
    loop: true,
    navigation: {
        prevEl: ".ndslider-button-prev",
        nextEl: ".ndslider-button-next",
    },
    pagination: {
        el: ".ndslider-pagination",
        clickable: true,
    },
});
