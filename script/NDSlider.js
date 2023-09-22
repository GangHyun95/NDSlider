export default class NDSlider {
    #slider;
    #wrapper;
    #slides;
    #btnPrev;
    #btnNext;
    #pagination;
    #option;
    #currentIndex = 0;
    #isTransitioning = false;

    constructor(selector, option = {}) {
        // querySelector
        this.#slider = document.querySelector(selector);
        this.#wrapper = this.#slider.querySelector(".ndslider-wrapper");
        this.#slides = this.#wrapper.querySelectorAll(".ndslider-slide");
        this.#btnPrev = this.#slider.querySelector(option.navigation?.prevEl);
        this.#btnNext = this.#slider.querySelector(option.navigation?.nextEl);
        this.#pagination = this.#slider.querySelector(option.pagination?.el);
        option.slidesPerView = option.slidesPerView || 1;
        this.#option = option;

        this.#setupSlides(option);
        this.#initializeEvents();
        this.#updateButtonStatus();
        this.#createPagination();   
    }
    #setupSlides(option) {
        if(option.loop){
            for(let i = 0 ; i < option.slidesPerView ; i++ ) {
                const cloneFirst = this.#slides[i].cloneNode(true);
                const cloneLast = this.#slides[this.#slides.length - 1 - i].cloneNode(true);
                this.#wrapper.appendChild(cloneFirst);
                this.#wrapper.insertBefore(cloneLast, this.#wrapper.firstChild);
            }
            
            this.#slides = this.#wrapper.querySelectorAll(".ndslider-slide");
            this.#currentIndex = option.slidesPerView;
            this.#translateSlides();
        }
        this.#slides.forEach((slide) => {
            slide.style.width = `${this.#wrapper.clientWidth / option.slidesPerView}px`;
            slide.style.marginRight = `${this.#option.spaceBetween}px`;
        })

    }

    #translateSlides(customTranslateX = null) {
        const targetWidth = this.#wrapper.clientWidth / this.#option.slidesPerView;
        const newTranslateX = customTranslateX === null ? -(this.#currentIndex * targetWidth) : customTranslateX;
        this.#wrapper.style.transform = `translate3d(${newTranslateX}px, 0, 0)`;
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

    // 이전 slide
    #prevSlide(){
        if(this.#option.loop && this.#isTransitioning) return;
        this.#currentIndex--;
        if(!this.#option.loop && this.#currentIndex < 0) {
            this.#currentIndex = 0;
        }
        this.#updateSlidePosition();
    }
    //다음 slide
    #nextSlide(){
        if(this.#option.loop && this.#isTransitioning) return;
        this.#currentIndex++;
        if(!this.#option.loop && this.#currentIndex > this.#slides.length - 1) {
            this.#currentIndex = this.#slides.length - 1;
        }
        this.#updateSlidePosition();
    }
    //slide 여러 개 한번에 이동
    #moveSlides(steps) {
        const newSlideIndex = this.#currentIndex + steps;
        this.#currentIndex = Math.max(
            0,
            Math.min(newSlideIndex, this.#slides.length - 1)
        );
        this.#updateSlidePosition();
    }

    // 슬라이드 위치 변경
    #updateSlidePosition() {
        const parent = this;
        this.#wrapper.style.transitionDuration = "0.3s";
        this.#translateSlides();

        this.#wrapper.addEventListener("transitionstart",function callback(){
            if(!parent.#option.loop) return;
            parent.#isTransitioning = true;
            parent.#wrapper.removeEventListener("transitionstart",callback);
        });
        
        this.#wrapper.addEventListener("transitionend",function callback() {
            if(!parent.#option.loop) return;
            
            if(parent.#currentIndex === parent.#slides.length - 1) {
                parent.#wrapper.style.transitionDuration = "0s";
                parent.#currentIndex = 1;
                parent.#translateSlides();
            } else if (parent.#currentIndex === 0) {
                parent.#wrapper.style.transitionDuration = "0s";
                parent.#currentIndex = parent.#slides.length - 2;
                parent.#translateSlides();
            }
            parent.#isTransitioning = false;
            parent.#wrapper.removeEventListener("transitionend",callback);
        });

        this.#updateButtonStatus();
        this.#updateBulletStatus();
    }

    // 버튼 활성화 /비활성화
    #updateButtonStatus(tempIndex = null) {
        if(!this.#btnPrev || !this.#btnNext || this.#option.loop) return;
        const index = tempIndex === null ? this.#currentIndex : tempIndex;
        index === 0 
            ? this.#btnPrev.classList.add("ndslider-button-disabled") 
            : this.#btnPrev.classList.remove("ndslider-button-disabled");
        index === this.#slides.length - 1 
            ? this.#btnNext.classList.add("ndslider-button-disabled") 
            : this.#btnNext.classList.remove("ndslider-button-disabled");
    }

    // pagination bullet active class 추가
    #updateBulletStatus(){
        if(!this.#pagination) return;

        const getActiveIndex = () => {
            if (!this.#option.loop) return this.#currentIndex;

            if (this.#currentIndex === 0) return this.#slides.length - 3;
            if (this.#currentIndex === this.#slides.length - 1) return 0;
            return this.#currentIndex - 1;
        };

        const activeIndex = getActiveIndex();

        const activeBullet = this.#pagination.querySelector(".ndslider-pagination-bullet-active");
        activeBullet?.classList.remove("ndslider-pagination-bullet-active");
        this.#pagination.children[activeIndex]?.classList.add("ndslider-pagination-bullet-active");
    }


    //페이지네이션 생성
    #createPagination() {
        if(!this.#pagination) return;

        this.#option.pagination.clickable 
            ? this.#pagination.classList.add("ndslider-pagination-clickable", "ndslider-pagination-bullets")
            : this.#pagination.classList.add("ndslider-pagination-bullets");

        const slidesCount = this.#slides.length - (this.#option.loop ? 2 * this.#option.slidesPerView : 0);

        for(let i = 0 ; i < slidesCount ; i ++) {
            const span = document.createElement("span");
            span.className = "ndslider-pagination-bullet";
            i === 0 && span.classList.add("ndslider-pagination-bullet-active");
            this.#pagination.appendChild(span);
        }
        // 페이지네이션 클릭 시 슬라이드 이동
        this.#pagination.addEventListener("click", (e) => {
            if(!e.currentTarget.classList.contains("ndslider-pagination-clickable") || !e.target.classList.contains("ndslider-pagination-bullet")) return;
            const children = Array.from(e.currentTarget.children);
            const index = children.indexOf(e.target);
            this.#currentIndex = this.#option.loop ? index + 1 : index;
            this.#updateSlidePosition();
        }); 
    }


    //드래그 관련
    #dragHandlers() {
        const parent = this;
        let isDragging = false,
            dragStartX = 0,
            startTime = 0,
            currentTranslateX = 0,
            recentlySlided = false, // 최근에 슬라이드를 넘겼는지 체크
            lastDragEndTime = 0,
            target;

        function dragStart(e) {
            isDragging = true;
            dragStartX = e.pageX;
            startTime = new Date().getTime(); 
            target = e.currentTarget;

            target.style.transitionDuration = "0s";
            const deltaTime = new Date().getTime() - lastDragEndTime;
            deltaTime < 300 ? recentlySlided = true : recentlySlided = false;
        
            if(parent.#option.loop) {
                if (parent.#currentIndex === 0) {
                    parent.#currentIndex = parent.#slides.length - parent.#option.slidesPerView - 1;
                } else if (parent.#currentIndex === parent.#slides.length - 1) {
                    parent.#currentIndex = parent.#option.slidesPerView;
                }
            }
            currentTranslateX = -(parent.#currentIndex * (target.clientWidth / parent.#option.slidesPerView));
        }

        function dragging(e) {
            if (!isDragging) return;
            const distanceX = e.pageX - dragStartX;
            let newTranslateX = currentTranslateX + distanceX;

            if(!parent.#option.loop && ((parent.#currentIndex === 0 && distanceX > 0) || (parent.#currentIndex === parent.#slides.length - 1 && distanceX < 0))) {
                newTranslateX = currentTranslateX + (distanceX / 3);
            }
        
            parent.#translateSlides(newTranslateX);  // 변경된 부분
        
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
        
            const distanceX = e.pageX - dragStartX;
            const slidesToMove = Math.round(Math.abs(distanceX) / (target.clientWidth / parent.#option.slidesPerView)); //몇 칸 이동했는지
            
            //drag 연속적으로 할 떄 
            if (recentlySlided && Math.abs(distanceX) > target.clientWidth * 0.01) {
                parent.#isTransitioning = false;
                distanceX < 0 ? parent.#nextSlide() : parent.#prevSlide();
            } else if (Math.abs(distanceX) >= (target.clientWidth / parent.#option.slidesPerView) * 0.5) {
                distanceX < 0 ? parent.#moveSlides(slidesToMove) : parent.#moveSlides(-slidesToMove);
            } else {
                parent.#updateSlidePosition(); // 슬라이드의 위치를 업데이트
            }
            isDragging = false;
        }
        

        return { dragStart, dragging, dragEnd };
    }
}
