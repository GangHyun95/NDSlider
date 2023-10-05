import NDSlider from "./NDSlider.js";

const mySlider = new NDSlider(".mySlider", {
    slidesPerView:2,
    slidesPerGroup: 3,
    spaceBetween: 30,
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
