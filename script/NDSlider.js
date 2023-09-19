export default class NDSlider {
    #slider;
    #wrapper;
    #slides;
    #btnPrev;
    #btnNext;
    #currentIndex;

    constructor(selector, option = {}) {
        // querySelector
        this.#slider = document.querySelector(selector);
        this.#wrapper = this.#slider.querySelector(".ndslider-wrapper");
        this.#slides = this.#wrapper.querySelectorAll(".ndslider-slide");
        this.#btnPrev = this.#slider.querySelector(option.navigation?.prevEl);
        this.#btnNext = this.#slider.querySelector(option.navigation?.nextEl);
        this.#currentIndex = 0;

        this.#initializeEvents();
        // drag evt
        const { dragStart, dragging, dragEnd } = this.#dragHandlers();
        this.#wrapper.addEventListener("pointerdown", dragStart);
        document.addEventListener("pointermove", dragging);
        document.addEventListener("pointerup", dragEnd);
    }
    // 이벤트 리스너 등록
    #initializeEvents() {
        this.#btnPrev?.addEventListener("click", () => this.#prevSlide());
        this.#btnNext?.addEventListener("click", () => this.#nextSlide());
    }

    // 이전 slide
    #prevSlide(){
        if (this.#currentIndex > 0) {
            this.#currentIndex--;
        }
        this.#updateSlidePosition();

    }

    //다음 slide
    #nextSlide(){
        if (this.#currentIndex < this.#slides.length - 1) {
            this.#currentIndex++;
        }            
        this.#updateSlidePosition();

    }

    #updateSlidePosition() {
        const targetWidth = this.#wrapper.clientWidth;
        const newTranslateX = -(this.#currentIndex * targetWidth);
        this.#wrapper.style.transitionDuration = "0.3s";
        this.#wrapper.style.transform = `translate3d(${newTranslateX}px, 0, 0)`;
        setTimeout(() => {
            this.#wrapper.style.transitionDuration = "0s";
        }, 300);
    }

    #dragHandlers() {
        const parent = this;
        let isDragging = false,
            dragStartX = 0,
            startTime = 0,
            currentTranslateX = 0,
            recentlySwiped = false, // 최근에 슬라이드를 넘겼는지 체크
            lastDragEndTime = 0,
            target;

        function dragStart(e) {
            isDragging = true;
            dragStartX = e.pageX;
            startTime = new Date().getTime(); // 시작 시간 저장
            target = e.currentTarget;

            const deltaTime = new Date().getTime() - lastDragEndTime;
            deltaTime < 300 ? recentlySwiped = true : recentlySwiped = false;

            currentTranslateX = -(parent.#currentIndex * target.clientWidth);
        }

        function dragging(e) {
            if (!isDragging) return;
            target.style.transitionDuration = "0s";
            const distanceX = e.pageX - dragStartX;
            let newTranslateX = currentTranslateX + distanceX;

            if((parent.#currentIndex === 0 && distanceX > 0) || (parent.#currentIndex === parent.#slides.length - 1 && distanceX < 0)){
                newTranslateX = currentTranslateX + (distanceX / 3);
            }

            target.style.transform = `translate3d(${newTranslateX}px, 0, 0)`;
        }

        function dragEnd(e) {
            if (!isDragging) return;
            lastDragEndTime = new Date().getTime();

            const distanceX = e.pageX - dragStartX;

            if (recentlySwiped && Math.abs(distanceX) > target.clientWidth * 0.05) {
                distanceX < 0 ? parent.#nextSlide() : parent.#prevSlide();
            } else if (Math.abs(distanceX) >= target.clientWidth * 0.5) {
                distanceX < 0 ? parent.#nextSlide() : parent.#prevSlide();
            } else {
                parent.#updateSlidePosition(); // 슬라이드의 위치를 업데이트
            }
            isDragging = false;
        }

        return { dragStart, dragging, dragEnd };
    }
}
