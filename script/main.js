import NDSlider from "./NDSlider.js";

const mySlider = new NDSlider(".mySlider", {
    loop:true,
    // grid: {
    //     rows: 2
    // },
    slidesPerView: 5,
    slidesPerGroup: 4,
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
