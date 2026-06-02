import { TutorialDrawingManager } from "./drawing-manager";
import { TutorialArgs } from "./models/tutorial-args";
import { TutorialStep } from "./models/tutorial-step";

export class TutorialAnimationManager {
    private currentStep: number = 0;
    private isTransitioning: boolean = false;
    private timeToNext: number = 0;
    public timeToNextStep: number | null = null;
    private args: TutorialArgs = new TutorialArgs();
    private drawingManager: TutorialDrawingManager | null = null;
    private onEnd: (() => void) | null = null;
    private state: TutorialStep[] | null = null;
    private pendingTimers: number[] = [];
    private readonly resizeHandler = () => this.resize();
    private lastFrameTime: number = 0
    private readonly DEFAULT_FRAME_TIME_MS = 16;//assume a frame rate of 60hz, this is used on first frame of the animation and if the animation is being resumed
    private currentControl: HTMLElement | null = null;
    private currentDomRect: DOMRect | null = null;
    private prevControl: HTMLElement | null = null;
    private prevDomRect: DOMRect | null = null;

    public initialise(args: TutorialArgs, onEndEvent: (() => void) | null): void {
        this.args = args;
        this.currentStep = 0;
        this.drawingManager = new TutorialDrawingManager();
        this.drawingManager.initialise(args, window.innerWidth, window.innerHeight, () => this.nextStep(), () => this.prevStep(), () => this.endTutorial());
        this.onEnd = onEndEvent;

        window.addEventListener("resize", this.resizeHandler);
    }

    public resetTutorial() {
        this.currentStep = 0;
    }

    private resize() {
        if (this.drawingManager && this.state) {
            this.drawingManager.resize(window.innerWidth, window.innerHeight);
            this.run(this.state);
        }
    }

    private prevStep(): void {
        if (this.currentStep > 0 && !this.isTransitioning && this.state) {
            this.currentStep -= 1;
            //reset the cached control items
            this.currentControl = null;
            this.currentDomRect = null;
            this.prevControl = null;
            this.prevDomRect = null;
            this.run(this.state)
        }
    }
    public endTutorial(): void {
        if (this.args.allowSkip) {
            window.removeEventListener("resize", this.resizeHandler);
            this.cancelPendingTimers()
            this.drawingManager?.destroy();
            if (this.onEnd != null) {
                this.onEnd();
            }
            return;
        }
    }
    private nextStep(): void {
        if (!this.isTransitioning && this.state) {
            this.timeToNextStep = 0;
            this.run(this.state)
        }
    }

