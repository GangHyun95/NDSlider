export default class NDSlider {
    #slider;
    #wrapper;
    #slides;
    #btnPrev;
    #btnNext;
    #pagination;
    #currentIndex = 0;
    #option;

    constructor(selector, option = {}) {
        // querySelector
        this.#slider = document.querySelector(selector);
        this.#wrapper = this.#slider.querySelector(".ndslider-wrapper");
        this.#slides = this.#wrapper.querySelectorAll(".ndslider-slide");
        this.#btnPrev = this.#slider.querySelector(option.navigation?.prevEl);
        this.#btnNext = this.#slider.querySelector(option.navigation?.nextEl);
        this.#pagination = this.#slider.querySelector(option.pagination?.el);
        option.slidesPerView = option.slidesPerView || 1;
        option.spaceBetween = option.spaceBetween || 0;
        this.#option = option;

        this.#initializeEvents();
        this.#updateButtonStatus();
        this.#createPagination();
        this.#setupSlides(option);
        console.log(option);
    }
    // 이벤트 리스너 등록
    #initializeEvents() {
        this.#btnPrev?.addEventListener("click", () => this.#prevSlide());
        this.#btnNext?.addEventListener("click", () => this.#nextSlide());
        // drag evt
        const { dragStart, dragging, dragEnd } = this.#dragHandlers();
        this.#wrapper.addEventListener("pointerdown", dragStart);
        document.addEventListener("pointermove", dragging);
        document.addEventListener("pointerup", dragEnd);
    }

    #setupSlides(option) {
        this.#slides.forEach((slide) => slide.style.width = `${this.#wrapper.clientWidth / option.slidesPerView}px`);
    }

    #translateSlides(customTranslateX = null) {
        const targetWidth = this.#slides[this.#currentIndex].clientWidth;
        const newTranslateX = customTranslateX === null ? -(this.#currentIndex * targetWidth) : customTranslateX;
        this.#wrapper.style.transform = `translate3d(${newTranslateX}px, 0, 0)`;
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
        if (this.#currentIndex < this.#slides.length - this.#option.slidesPerView) {
            this.#currentIndex++;
        }            
        this.#updateSlidePosition();
    }

    // slide 여러 개 한번에 이동(drag)
    #moveSlides(steps) {
        const newSlideIndex = this.#currentIndex + steps;
        this.#currentIndex = Math.max(
            0,
            Math.min(newSlideIndex, this.#slides.length - this.#option.slidesPerView)
        );
        this.#updateSlidePosition();
    }

    // 슬라이드 위치 변경
    #updateSlidePosition() {
        this.#wrapper.style.transitionDuration = "0.3s";
        this.#translateSlides();
        setTimeout(() => {
            this.#wrapper.style.transitionDuration = "0s";
        }, 300);

        this.#updateButtonStatus();
        this.#updateBulletStatus();
    }

    // 버튼 활성화 /비활성화
    #updateButtonStatus(tempIndex = null) {
        if(!this.#btnPrev || !this.#btnNext) return;
        const index = tempIndex === null ? this.#currentIndex : tempIndex;
        index === 0 
            ? this.#btnPrev.classList.add("ndslider-button-disabled") 
            : this.#btnPrev.classList.remove("ndslider-button-disabled");
        index === this.#slides.length - this.#option.slidesPerView 
            ? this.#btnNext.classList.add("ndslider-button-disabled") 
            : this.#btnNext.classList.remove("ndslider-button-disabled");
    }

    // pagination bullet active class 추가
    #updateBulletStatus(){
        if(!this.#pagination) return;
        const activeBullet = this.#pagination.querySelector(".ndslider-pagination-bullet-active");
        activeBullet.classList.remove("ndslider-pagination-bullet-active");
        this.#pagination.children[this.#currentIndex].classList.add("ndslider-pagination-bullet-active");
    }
    
    //페이지네이션 생성
    #createPagination() {
        if (!this.#pagination) return;
    
        const totalBullets = this.#slides.length - this.#option.slidesPerView + 1;
    
        this.#option.pagination.clickable 
            ? this.#pagination.classList.add("ndslider-pagination-clickable", "ndslider-pagination-bullets")
            : this.#pagination.classList.add("ndslider-pagination-bullets");
    
        // 생성
        for (let i = 0; i < totalBullets; i++) {
            const span = document.createElement("span");
            span.className = "ndslider-pagination-bullet";
            i === 0 && span.classList.add("ndslider-pagination-bullet-active");
            this.#pagination.appendChild(span);
        }
    
        // 페이지네이션 클릭 시 슬라이드 이동
        this.#pagination.addEventListener("click", (e) => {
            if (!e.currentTarget.classList.contains("ndslider-pagination-clickable") || !e.target.classList.contains("ndslider-pagination-bullet")) return;
            const children = Array.from(e.currentTarget.children);
            const index = children.indexOf(e.target);
            this.#currentIndex = index;
            this.#updateSlidePosition();
        });
    }
    

    //드래그 관련
    #dragHandlers() {
        const parent = this
        // dragStart 때 초기화 되는 변수
        let isDragging = false,
            dragStartX = 0,
            startTime = 0,
            currentTranslateX = 0,
            recentlySlided = false, // 최근에 슬라이드를 넘겼는지 체크
            target,
            lastDragEndTime = 0;

        function dragStart(e) {
            isDragging = true;
            dragStartX = e.pageX;
            startTime = new Date().getTime(); // 시작 시간 저장
            target = e.currentTarget;
            
            const slideWidth = target.clientWidth / parent.#option.slidesPerView;
            const deltaTime = new Date().getTime() - lastDragEndTime;
            deltaTime < 300 ? recentlySlided = true : recentlySlided = false;

            currentTranslateX = -(parent.#currentIndex * slideWidth);
        }

        function dragging(e) {
            if (!isDragging) return;
            target.style.transitionDuration = "0s";
            const distanceX = e.pageX - dragStartX;
            let newTranslateX = currentTranslateX + distanceX;

            if((parent.#currentIndex === 0 && distanceX > 0) || (parent.#currentIndex === parent.#slides.length - parent.#option.slidesPerView && distanceX < 0)) {
                newTranslateX = currentTranslateX + (distanceX / 3);
            }
        
            parent.#translateSlides(newTranslateX);
            
            let tempIndex = parent.#currentIndex - Math.sign(distanceX) * Math.round(Math.abs(distanceX) / target.clientWidth);
            tempIndex = Math.min(
                Math.max(tempIndex , 0),
                parent.#slides.length - 1
            );
            parent.#updateButtonStatus(tempIndex);
        }

        function dragEnd(e) {
            if (!isDragging) return;
        
            lastDragEndTime = new Date().getTime();
        
            const slideWidth = target.clientWidth / parent.#option.slidesPerView;
            const distanceX = e.pageX - dragStartX;
            const slidesToMove = Math.round(Math.abs(distanceX) / slideWidth);
            const slideThreshold = slideWidth * 0.5;
            const smallSlideThreshold = slideWidth * 0.05;
        
            if (recentlySlided && Math.abs(distanceX) > smallSlideThreshold) {
                // 연속적으로 드래그 할 때의 로직
                distanceX < 0 ? parent.#nextSlide() : parent.#prevSlide();
            } else if (Math.abs(distanceX) >= slideThreshold) {
                parent.#moveSlides(distanceX < 0 ? slidesToMove : -slidesToMove);
            } else {
                parent.#updateSlidePosition();
            }
        
            isDragging = false;
        }
        return { dragStart, dragging, dragEnd };
    }
}
