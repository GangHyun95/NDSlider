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
        const totalSlides = this.#elements.slides.length;
        const {slidesPerView, slidesPerGroup, grid: {rows}} = this.#option;
        const slidesToMove = slidesPerGroup * rows;
        const slidesPerPage = slidesPerView * rows;
    
        const lastIndex = Math.ceil((totalSlides - slidesPerPage) / slidesToMove);
    
        return lastIndex;
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
        if (rows > 1) {
            const totalSpaceBetween = spaceBetween * (slidesPerView - 1);
            const slideSize = (this.getSize(this.#elements.slides[0]) - totalSpaceBetween) / slidesPerView;
            const totalSlides = this.#elements.slides.length;
            const totalRows = Math.ceil((totalSlides / rows));

            this.#elements.slides.forEach((slide) => {
                slide.style[targetProPerty] = slideSize + "px";
            })

            const newSize = Math.ceil((slideSize + spaceBetween) * totalRows);

            this.#elements.wrapper.style[targetProPerty] =  newSize + "px";
            this.#elements.slider.classList.add("ndslider-grid");

            if(!isVertical) {
                this.#elements.slider.classList.add("ndslider-grid-column");
            }
        } else {
            const totalSpaceBetween = spaceBetween * (slidesPerView - 1);
            const slideSize = (this.getSize(this.#elements.slides[0]) - totalSpaceBetween) / slidesPerView;
            this.#elements.slides.forEach((slide) => {
                slide.style[targetProPerty] = slideSize + "px";
            })
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
        const { spaceBetween, grid : { rows }} = this.#option;
        const totalSlides = this.#elements.slides.length;
        const marginAddedSlideIndex = Math.ceil(totalSlides / rows);
        
        this.#elements.slides.forEach((slide, index) => {
            if(this.#option.direction === "vertical") {
                slide.style.width = rows > 1 && `calc((100% - ${spaceBetween * (rows - 1)}px) / ${rows})`;
                slide.style.marginBottom = (index < totalSlides - 1) ? `${spaceBetween}px` : "0px";
                slide.style.marginLeft = (rows > 1 && index >= marginAddedSlideIndex) && spaceBetween + "px";
            } else {
                slide.style.height = rows > 1 && `calc((100% - ${spaceBetween * (rows - 1)}px) / ${rows})`;
                slide.style.marginRight = (index < totalSlides - 1) ? `${spaceBetween}px` : "0px";
                slide.style.marginTop = (index % rows !== 0) && spaceBetween + "px";
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
        const { slidesPerGroup, slidesPerView, grid : {rows}} = this.#option;
        const totalSlides = this.#elements.slides.length;
        const slidesToMove = slidesPerGroup * rows;
        const slidesPerPage = slidesPerView * rows;
        console.log(totalSlides / slidesPerPage);
        const isLastSlide = this.#currentIndex === this.getLastIndex();
        // LastIndex && 남은 슬라이드 수가 slidesToMove 보다 작을 떄
        if (isLastSlide && totalSlides - (slidesToMove * this.#currentIndex) < slidesToMove ) {
            const slideMoveDistance = this.getSize(this.#elements.slides[0]) + this.#option.spaceBetween;
            const newTranslate = -(Math.ceil(totalSlides / slidesPerPage) * slideMoveDistance);
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
            const deltaTime = new Date().getTime() - lastDragEndTime;
            deltaTime < 300 ? recentlySlided = true : recentlySlided = false;
            parent.#stopAutoSlide();
            currentTranslatePos = parent.#currentIndex === parent.getLastIndex() &&  parent.#elements.slides.length % parent.#option.slidesPerGroup !== 0 
                ? -((parent.#elements.slides.length - parent.#option.slidesPerView) * slideSize)
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

            const slideSize = parent.#option.grid.rows <= 1 
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
