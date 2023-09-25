import NDSlider from "./NDSlider.js";

const mySlider = new NDSlider(".mySlider", {
    slidesPerView: 2,
    spaceBetween: 100,
    autoplay: {
        delay: 1000,
        disableOnInteraction: false,
    },
    direction: "vertical",
    navigation: {
        prevEl: ".ndslider-button-prev",
        nextEl: ".ndslider-button-next",
    },
    pagination: {
        el: ".ndslider-pagination",
        clickable: true,
    },
});
