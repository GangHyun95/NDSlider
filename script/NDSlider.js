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
        document.addEventListener("pointerup", dragEnd);
    }

    #dragHandlers() {
        const parent = this;
        let isDragging = false,
            dragStartX = 0,
            currentTranslateX = 0,
            recentlySwiped = false, // 최근에 슬라이드를 넘겼는지 체크
            lastDragEndTime = 0,
            startTime = 0,
            target;

        function dragStart(e) {
            isDragging = true;
            dragStartX = e.pageX;
            startTime = new Date().getTime(); // 시작 시간 저장
            target = e.currentTarget;
            
            const deltaTime = new Date().getTime() - lastDragEndTime;
            deltaTime < 300 ? recentlySwiped = true : recentlySwiped = false;
        }

        function dragging(e) {
            if (!isDragging) return;
            const distanceX = e.pageX - dragStartX;
            const newTranslateX = currentTranslateX + distanceX;

            target.style.transform = `translate3d(${newTranslateX}px, 0, 0)`;
        }

        function dragEnd(e) {
            if (!isDragging) return;
            lastDragEndTime = new Date().getTime();

            currentTranslateX += e.pageX - dragStartX;

            if (recentlySwiped && Math.abs(e.pageX - dragStartX) > target.clientWidth * 0.05) {
                if (e.pageX - dragStartX < 0) {
                    // 오른쪽으로 드래그
                    parent.#currentIndex++;
                } else {
                    // 왼쪽으로 드래그
                    parent.#currentIndex--;
                }
            } else {
                parent.#currentIndex = Math.round(
                    -currentTranslateX / target.clientWidth
                );
            }

            // 최소 및 최대 인덱스 제한
            parent.#currentIndex = Math.min(Math.max(parent.#currentIndex, 0) , parent.#slides.length - 1);

            // 슬라이드 인덱스에 따라 위치 조정
            currentTranslateX = -(parent.#currentIndex * target.clientWidth);
            target.style.transitionDuration = "0.3s";
            target.style.transform = `translate3d(${currentTranslateX}px, 0, 0)`;
            setTimeout(() => {
                target.style.transitionDuration = "0s";
            }, 300);

            isDragging = false;
        }

        return { dragStart, dragging, dragEnd };
    }
}
