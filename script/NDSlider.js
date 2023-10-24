export default class NDSlider {
    #option;
    #elements;
    #currentIndex = 0;
    #intervalId;
    #isTransitioning = false;
    #totalSlides; //클론 전 슬라이드 총 갯수
    #nextLoopCounter;
    #prevLoopCounter;

    constructor(selector, option = {}) {
        this.#initializeOptions(option);
        this.#initializeElements(selector);
        this.#setupSlider();
        this.#startAutoSlide();
        this.#updateButtonStatus();
    }

    getSize(ele) {
        return this.#option.direction === "vertical" ? ele.getBoundingClientRect().height : ele.getBoundingClientRect().width;
    }

    getLastIndex() {
        const { slidesPerView, slidesPerGroup, loop, grid: { rows } } = this.#option;
        const slidesToMove = slidesPerGroup * rows;

        if (loop) {
            // loop 모드에서의 마지막 인덱스 계산
            return Math.ceil((this.#totalSlides - slidesPerGroup) / slidesToMove);
        } else {
            // 비 loop 모드에서의 마지막 인덱스 계산
            const slidesPerPage = slidesPerView * rows;
            return Math.ceil((this.#totalSlides - slidesPerPage) / slidesToMove);
        }
    }

    /* 초기화 및 설정 관련 메서드 */
    #initializeOptions(option) {
        const defaultOptions = {
            grid: {
                rows:1
            },
            slidesPerView : 1,
            spaceBetween : 0,
            slidesPerGroup : 1,
        }
        this.#option = {...defaultOptions , ...option};
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
        const { direction, spaceBetween, slidesPerView,  grid:{ rows } } = this.#option;
        const isVertical = direction === "vertical";
        const directionClass = isVertical ? "ndslider-vertical" : "ndslider-horizontal";
        const targetProPerty = isVertical ? "height" : "width";
        this.#elements.slider.classList.add(directionClass);

        const totalSpaceBetween = spaceBetween * (slidesPerView - 1);
        const slideSize = (this.getSize(this.#elements.slides[0]) - totalSpaceBetween) / slidesPerView;
        this.#elements.slides.forEach((slide) => {
            slide.style[targetProPerty] = slideSize + "px";
        });

        if (rows > 1) {
            const totalSlides = this.#elements.slides.length;
            const totalColumn = Math.ceil((totalSlides / rows));
            const wrapperSize = Math.ceil((slideSize + spaceBetween) * totalColumn);

            this.#elements.wrapper.style[targetProPerty] =  wrapperSize + "px";
            this.#elements.slider.classList.add("ndslider-grid");

            if( !isVertical ) {
                this.#elements.slider.classList.add("ndslider-grid-column");
            }
        } 
        this.#setupEvents();
        this.#setupSlides();
        this.#createPagination();
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
        const { spaceBetween, loop , grid : { rows }} = this.#option;
        this.#totalSlides = this.#elements.slides.length; // 클론 전 슬라이드 갯수 저장
        this.loopModeAddedValue = loop ? this.#totalSlides : 0;
        this.#nextLoopCounter = 0;
        this.#prevLoopCounter = 0;
        const marginAddedSlideIndex = Math.ceil(this.#totalSlides / rows);

        this.#cloneSlide();
        
        this.#elements.slides.forEach((slide, index) => {
            if(this.#option.direction === "vertical") {
                slide.style.width = rows > 1 && `calc((100% - ${spaceBetween * (rows - 1)}px) / ${rows})`;
                slide.style.marginBottom = loop ? spaceBetween + "px" : (index < this.#totalSlides - 1) ? `${spaceBetween}px` : "0px";
                slide.style.marginLeft = (rows > 1 && index >= marginAddedSlideIndex) && spaceBetween + "px";
            } else {
                slide.style.height = rows > 1 && `calc((100% - ${spaceBetween * (rows - 1)}px) / ${rows})`;
                slide.style.marginRight = loop ? spaceBetween + "px" : (index < this.#totalSlides - 1) ? spaceBetween + "px" : "0px";
                slide.style.marginTop = (index % rows !== 0) && spaceBetween + "px";
            }
        });
    }

    #cloneSlide() {
        const { loop, slidesPerView } = this.#option;

        if(!loop) return;
        for(let i = 0 ; i < this.#totalSlides ; i++) {
            const cloneFirst = this.#elements.slides[i].cloneNode(true);
            const cloneLast = this.#elements.slides[this.#totalSlides - i - 1].cloneNode(true);
            cloneFirst.classList.add("clone");
            cloneLast.classList.add("clone");
            this.#elements.wrapper.appendChild(cloneFirst);
            this.#elements.wrapper.prepend(cloneLast);
        }

        this.#elements.slides = this.#elements.wrapper.querySelectorAll(".ndslider-slide")
        this.#translateSlides();
    }

    #prevSlide() {
        const { loop } = this.#option;
        if(loop && this.#isTransitioning) return;
        this.#currentIndex--;
        if(!loop && this.#currentIndex < 0) {
            this.#currentIndex = 0;
        }
        this.#updateSlidePosition();
    }
    
    #nextSlide() {
        const { loop, autoplay } = this.#option;

        if(loop && this.#isTransitioning) return;
        this.#currentIndex++;
        if (!loop && this.#currentIndex > this.getLastIndex()) {
            this.#currentIndex = this.getLastIndex();
            /** */
        } else if(!loop && autoplay?.delay && (this.#currentIndex === this.getLastIndex())) {
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

        if(this.#option.loop) this.#currentIndex = newSlideIndex;

        this.#updateSlidePosition();
    }

    #calculateTranslateValue() {
        const { spaceBetween, slidesPerGroup, slidesPerView, loop, grid : { rows }} = this.#option;
        const slidesToMove = slidesPerGroup * rows;
        const slidesPerPage = slidesPerView * rows;
        const isLastSlide = this.#currentIndex === this.getLastIndex();
        const remainingSlides = this.#totalSlides - (slidesToMove * this.#currentIndex) - slidesPerPage;
        const slideMoveDistance = this.getSize(this.#elements.slides[0]) + spaceBetween;

        let newTranslate;

        if(isLastSlide && remainingSlides < slidesToMove) {
            if (rows > 1) {
                const secondLastIndex = this.getLastIndex() - 1;
                const lastRemainingSlides = this.#totalSlides - (slidesToMove * secondLastIndex) - slidesPerPage;
                const lastSlidesPerGroup = Math.ceil(lastRemainingSlides / rows);
                newTranslate = -((secondLastIndex * slideMoveDistance) * this.#option.slidesPerGroup + slideMoveDistance * lastSlidesPerGroup);
            } else {
                if(loop) {
                    newTranslate = -((this.#currentIndex + this.loopModeAddedValue / slidesPerGroup) * slideMoveDistance) * slidesPerGroup;
                    
                }
                if(!loop) {
                    const lastIndex = this.#totalSlides - slidesPerView;
                    newTranslate = -((lastIndex * slideMoveDistance));
                }
            }
        } else {
            newTranslate = -((this.#currentIndex + this.loopModeAddedValue / slidesPerGroup) * slideMoveDistance) * slidesPerGroup;
            // if (this.#totalSlides % slidesPerGroup !== 0 && this.#currentIndex >= this.getLastIndex()) {
            //     const slidesAtEnd = this.#totalSlides % slidesPerGroup;
            //     newTranslate = -(slideMoveDistance * (this.#totalSlides - slidesAtEnd));
            // }
        }
        return newTranslate;
    }

    #updateSlidePosition() {
        this.#elements.wrapper.style.transitionDuration = "0.3s";

        // LastIndex && 남은 슬라이드 수가 slidesToMove 보다 작을 떄
        this.#translateSlides(this.#calculateTranslateValue());

        this.handleTransitionStart = this.#handleTransitionStart.bind(this) ;
        this.handleTransitionEnd = this.#handleTransitionEnd.bind(this);

        this.#elements.wrapper.addEventListener("transitionstart", this.handleTransitionStart);
        this.#elements.wrapper.addEventListener("transitionend", this.handleTransitionEnd);

        this.#updateButtonStatus();
        this.#updateBulletStatus();
    }

    #handleTransitionStart() {
        if(!this.#option.loop) return;
        this.#isTransitioning = true;
        this.#elements.wrapper.removeEventListener("transitionstart", this.handleTransitionStart);
    }

    #handleTransitionEnd() {
        // parent.#elements.wrapper.style.transitionDuration = "0s";
        const { slidesPerGroup } = this.#option;
        if(!this.#option.loop ) return;
        if (this.#currentIndex < 0) {
            if(this.#totalSlides % slidesPerGroup !== 0) {
                if(this.#prevLoopCounter === 0) {
                    this.loopModeAddedValue = this.#totalSlides - (slidesPerGroup - (this.#totalSlides % slidesPerGroup));
                } else {
                    if(this.loopModeAddedValue <= 0) {
                        this.loopModeAddedValue = 8;
                        this.#prevLoopCounter = 0;
                    } else {
                        this.loopModeAddedValue -= slidesPerGroup - (this.#totalSlides % slidesPerGroup);
                        console.log(this.loopModeAddedValue);
                    }
                }
                this.#prevLoopCounter++;
            }
            this.#elements.wrapper.style.transitionDuration = "0s";
            this.#currentIndex = this.getLastIndex();
            this.#translateSlides(); 
        } else if (this.#currentIndex > this.getLastIndex()) {
            if(this.#totalSlides % slidesPerGroup !== 0) {
                if(this.#nextLoopCounter === 0) {
                    this.loopModeAddedValue = slidesPerGroup - (this.#totalSlides % slidesPerGroup);
                } else {
                    if(this.loopModeAddedValue >= 10) {
                        this.loopModeAddedValue = 2;
                        this.#nextLoopCounter = 0;
                    } else {
                        this.loopModeAddedValue += slidesPerGroup - (this.#totalSlides % slidesPerGroup);
                    }
                }

                this.#nextLoopCounter++;
            }
            this.#elements.wrapper.style.transitionDuration = "0s";
            this.#currentIndex = 0;
            this.#translateSlides(); // 새 인덱스로 이동
        }
        this.#isTransitioning = false;
        this.#elements.wrapper.removeEventListener("transitionend", this.handleTransitionEnd);
    }
    
    #translateSlides(customTranslate = null) {
        const { loop, slidesPerView } = this.#option;
        const slideMoveDistance = this.getSize(this.#elements.slides[0]) + this.#option.spaceBetween;

        const newTranslate = customTranslate === null 
            ? -((this.#currentIndex + this.loopModeAddedValue / this.#option.slidesPerGroup) * slideMoveDistance) * this.#option.slidesPerGroup 
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
        if(!btnPrev || !btnNext || this.#option.loop) return;
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
        const { slidesPerView, loop } = this.#option;

        if( !pagination ) return;
        const getActiveIndex = () => {
            if(!loop) {
                return this.#currentIndex;
            } else if (loop && this.#currentIndex < 0) {
                return this.getLastIndex();
            } else if (loop && this.#currentIndex > this.getLastIndex()) {
                return 0;
            } else {
                return this.#currentIndex;
            }
        };

        const activeIndex = getActiveIndex();

        const activeBullet = pagination.querySelector(".ndslider-pagination-bullet-active");
        activeBullet?.classList.remove("ndslider-pagination-bullet-active");
        pagination.children[activeIndex]?.classList.add("ndslider-pagination-bullet-active");
    }
    
    #createPagination() {
        const { pagination } = this.#elements;
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
            this.#restartAutoSlide();
            const children = Array.from(e.currentTarget.children);
            const index = children.indexOf(e.target);
            this.#currentIndex = index;
            this.#updateSlidePosition();
        });
    }

    //드래그 관련 메서드
    #dragHandlers() {
        const parent = this;
        let isDragging = false,
            dragStartPoint = 0,
            startTime = 0,
            currentTranslatePos = 0,
            recentlySlided = false, // 최근에 슬라이드를 넘겼는지 체크
            target,
            lastDragEndTime = 0;
        const { direction, spaceBetween, slidesPerGroup, loop } = parent.#option;

        function dragStart(e) {
            isDragging = true;
            dragStartPoint = direction === "vertical" ? e.pageY : e.pageX;
            startTime = new Date().getTime(); // 시작 시간 저장
            target = e.currentTarget; //wrapper
            const deltaTime = new Date().getTime() - lastDragEndTime;
            deltaTime < 300 ? recentlySlided = true : recentlySlided = false;
            parent.#stopAutoSlide();

            currentTranslatePos = parent.#calculateTranslateValue();
        }

        function dragging(e) {
            if (!isDragging) return;
            target.style.transitionDuration = "0s";
            const distance = direction === "vertical"
                ? e.pageY - dragStartPoint
                : e.pageX - dragStartPoint;
            let newTranslatePos = currentTranslatePos + distance;

            if(!loop && ((parent.#currentIndex === 0 && distance > 0) || (parent.#currentIndex >=  parent.getLastIndex() && distance < 0)) ) {
                newTranslatePos = currentTranslatePos + (distance / 3);
            }
        
            parent.#translateSlides(newTranslatePos);

            let targetSize = parent.getSize(target);
            let tempIndex = parent.#currentIndex - Math.sign(distance) * Math.round(Math.abs(distance) / targetSize);
            tempIndex = Math.min(
                Math.max(tempIndex , 0),
                parent.#totalSlides - 1
            );
            parent.#updateButtonStatus(tempIndex);
        }

        function dragEnd(e) {
            if (!isDragging) return;
        
            lastDragEndTime = new Date().getTime();

            const slideSize = loop ? parent.getSize(parent.#elements.slides[0]) * (slidesPerGroup - 1 ) : parent.getSize(parent.#elements.slides[0]) + spaceBetween;
            const distance = direction === "vertical"
                ? e.pageY - dragStartPoint
                : e.pageX - dragStartPoint;
            const slidesToMove = Math.round(Math.abs(distance) / slideSize);
            const slideThreshold = slidesPerGroup > 1 
                ? slideSize
                : slideSize * 0.5;
            const smallSlideThreshold = slideSize * 0.05;

            if (recentlySlided && Math.abs(distance) > smallSlideThreshold) {
                // 연속적으로 드래그 할 때의 로직
                parent.#isTransitioning = false;
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