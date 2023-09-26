export default class NDSlider {
    #option;
    #elements;
    #currentIndex = 0;
    #intervalId;

    constructor(selector, option = {}) {
        this.#initializeOptions(option);
        this.#initializeElements(selector);
        this.#setupSlider();
        this.#startAutoSlide();
    }

    getSize(ele) {
        return this.#option.direction === "vertical" ? ele.clientHeight : ele.clientWidth;
    }

    getLastIndex() {
        return Math.ceil((this.#elements.slides.length - this.#option.slidesPerView) / this.#option.slidesPerGroup);
    }

    /* 초기화 및 설정 관련 메서드 */
    #initializeOptions(option) {
        option.slidesPerView = option.slidesPerView || 1;
        option.spaceBetween = option.spaceBetween || 0;
        option.slidesPerGroup = option.slidesPerGroup || 1;
        this.#option = option;
    }
    #initializeElements(selector) {
        const slider = document.querySelector(selector);
        this.#elements = {
            slider,
            wrapper: slider.querySelector(".ndslider-wrapper"),
            slides: slider.querySelectorAll(".ndslider-slide"),
            btnPrev: slider.querySelector(this.#option.navigation?.prevEl),
            btnNext: slider.querySelector(this.#option.navigation?.nextEl),
            pagination: slider.querySelector(this.#option.pagination?.el)
        };
    }
    #setupSlider() {
        const directionClass = this.#option.direction === "vertical" ? "ndslider-vertical" : "ndslider-horizontal";
        this.#elements.slider.classList.add(directionClass);
        this.#setupEvents();
        this.#createPagination();
        this.#setupSlides();
    }
    #setupEvents() {
        this.#elements.btnPrev?.addEventListener("click", () => {
            this.#restartAutoSlide();
            this.#prevSlide()
        });
        this.#elements.btnNext?.addEventListener("click", () => {
            this.#restartAutoSlide();
            this.#nextSlide()
        });
        const { dragStart, dragging, dragEnd } = this.#dragHandlers();
        this.#elements.wrapper.addEventListener("pointerdown", dragStart);
        document.addEventListener("pointermove", dragging);
        document.addEventListener("pointerup", dragEnd);
    }

    /* 슬라이드 조작 관련 메서드 */
    #setupSlides() {
        const { slidesPerView, spaceBetween } = this.#option;
        const totalSpaceBetween = spaceBetween * (slidesPerView - 1);

        const slideSize = (this.getSize(this.#elements.wrapper) - totalSpaceBetween) / slidesPerView;

        this.#elements.slides.forEach((slide, index) => {
            if(this.#option.direction === "vertical") {
                slide.style.height = `${slideSize}px`;
                slide.style.marginBottom = (index < this.#elements.slides.length - 1) ? `${spaceBetween}px` : "0px";
            } else {
                slide.style.width = `${slideSize}px`;
                slide.style.marginRight = (index < this.#elements.slides.length - 1) ? `${spaceBetween}px` : "0px";
            }
        });
        this.#updateSlidePosition();
    }
    #prevSlide() {
        if (this.#currentIndex > 0) this.#currentIndex--;
        this.#updateSlidePosition();
    }
    #nextSlide() {
        if (this.#currentIndex < this.getLastIndex()) {
            this.#currentIndex++;
        } else if(this.#option.autoplay?.delay && (this.#currentIndex === this.getLastIndex())) {
            this.#currentIndex = 0;
        }
        this.#updateSlidePosition();
    }
    // slide 여러 개 한번에 이동(drag)
    #moveSlides(steps) {
        const newSlideIndex = this.#currentIndex + steps;
        this.#currentIndex = Math.max(
            0,
            Math.min(newSlideIndex, this.getLastIndex())
        );

        this.#updateSlidePosition();
    }
    #updateSlidePosition() {
        this.#elements.wrapper.style.transitionDuration = "0.3s";
    
        const isLastSlide = this.#currentIndex === this.getLastIndex();
        if (isLastSlide && this.#option.slidesPerGroup && this.#elements.slides.length % this.#option.slidesPerGroup !== 0 ) {
            const targetSize = this.getSize(this.#elements.slides[0]) + this.#option.spaceBetween;
            const totalSlides = this.#elements.slides.length;
            const newTranslate = -((totalSlides - this.#option.slidesPerView) * targetSize);
            this.#translateSlides(newTranslate);
        } else {
            this.#translateSlides();
        }
    
        setTimeout(() => {
            this.#elements.wrapper.style.transitionDuration = "0s";
        }, 300);
    
        this.#updateButtonStatus();
        this.#updateBulletStatus();
    }
    
    #translateSlides(customTranslate = null) {
        const targetSize = this.getSize(this.#elements.slides[0]) + this.#option.spaceBetween;

        const newTranslate = customTranslate === null 
            ? -(this.#currentIndex * targetSize) * this.#option.slidesPerGroup 
            : customTranslate;

        const transformValue = this.#option.direction === "vertical"
            ? `translate3d(0, ${newTranslate}px, 0)`
            : `translate3d(${newTranslate}px, 0, 0)`;
    
        this.#elements.wrapper.style.transform = transformValue;
    }
    #startAutoSlide() {
        if(!this.#option.autoplay || !this.#option.autoplay.delay) return;
        this.#intervalId = setInterval(() => this.#nextSlide(),this.#option.autoplay.delay);
    }

    #stopAutoSlide() {
        if (this.#intervalId) {
            clearInterval(this.#intervalId);
            this.#intervalId = null;
        }
    }

    #restartAutoSlide() {
        this.#stopAutoSlide();
        this.#startAutoSlide();
    }

    /* UI 업데이트 관련 메서드*/
    #updateButtonStatus(tempIndex = null) {
        const { btnPrev, btnNext } = this.#elements;
        if(!btnPrev || !btnNext) return;
        const index = tempIndex === null ? this.#currentIndex : tempIndex;
        index <= 0 
            ? btnPrev.classList.add("ndslider-button-disabled") 
            : btnPrev.classList.remove("ndslider-button-disabled");
        index >= this.getLastIndex()
            ? btnNext.classList.add("ndslider-button-disabled") 
            : btnNext.classList.remove("ndslider-button-disabled");
    }
    #updateBulletStatus(){
        const { pagination } = this.#elements;
        if( !pagination ) return;
        const activeBullet = pagination.querySelector(".ndslider-pagination-bullet-active");
        activeBullet.classList.remove("ndslider-pagination-bullet-active");
        pagination.children[this.#currentIndex].classList.add("ndslider-pagination-bullet-active");
    }
    #createPagination() {
        const { pagination} = this.#elements;
        if (!pagination) return;
    
        const totalBullets = this.getLastIndex() + 1;
        const directionClass = this.#option.direction === "vertical" ? "ndslider-pagination-vertical" : "ndslider-pagination-horizontal";
        this.#option.pagination.clickable 
            ? pagination.classList.add("ndslider-pagination-clickable", "ndslider-pagination-bullets" , directionClass)
            : pagination.classList.add("ndslider-pagination-bullets" , directionClass);
    
        // 생성
        for (let i = 0; i < totalBullets; i++) {
            const span = document.createElement("span");
            span.className = "ndslider-pagination-bullet";
            i === 0 && span.classList.add("ndslider-pagination-bullet-active");
            pagination.appendChild(span);
        }
    
        pagination.addEventListener("click", (e) => {
            if (!e.currentTarget.classList.contains("ndslider-pagination-clickable") || !e.target.classList.contains("ndslider-pagination-bullet")) return;
            const children = Array.from(e.currentTarget.children);
            const index = children.indexOf(e.target);
            this.#currentIndex = index;
            this.#updateSlidePosition();
        });
    }

    //드래그 관련 메서드
    #dragHandlers() {
        const parent = this
        let isDragging = false,
            dragStartPoint = 0,
            startTime = 0,
            currentTranslatePos = 0,
            recentlySlided = false, // 최근에 슬라이드를 넘겼는지 체크
            target,
            lastDragEndTime = 0;

        function dragStart(e) {
            isDragging = true;
            dragStartPoint = parent.#option.direction === "vertical" ? e.pageY : e.pageX;
            startTime = new Date().getTime(); // 시작 시간 저장
            target = e.currentTarget;
            const slideSize = parent.getSize(parent.#elements.slides[0]) + parent.#option.spaceBetween;
            console.log(slideSize);
            const deltaTime = new Date().getTime() - lastDragEndTime;
            deltaTime < 300 ? recentlySlided = true : recentlySlided = false;
            parent.#stopAutoSlide();
            currentTranslatePos = parent.#currentIndex === parent.getLastIndex() &&  parent.#elements.slides.length % parent.#option.slidesPerGroup !== 0 
                ? -(parent.#currentIndex * slideSize) * parent.#option.slidesPerGroup + (slideSize * slidesPerGroup - 1)
                : -(parent.#currentIndex * slideSize) * parent.#option.slidesPerGroup;
        }

        function dragging(e) {
            if (!isDragging) return;
            target.style.transitionDuration = "0s";
            const distance = parent.#option.direction === "vertical"
                ? e.pageY - dragStartPoint
                : e.pageX - dragStartPoint;
            let newTranslatePos = currentTranslatePos + distance;

            if((parent.#currentIndex === 0 && distance > 0) || (parent.#currentIndex >=  parent.getLastIndex() && distance < 0) ) {
                newTranslatePos = currentTranslatePos + (distance / 3);
            }
        
            parent.#translateSlides(newTranslatePos);

            let targetSize = parent.getSize(target);
            
            let tempIndex = parent.#currentIndex - Math.sign(distance) * Math.round(Math.abs(distance) / targetSize);
            tempIndex = Math.min(
                Math.max(tempIndex , 0),
                parent.#elements.slides.length - 1
            );
            parent.#updateButtonStatus(tempIndex);
        }

        function dragEnd(e) {
            if (!isDragging) return;
        
            lastDragEndTime = new Date().getTime();
        
            const slideSize = parent.#option.slidesPerGroup > 1 
                ? parent.getSize(parent.#elements.wrapper)
                : parent.getSize(parent.#elements.slides[0]);
            const distance = parent.#option.direction === "vertical"
                ? e.pageY - dragStartPoint
                : e.pageX - dragStartPoint;
            const slidesToMove = Math.round(Math.abs(distance) / slideSize);
            const slideThreshold = slideSize * 0.5;
            const smallSlideThreshold = slideSize * 0.05;

            if (recentlySlided && Math.abs(distance) > smallSlideThreshold) {
                // 연속적으로 드래그 할 때의 로직
                distance < 0 ? parent.#nextSlide() : parent.#prevSlide();
            } else if (Math.abs(distance) >= slideThreshold) {
                parent.#moveSlides(distance < 0 ? slidesToMove : -slidesToMove);
            } else {
                parent.#updateSlidePosition();
            }
            parent.#restartAutoSlide(); 
            isDragging = false;
        }
        return { dragStart, dragging, dragEnd };
    }
}
