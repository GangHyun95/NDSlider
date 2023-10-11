import NDSlider from "./NDSlider.js";

const mySlider = new NDSlider(".mySlider", {
    grid: {
        rows: 2
    },
    slidesPerView:2,
    slidesPerGroup: 2,
    spaceBetween: 30,
    // autoplay: {
    //     delay: 1000,
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
