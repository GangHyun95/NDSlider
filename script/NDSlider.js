export default class NDSlider {
    #slider;
    #wrapper;
    #slides;
    #btnPrev;
    #btnNext;
    #currentIndex;
    constructor(selector, option = {}) {
        this.#slider = document.querySelector(selector);
        this.#wrapper = this.#slider.querySelector(".ndslider-wrapper");
        this.#slides = this.#wrapper.querySelectorAll(".ndslider-slide");
        this.#btnPrev = this.#slider.querySelector(option.navigation?.prevEl);
        this.#btnNext = this.#slider.querySelector(option.navigation?.nextEl);
        this.#currentIndex = 0;

        const { dragStart, dragging, dragEnd } = this.#dragHandlers();
        this.#wrapper.addEventListener("pointerdown", dragStart);
        document.addEventListener("pointermove", dragging);
        document.addEventListener("pointerup", dragEnd.bind(this));
    }

    #dragHandlers() {
        let isDragging = false,
            dragStartX = 0,
            currentTranslateX = 0,
            target;
        function dragStart(e) {
            isDragging = true;
            dragStartX = e.pageX;
            target = e.currentTarget;
        }

        function dragging(e) {
            if (!isDragging) return;
            const distanceX = e.pageX - dragStartX;
            const newTranslateX = currentTranslateX + distanceX;

            target.style.transform = `translate3d(${newTranslateX}px, 0, 0)`;
        }

        function dragEnd(e) {
            if (!isDragging) return;
            currentTranslateX += e.pageX - dragStartX; // 드래그가 끝난 후에 최종 위치 저장
            if (currentTranslateX) dragStartX = 0;
            isDragging = false;

            this.#currentIndex = Math.round(
                -currentTranslateX / target.clientWidth
            );

            // 슬라이드 인덱스에 따라 위치 조정
            currentTranslateX = -(this.#currentIndex * target.clientWidth);
            target.style.transitionDuration = "0.3s";
            target.style.transform = `translate3d(${currentTranslateX}px, 0, 0)`;
            setTimeout(() => {
                target.style.transitionDuration = "0s";
            }, 300);
        }

        return { dragStart, dragging, dragEnd };
    }
}
