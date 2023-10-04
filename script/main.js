import NDSlider from "./NDSlider.js";

const mySlider = new NDSlider(".mySlider", {
    grid: {
        rows: 3,
    },
    slidesPerView:2,
    spaceBetween: 30,
    slidesPerGroup: 3,
    // autoplay: {
    //     delay: 1000,
    //     disableOnInteraction: false,
    // },
    // direction: "vertical",
    navigation: {
        prevEl: ".ndslider-button-prev",
        nextEl: ".ndslider-button-next",
    },
    pagination: {
        el: ".ndslider-pagination",
        clickable: true,
    },
});