    private getControl(element: HTMLElement | string | null): HTMLElement | null {
        if (element instanceof Element) {
            return element;
        }
        else if (!!element) {
            return document.querySelector(element);
        }
        else {
            return null;
        }
    }
    private scrollToElement(control: HTMLElement, currentRect: DOMRect): number {
        let parent = control.parentElement;
        //let immediateParent = control;
        const contTop = currentRect.top;
        //need to find the containing control that is scrollable
        while (parent != null) {
            if (parent.clientHeight < parent.scrollHeight) {
                //this indicates that this element is scrollable
                break;
            }
            //immediateParent = parent;
            parent = parent.parentElement;
        }

        //scroll height - total height
        //client height - visible height

        if (parent != null) {
            const middle = parent.clientHeight / 2;
            //if parent scroll height is over half way of visible element then start scrolling
            if (contTop > middle) {
                //try to keep elements in the middle of the element
                //control top is within the hidden element, so need to get the percentage
                const maxScroll = (parent.scrollHeight - parent.clientHeight)
                let scrollOffset = (contTop - middle);
                //if scroll has reached the bottom
                if (Math.round(parent.scrollTop) >= maxScroll) {
                    scrollOffset = 0;
                }
                //scroll to  = scroll height + difference between middle and top of next element
                let scrollVal = parent.scrollTop + scrollOffset
                //if we go over the item, just set it to the max
                if (scrollVal > maxScroll) {
                    scrollVal = maxScroll;
                }
                if (scrollVal > 0) {
                    //for the moment, use instant as there is a race condition between scrolling using browser methods
                    //and animation frames for this - believe this only happens if original scroll val is larger than max scroll 
                    //TODO - could just use instant scroll for that one scenario
                    //TODO - could use a LERP and manually set the scroll val to keep them in sync
                    parent.scrollTo({ top: scrollVal, behavior: "instant" } as ScrollToOptions);
                    return scrollOffset;
                }
            }
        }
        return 0;
    }
    public run(steps: TutorialStep[], timestamp: number = 0): void {
        this.drawingManager?.drawBackground();
        var step = steps[this.currentStep];
        var x = 0, y = 0, width = 0, height = 0, mesX = 0, mesY = 0;
        if (step.control != null) {
            const control: HTMLElement | null = this.currentControl || this.getControl(step.control);
            this.currentControl = control;

            if (control != null) {
                const bounds = this.currentDomRect || control.getBoundingClientRect();
                const scrollAmount = this.scrollToElement(control, bounds);
                this.currentDomRect = bounds;
                //need to position the circles better + centre better
                x = bounds.left;// + window.scrollX;
                y = bounds.top - scrollAmount;//get height as proportion of height of parent then scroll to that position,  offset comes off height of scrollable div + window.scrollY;
                mesX = bounds.right;
                mesY = bounds.bottom;
                width = control.offsetWidth / 2;
                height = control.offsetHeight / 2;
            }
            else {
                console.error(`Control ${step.control} cannot be found`);
            }
        }
        else {
            //if no control provided display a message centred on the screen
            x = mesX = (window.innerWidth / 2) - 250;
            y = mesY = (window.innerHeight / 2) - 150;
            width = 0;
            height = 0;
        }

        //if we are moving from one item to the next
        if (this.isTransitioning) {
            //if this is the first frame of animation, or if the animation is being resumed, set to the defailt delta
            const delta = this.lastFrameTime == 0 ? this.DEFAULT_FRAME_TIME_MS : Math.min(timestamp - this.lastFrameTime, this.DEFAULT_FRAME_TIME_MS);
            this.lastFrameTime = timestamp;
            this.timeToNext -= delta;
            if (this.timeToNext > 0) {
                var percentage = ((this.args?.transitionTimeMS ?? 0) - this.timeToNext) / (this.args?.transitionTimeMS ?? 1);
                if (this.currentStep > 0) {
                    var previousStep = steps[this.currentStep - 1];
                    const previousControl: HTMLElement | null = previousStep.control ? this.prevControl || this.getControl(previousStep.control) : null;
                    this.prevControl = previousControl;

                    let prevX = (window.innerWidth / 2);
                    let prevY = (window.innerHeight / 2);
                    if (previousControl) {
                        const previousControlRect = this.prevDomRect || previousControl.getBoundingClientRect()
                        this.prevDomRect = previousControlRect;
                        prevX = previousControlRect.left
                        prevY = previousControlRect.top;
                    }
                    x = this.lerp(prevX, x, percentage);
                    y = this.lerp(prevY, y, percentage);

                    var prevWidth = previousControl ? previousControl.offsetWidth / 2 : 10;
                    var prevHeight = previousControl ? previousControl.offsetHeight / 2 : 10;

                    width = this.lerp(prevWidth, width, percentage);
                    height = this.lerp(prevHeight, height, percentage);
                    requestAnimationFrame((timestamp) => this.run(steps, timestamp));
                }
            }
            else {
                this.isTransitioning = false;
            }
        }

        if (x && y && width && height) {
            this.drawingManager?.createCutoutBox(x, y, width * 2, height * 2);
        }
        else {
            //helper function just to ensure that the context state is restored as needed
            this.drawingManager?.restore();
        }

        //if we aren't moving to the next step we need to render the message to the user
        if (!this.isTransitioning) {

            //messages all should show centrally
            this.drawingManager?.drawMessage(mesX, mesY,
                step?.stepMessage ?? "",
                this.timeToNextStep == null,
                this.currentStep === 0,
                this.currentStep === steps.length - 1,
                this.currentStep + 1,
                steps.length);

            if (this.timeToNextStep != null && this.timeToNextStep <= 0) {
                if (steps[this.currentStep].callback != null) {
                    steps[this.currentStep].callback?.().then(() => {
                        //clear arc
                        this.currentStep++;
                        this.currentControl = null;
                        this.currentDomRect = null;
                        this.prevControl = null;
                        this.prevDomRect = null;

                        if (this.currentStep < steps.length) {
                            this.isTransitioning = true;
                            this.timeToNext = this.args.transitionTimeMS ?? 0;
                            this.timeToNextStep = steps[this.currentStep].durationS != null ? (steps[this.currentStep].durationS ?? 2) * 1000 : null;
                            requestAnimationFrame((timestamp) => this.run(steps, timestamp));
                        }
                        else {
                            window.removeEventListener("resize", this.resizeHandler)
                            this.cancelPendingTimers()
                            //need to remove the canvas if we have finished the process
                            //once we have reached the end of the steps we can just destroy without a timeout
                            this.drawingManager?.destroy();
                            if (this.onEnd != null) {
                                this.onEnd();
                            }
                            return;
                        }
                    });
                }
            }
            else if (this.timeToNextStep == null) {
                this.state = steps;
            }
            else {
                //No need to render all frames, just keep the message on screen for the specified time
                this.pendingTimers.push(setTimeout(() => this.run(steps), this.timeToNextStep));
                this.timeToNextStep = 0;
            }
        }

    }
    private cancelPendingTimers(): void {
        this.pendingTimers.forEach(id => clearTimeout(id));
        this.pendingTimers = [];
    }
    private lerp(pos1: number, pos2: number, t: number) {
        return (1 - t) * pos1 + t * pos2;
    }
}