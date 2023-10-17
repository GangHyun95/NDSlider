export default class NDSlider {
    #option;
    #elements;
    #currentIndex = 0;
    #intervalId;
    #isTransitioning = false;

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
        const totalSlides = this.#elements.slides.length;
        const slidesToMove = slidesPerGroup * rows;
    
        if (loop) {
            // loop 모드에서의 마지막 인덱스 계산
            return Math.ceil((totalSlides - slidesPerGroup) / slidesToMove);
        } else {
            // 비 loop 모드에서의 마지막 인덱스 계산
            const slidesPerPage = slidesPerView * rows;
            return Math.ceil((totalSlides - slidesPerPage) / slidesToMove);
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
        const { spaceBetween, loop , grid : { rows }} = this.#option;
        let totalSlides = this.#elements.slides.length;
        const marginAddedSlideIndex = Math.ceil(totalSlides / rows);

        this.#cloneSlide();
        
        this.#elements.slides.forEach((slide, index) => {
            if(this.#option.direction === "vertical") {
                slide.style.width = rows > 1 && `calc((100% - ${spaceBetween * (rows - 1)}px) / ${rows})`;
                slide.style.marginBottom = (index < totalSlides - 1) ? `${spaceBetween}px` : "0px";
                slide.style.marginLeft = (rows > 1 && index >= marginAddedSlideIndex) && spaceBetween + "px";
            } else {
                slide.style.height = rows > 1 && `calc((100% - ${spaceBetween * (rows - 1)}px) / ${rows})`;
                slide.style.marginRight = loop ? spaceBetween + "px" : (index < totalSlides - 1) ? spaceBetween + "px" : "0px";
                slide.style.marginTop = (index % rows !== 0) && spaceBetween + "px";
            }
        });
    }

    #cloneSlide() {
        const { loop, slidesPerView } = this.#option;
        let totalSlides = this.#elements.slides.length;
        if(!loop) return;
        for(let i = 0 ; i < slidesPerView ; i ++) {
            const cloneFirst = this.#elements.slides[i].cloneNode(true);
            const cloneLast = this.#elements.slides[totalSlides - i - 1].cloneNode(true);
            cloneFirst.classList.add("clone");
            cloneLast.classList.add("clone");
            this.#elements.wrapper.appendChild(cloneFirst);
            this.#elements.wrapper.prepend(cloneLast);
        }
        this.#elements.slides = this.#elements.wrapper.querySelectorAll(".ndslider-slide")
        totalSlides = this.#elements.slides.length;
        this.#currentIndex = slidesPerView;
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
            console.log("DD");
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
        const { slidesPerGroup, slidesPerView, spaceBetween ,loop,  grid : {rows}} = this.#option;
        const totalSlides = this.#elements.slides.length;
        const slidesToMove = slidesPerGroup * rows;
        const slidesPerPage = slidesPerView * rows;
        const isLastSlide = this.#currentIndex === this.getLastIndex();
        const remainingSlides = totalSlides - (slidesToMove * this.#currentIndex) - slidesPerPage;
        const secondLastIndex = this.getLastIndex() - 1;
        const lastRemainingSlides = totalSlides - (slidesToMove * secondLastIndex) - slidesPerPage;
        const lastSlidesPerGroup = Math.ceil(lastRemainingSlides / rows);

        this.#elements.wrapper.style.transitionDuration = "0.3s";

        // LastIndex && 남은 슬라이드 수가 slidesToMove 보다 작을 떄
        if (!loop && isLastSlide && remainingSlides < slidesToMove) {
            const slideMoveDistance = this.getSize(this.#elements.slides[0]) + spaceBetween;
            let newTranslate;
            if (rows > 1) {
                newTranslate = -((secondLastIndex * slideMoveDistance) * this.#option.slidesPerGroup + slideMoveDistance * lastSlidesPerGroup);
            } else {
                const lastIndex = totalSlides - slidesPerView;
                newTranslate = -((lastIndex * slideMoveDistance));
            }
            this.#translateSlides(newTranslate);
        } else {
            this.#translateSlides();
        }

        const parent = this;
        this.#elements.wrapper.addEventListener("transitionstart", function callback() {
            if(!parent.#option.loop) return;
            parent.#isTransitioning = true;
            parent.#elements.wrapper.removeEventListener("transitionstart", callback);
        })

        this.#elements.wrapper.addEventListener("transitionend", function callback() {
            // parent.#elements.wrapper.style.transitionDuration = "0s";

            if(!parent.#option.loop ) return;

            const totalRealSlides = parent.#elements.slides.length - 2 * parent.#option.slidesPerView;

            if (parent.#currentIndex < parent.#option.slidesPerView) {
                parent.#elements.wrapper.style.transitionDuration = "0s";
                parent.#currentIndex = parent.#currentIndex + totalRealSlides;
                parent.#translateSlides(); // 새 인덱스로 이동
            } else if (parent.#currentIndex >= totalRealSlides + parent.#option.slidesPerView) {
                parent.#elements.wrapper.style.transitionDuration = "0s";
                parent.#currentIndex = parent.#currentIndex - totalRealSlides;
                parent.#translateSlides(); // 새 인덱스로 이동
            }
            parent.#isTransitioning = false;
            parent.#elements.wrapper.removeEventListener("transitionend", callback);
        })
    
        this.#updateButtonStatus();
        this.#updateBulletStatus();
    }
    
    #translateSlides(customTranslate = null) {
        const slideMoveDistance = this.getSize(this.#elements.slides[0]) + this.#option.spaceBetween;

        const newTranslate = customTranslate === null 
            ? -(this.#currentIndex * slideMoveDistance) * this.#option.slidesPerGroup 
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
            const totalRealSlides = this.#elements.slides.length - 2 * this.#option.slidesPerView; // 복제된 슬라이드 제외
            let realIndex = this.#currentIndex - slidesPerView; // 시작점 복제 슬라이드 제외
            if(!loop) {
                return this.#currentIndex;
            } else if (loop && realIndex < 0) {
                return totalRealSlides + realIndex;
            } else if (loop && realIndex >= totalRealSlides) {
                return realIndex - totalRealSlides;
            } else {
                return realIndex;
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
            this.#currentIndex = this.#option.loop ? index + this.#option.slidesPerView : index;
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
        const { direction, spaceBetween, slidesPerGroup, slidesPerView,  grid : { rows }} = parent.#option;
        const totalSlides = parent.#elements.slides.length;

        function dragStart(e) {
            isDragging = true;
            dragStartPoint = direction === "vertical" ? e.pageY : e.pageX;
            startTime = new Date().getTime(); // 시작 시간 저장
            target = e.currentTarget; //wrapper
            const deltaTime = new Date().getTime() - lastDragEndTime;
            deltaTime < 300 ? recentlySlided = true : recentlySlided = false;
            parent.#stopAutoSlide();
            
            const slidesToMove = slidesPerGroup * rows;
            const slidesPerPage = slidesPerView * rows;
            const isLastSlide = parent.#currentIndex === parent.getLastIndex();
            const remainingSlides = totalSlides - (slidesToMove * parent.#currentIndex) - slidesPerPage;
            const secondLastIndex = parent.getLastIndex() - 1;
            const lastRemainingSlides = totalSlides - (slidesToMove * secondLastIndex) - slidesPerPage;
            const lastSlidesPerGroup = Math.ceil(lastRemainingSlides / rows);
            const slideMoveDistance = parent.getSize(parent.#elements.slides[0]) + spaceBetween;

            if (isLastSlide && remainingSlides < slidesToMove) {
                if (rows > 1) {
                    currentTranslatePos = -((secondLastIndex * slideMoveDistance) * parent.#option.slidesPerGroup + slideMoveDistance * lastSlidesPerGroup);
                } else {
                    const lastIndex = totalSlides - slidesPerView;
                    currentTranslatePos = -((lastIndex * slideMoveDistance));
                }
            } else {
                currentTranslatePos = -(parent.#currentIndex * slideMoveDistance) * slidesPerGroup;
            }
        }

        function dragging(e) {
            if (!isDragging) return;
            target.style.transitionDuration = "0s";
            const distance = direction === "vertical"
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
                totalSlides - 1
            );
            parent.#updateButtonStatus(tempIndex);
        }

        function dragEnd(e) {
            if (!isDragging) return;
        
            lastDragEndTime = new Date().getTime();

            const slideSize = parent.getSize(parent.#elements.slides[0]) + spaceBetween;
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
