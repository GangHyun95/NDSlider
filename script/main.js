import NDSlider from "./NDSlider.js";

const mySlider = new NDSlider(".mySlider", {
    // loop: true,
    navigation: {

        prevEl: ".ndslider-button-prev",
        nextEl: ".ndslider-button-next",
    },
    // pagination: {
    //     el: ".ndslider-pagination",
    //     clickable: true,
    // },
});
