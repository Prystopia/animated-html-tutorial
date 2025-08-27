
export class TutorialArgs
{
    public frameInterval: number|null =  1000/60;
    public transitionTimeS: number|null = 400;
    public cutout: "Box"|"Oval" = "Box";
    public font: string = "19px Arial";
    public overlayColour: string = "rgba(100,100,100,0.8)"
    public showTutorialOnce: boolean = true;
    public tutorialIden: string = `prys-at-seen-${window.location.href}`;
    public allowSkip: boolean = false;
    public zIndex: string = "2";

}
export class TutorialStep
{
    public control:string|null|HTMLElement = null;
    public stepMessage: string|null = null;
    public durationS: number|null = null;
    public callback?: () => Promise<void> | null = null;
}

export class TutorialDrawingManager
{
    private canvas: HTMLCanvasElement|null  = null;
    private ctx: CanvasRenderingContext2D|null = null;
    private args: TutorialArgs|null = null;

    private prevBounds: number[] = [];
    private nextBounds: number[] = [];
    private skipBounds: number[] = [];
    private nextCallback:() => void | null = null;
    private prevCallback: () => void | null = null
    private endCallback:() => void | null = null;

    public initialise(args: TutorialArgs, nextCallback: () => void, prevCallback: () => void, endCallback: () => void): void
    {
        this.args = args;
        this.nextCallback = nextCallback;
        this.prevCallback = prevCallback;
        this.endCallback = endCallback;
        this.canvas = document.createElement("canvas");
        this.canvas.addEventListener("click", (ev) =>  this.handleClick(ev));
        //TODO - needs to be configurable to ensure we don't sit under existing elements
        this.canvas.style.zIndex = this.args.zIndex;
		this.canvas.style.position = "fixed";
		this.canvas.setAttribute("width", `${window.innerWidth}px`);
		this.canvas.setAttribute("height", `${window.innerHeight}px`);
		this.canvas.style.display = "block";
		this.canvas.style.top = "0";
		this.canvas.style.left = "0";
        this.canvas.style.right = "0";
        this.canvas.style.bottom = "0";

        document.body.appendChild(this.canvas);
		this.ctx = this.canvas.getContext("2d")
    }

    public createArc(x:number, y:number, rad:number): void
    {
        if(this.ctx != null)
        {
            this.ctx.beginPath();
            this.ctx.arc(x,y,rad,0,2*Math.PI)
            this.ctx.stroke();
            this.ctx.clip();
            this.clear();
            this.ctx.restore();
        }
    }

    public drawBackground(): void
    {
        this.clear();
        if(this.ctx != null && this.canvas != null && this.args != null)
        {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.fillStyle = this.args.overlayColour;
            this.ctx.fillRect(0,0, this.canvas.width, this.canvas.height);

            if(this.args.allowSkip)
            {
                this.ctx.save();
                this.ctx.font = this.args.font.replace("19px", "50px");
                const skipText: string = "Click here to close";
                const textMetrics = this.ctx.measureText(skipText);
                const width = textMetrics.width;
                const x = (this.canvas.width - width) / 2;
                const y = this.canvas.height - 100;
                this.ctx.strokeStyle = this.ctx.fillStyle;
                this.ctx.fillText(skipText, x, y);
                this.ctx.beginPath();
                this.ctx.moveTo(x - 20, y - 50);
                this.ctx.lineTo(x + width + 20, y - 50);
                this.ctx.lineTo(x + width + 20, y + 20);
                this.ctx.lineTo(x - 20, y + 20);
                this.ctx.closePath();
                this.ctx.stroke();
                //set the bounding box for click recognition
                this.skipBounds[0] = x - 20; //topLeftX
                this.skipBounds[1] = y - 50; // topLeftY
                this.skipBounds[2] = width + 20; // width;
                this.skipBounds[3] = 70; // height;

                this.ctx.restore();
            }
        }
    }

    public createCutoutBox(x:number, y: number, width: number, height:number): void
    {
        //instead of just a straight circle we need to have a max height and width around the control we draw to and then use an oval, avoids having large controls with hugh circles
        if(this.ctx != null)
        {
            this.ctx.beginPath();
            this.ctx.moveTo(x - 5,y - 5);
            this.ctx.lineTo(x + width + 5, y - 5);
            this.ctx.lineTo(x + width + 5, y + 5 + height);
            this.ctx.lineTo(x - 5, y + 5 + height);			
            this.ctx.stroke();
            this.ctx.clip();
            this.clear();
            this.ctx.restore();
        }
    }

    public handleClick(mouseEvent: MouseEvent): void
    {
        //check if the mouse click is within the prev or next bounding boxes
        const x = mouseEvent.clientX;
        const y = mouseEvent.clientY;

        if(x > this.prevBounds[0] && x < this.prevBounds[0] + this.prevBounds[2]
            && y > this.prevBounds[1]  && y < this.prevBounds[1] + this.prevBounds[3])
        {
             this.prevCallback();
             return;
        }

         if(x > this.nextBounds[0] && x < this.nextBounds[0] + this.nextBounds[2]
            && y > this.nextBounds[1]  && y < this.nextBounds[1] + this.nextBounds[3])
        {
            this.nextCallback();
            return;
        }

       

        if(this.args.allowSkip && x > this.skipBounds[0] && x < this.skipBounds[0] + this.skipBounds[2]
            && y > this.skipBounds[1]  && y < this.skipBounds[1] + this.skipBounds[3])
            {
                
                this.endCallback();
                return;
            }
    }

    public drawMessage(x: number,y: number, message: string, isManualStep: boolean): void
    {
        const nextPrevWidth = 25;
        let maxWidth = 500;

        if(this.ctx != null && this.args != null)
        {
            //need to handle wrapping of text
            this.ctx.font = this.args.font;
            //var textMeasure = this.ctx.measureText(message);
            //var textWidth = textMeasure.width + 20;

            //break on spaces
            var words = message.split(" ");
            const lines: string[] = [words[0]];
            let lineIndex = 0;
            let count = 1;
            while(count < words.length)
            {
                let currentMessage = lines[lineIndex];

                let width = this.ctx.measureText(`${currentMessage} ${words[count]}`);
                //adding the new word pushes it over the boundary, so start a new line
                if((width.width + 20) > maxWidth)
                {
                    lineIndex++;
                    lines[lineIndex] = words[count];
                }
                else
                {
                    lines[lineIndex] = `${currentMessage} ${words[count]}`;
                }

                count++;
            }

            if(lines.length == 1)
            {
                //if only a single line of text, we may be able to reduce the width of the box
                maxWidth = this.ctx.measureText(lines[0]).width + 20
            }

            if(isManualStep)
            {
                maxWidth += (nextPrevWidth * 2);
            }

            var textHeight = 25;
            const height =  (textHeight * lines.length) + 25;
            
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.fillStyle = "#FFFFFF";
            this.ctx.strokeStyle = "#000000";

            let boxLeft = x;
            //check if width goes off the page
            if(x + maxWidth > window.innerWidth)
            {
                boxLeft = x - maxWidth;
            }

            let boxHeight = y;
            if(boxHeight + height > window.innerHeight)
            {
                //this message will overflow off the bottom of the screen
                boxHeight = y - height;
            }
            this.ctx.beginPath();
            this.ctx.moveTo(boxLeft, boxHeight);
            //this.ctx.lineTo(x + textWidth, y);
            //this.ctx.lineTo(x + textWidth, y + textHeight);
            this.ctx.lineTo(boxLeft + maxWidth, boxHeight);
            this.ctx.lineTo(boxLeft + maxWidth, boxHeight + height);
            this.ctx.lineTo(boxLeft, boxHeight + height);
            this.ctx.closePath();
            this.ctx.stroke();
            this.ctx.fill();

            if(isManualStep)
            {
                this.ctx.fillStyle = "#000000";
                this.ctx.moveTo(boxLeft + nextPrevWidth, boxHeight);
                this.ctx.lineTo(boxLeft + nextPrevWidth, boxHeight + height);
                this.ctx.stroke();
                let metrics  = this.ctx.measureText(">");
                let width = metrics.width;
                let txtHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
                const leftOffset = (nextPrevWidth - width) / 2;
                const topOffset  = (height - txtHeight);
                this.ctx.fillText("<", boxLeft + leftOffset, boxHeight + topOffset);
                this.ctx.save();
                this.ctx.font = this.args.font.replace("19px", "10px");
                let labelMetrics = this.ctx.measureText("Prev")
                let labelWidth = labelMetrics.width;
                let labelTxtHeight = labelMetrics.fontBoundingBoxAscent + labelMetrics.fontBoundingBoxDescent;
                const leftLabelOffset = (nextPrevWidth - labelWidth) / 2;
                const topLabelOffset  = (height - labelTxtHeight);

                
                this.ctx.fillText("Prev", boxLeft + leftLabelOffset, boxHeight + topLabelOffset);
                this.ctx.restore();
                this.ctx.moveTo((boxLeft + maxWidth) - nextPrevWidth, boxHeight);
                this.ctx.lineTo((boxLeft + maxWidth) - nextPrevWidth, boxHeight + height);
                this.ctx.stroke();
                this.ctx.beginPath();
                this.ctx.fillText(">", ((boxLeft + maxWidth) - nextPrevWidth) + leftOffset, boxHeight + topOffset);
                this.ctx.save();
                this.ctx.font = this.args.font.replace("19px", "10px");
                this.ctx.fillText("Next", ((boxLeft + maxWidth) - nextPrevWidth) + leftLabelOffset, boxHeight + topLabelOffset);
                this.ctx.restore();

                //set the bounding box for click recognition
                this.prevBounds[0] = boxLeft; //topLeftX
                this.prevBounds[1] = boxHeight; // topLeftY
                this.prevBounds[2] = nextPrevWidth; // width;
                this.prevBounds[3] = boxHeight; // height;

                this.nextBounds[0] = (boxLeft + maxWidth) - nextPrevWidth; //topLeftX
                this.nextBounds[1] = boxHeight; // topLeftY
                this.nextBounds[2] = nextPrevWidth; // width;
                this.nextBounds[3] = boxHeight; // height;
            }
            
            //me.ctx.fillRect(x,y, 250, 150);
            this.ctx.beginPath();
            
            const leftOffset = 10 + ((isManualStep)? nextPrevWidth  : 0);

            this.ctx.fillStyle = "#000000";
            for(let i = 0; i < lines.length; i++)
            {
                this.ctx.fillText(lines[i], boxLeft + leftOffset, boxHeight + 25 + (textHeight * i));
            }
            
            this.ctx.restore();
        }

    }

	private clear(): void
    {
        if(this.ctx != null && this.canvas != null)
        {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    public destroy()
    {
        this.ctx = null;
        if(this.canvas != null)
        {
            this.canvas.removeEventListener("click", (ev) => this.handleClick(ev));
            document.body.removeChild(this.canvas);
        }
        this.canvas = null;
    }
}

export class TutorialAnimationManager
{
	private currentStep: number = 0;
    private isTransitioning: boolean = false;
    private timeToNext: number = 0;
    public timeToNextStep: number|null = null;
    private args: TutorialArgs = new TutorialArgs();
    private drawingManager: TutorialDrawingManager|null = null;
    private onEnd: (()=>void)|null = null;
    private state:TutorialStep[]|null = null;

    public initialise(args: TutorialArgs, onEndEvent: (()=>void)|null): void
    {
        this.args = args;
        this.drawingManager = new TutorialDrawingManager();
        this.drawingManager.initialise(args, () => this.nextStep(), () => this.prevStep(), () => this.endTutorial());
        this.onEnd = onEndEvent;
    }

    private prevStep(): void
    {
        if(this.currentStep > 0 && !this.isTransitioning)
        {
            this.currentStep -= 1;
            this.run(this.state)
        }
    }
    public endTutorial(): void
    {
        if(this.args.allowSkip)
        {
           this.drawingManager?.destroy();
            if(this.onEnd != null)
            {
                this.onEnd();
            }
            return;
        }
    }
    private nextStep(): void
    {
        if(!this.isTransitioning)
        {
            this.timeToNextStep = 0;
            this.run(this.state)
        }
    }

    private getControl(element: HTMLElement|string|null): HTMLElement|null
    {
        if(element instanceof Element)
        {
            return element;
        }
        else if(!!element)
        {
            return document.querySelector(element);
        }
        else
        {
            return null;
        }
    }
    private scrollToElement(control: HTMLElement, offset: number): number
    {
        /*const visibleRange = (this.elementToFollow.nativeElement.clientHeight / this.elementToFollow.nativeElement.scrollHeight) * 100;
                //start from 100%;
              const top = 100 - ((this.elementToFollow.nativeElement.scrollTop / this.elementToFollow.nativeElement.scrollHeight) * 100);
              this.first = (Math.ceil((top) - Math.ceil(visibleRange)) - 1) + "%";
              this.second = Math.ceil((top) - Math.ceil(visibleRange)) + "%";
              this.third = (Math.ceil(top)) + "%";
              this.fourth = (Math.ceil(top) + 1) + "%"*/
        let parent = control.parentElement;
        //let immediateParent = control;
         const contTop = control.getBoundingClientRect().top;
        //need to find the containing control that is scrollable
        while(parent != null)
        {
            if(parent.clientHeight <  parent.scrollHeight)
            {
                //this indicates that this element is scrollable
                break;
            }
            //immediateParent = parent;
            parent = parent.parentElement;
        }
       
        //scroll height - total height
        //client height - visible height
        
        if(parent != null)
        {
            const middle = parent.clientHeight / 2;
            //if parent scroll height is over half way of visible element then start scrolling
            if(contTop > middle)
            {
                //try to keep elements in the middle of the element
                //control top is within the hidden element, so need to get the percentage
                const maxScroll = (parent.scrollHeight - parent.clientHeight)
                let scrollOffset = (contTop - middle);
                //if scroll has reached the bottom
                if(Math.round(parent.scrollTop) >= maxScroll)
                {
                    scrollOffset = 0;
                }
                //scroll to  = scroll height + difference between middle and top of next element
                let scrollVal = parent.scrollTop + scrollOffset
                //if we go over the item, just set it to the max
                if(scrollVal > maxScroll)
                {
                    scrollVal = maxScroll;
                }
                if(scrollVal > 0)
                { 
                    //for the moment, use instant as there is a race condition between scrolling using browser methods
                    //and animation frames for this - believe this only happens if original scroll val is larger than max scroll 
                    //TODO - could just use instant scroll for that one scenario
                    //TODO - could use a LERP and manually set the scroll val to keep them in sync
                    parent.scrollTo({top: scrollVal, behavior: "instant"} as ScrollToOptions);
                    return scrollOffset;
                }
            }
        }
        return 0;
    }
    public run(steps: TutorialStep[]): void
    {
        this.drawingManager?.drawBackground();
        var step = steps[this.currentStep];
		var x = 0, y = 0, width = 0, height = 0, mesX = 0, mesY = 0;
        if(step.control != null)
        {
            const control: HTMLElement|null = this.getControl(step.control);
        
            if(control != null)
            {
                const scrollAmount = this.scrollToElement(control, 50);
                const bounds = control.getBoundingClientRect();
                //need to position the circles better + centre better
                x = bounds.left;// + window.scrollX;
                y = bounds.top - scrollAmount;//get height as proportion of height of parent then scroll to that position,  offset comes off height of scrollable div + window.scrollY;
                mesX = bounds.right;
                mesY = bounds.bottom;
                width = control.offsetWidth / 2;
                height = control.offsetHeight / 2;
            }
            else
            {
                console.error(`Control ${step.control} cannot be found`);
            }
        }
        else
        {
            //if no control provided display a message centred on the screen
            x = mesX = (window.innerWidth / 2) - 250;
            y = mesY = (window.innerHeight / 2) - 150;
            width = 0;
            height = 0;
        }
		
        //if we are moving from one item to the next
        if(this.isTransitioning)
        {
            this.timeToNext -= this.args?.frameInterval ?? 0;
            //console.log("Transitioning", this.timeToNext, this.args.transitionTimeS);
            if(this.timeToNext > 0)
            {
                var percentage = ((this.args?.transitionTimeS ?? 0) - this.timeToNext)/(this.args?.transitionTimeS ?? 1);
                //TODO - add check for 0 index - shouldn't happen as we can't transition before having at least one step
                var previousStep = steps[this.currentStep - 1];
                const previousControl: HTMLElement|null = previousStep.control ? this.getControl(previousStep.control) : null;
                var prevX = previousControl ? previousControl.getBoundingClientRect().left : (window.innerWidth / 2);
                var prevY = previousControl ? previousControl.getBoundingClientRect().top : (window.innerHeight / 2);
                x = this.lerp(prevX, x, percentage);
                y = this.lerp(prevY, y, percentage);
                //console.log("Position", x, y, prevX, prevY, percentage);
                
                var prevWidth = previousControl ? previousControl.offsetWidth / 2 : 10;
                var prevHeight = previousControl ? previousControl.offsetHeight / 2 : 10;
                
                width = this.lerp(prevWidth, width, percentage);
                height = this.lerp(prevHeight, height, percentage);
                setTimeout(() => this.run(steps), this.args?.frameInterval ?? 0);
            }
            else
            {
                this.isTransitioning = false;
            }
        }
    
        if(x && y && width && height)
        {

            if(this.args.cutout == "Box")
            {
                this.drawingManager?.createCutoutBox(x, y, width * 2, height * 2);
            }
            else
            {
                this.drawingManager?.createArc(x + width, y + height, width + 5);
            }
        }
        //if we aren't moving to the next step we need to render the message to the user
			if(!this.isTransitioning)
			{

                //messages all should show centrally

                /*x = (window.innerWidth / 2) - 250;
                y = (window.innerHeight / 2) - 150;
                width = 0;
                height = 0;*/
                //250 is the width of the message, 150 is the height
                //const mesY = (window.innerHeight / 2) - 150;
                //const messX = (window.innerWidth / 2) - 250;
				//this.drawingManager.drawMessage(x + ((width + 5) * 2), y, step.stepMessage);
                this.drawingManager?.drawMessage(mesX, mesY, step?.stepMessage ?? "", this.timeToNextStep == null);


				if(this.timeToNextStep != null && this.timeToNextStep <= 0)
				{
                    if(steps[this.currentStep].callback != null)
                    {
                        steps[this.currentStep].callback().then(()=>{
                        //clear arc
                        this.currentStep++;
                        if(this.currentStep < steps.length)
                        {
                            this.isTransitioning = true;
                            
                            this.timeToNext = this.args.transitionTimeS ?? 0;
                            this.timeToNextStep = steps[this.currentStep].durationS != null ? steps[this.currentStep].durationS * 1000 : null;
                            setTimeout(() => this.run(steps), this.args?.frameInterval ?? 0);
                        }
                        else
                        {
                            //need to remove the canvas if we have finished the process
                            //once we have reached the end of the steps we can just destroy without a timeout
                            this.drawingManager?.destroy();
                            if(this.onEnd != null)
                            {
                                this.onEnd();
                            }
                            return;
                        }
                        });
                    }
				}
                else if(this.timeToNextStep == null)
                {
                    this.state = steps;
                }
                else
                {
                    //No need to render all frames, just keep the message on screen for the specified time
                    setTimeout(() => this.run(steps), this.timeToNextStep);
                     this.timeToNextStep = 0;
                }
			}
			
    }

    private lerp(pos1:number, pos2: number, t: number)
    {
        return (1 - t) * pos1 + t * pos2;
    }
}

export class AnimatedTutorial
{
    private steps: TutorialStep[] = [];
    private args: TutorialArgs|null = null;

    private animationManager: TutorialAnimationManager|null = null;

    public tutorialEnd: () => void | null = null;

    constructor(args: TutorialArgs|null = null)
    {
        this.initialise(args);
    }

    private initialise(args: TutorialArgs|null = null): void
    {
        this.args = new TutorialArgs();
        if(args != null)
        {
            if(!!args.cutout)
            {
                this.args.cutout = args.cutout;
            }
            if(!!args.frameInterval)
            {
                this.args.frameInterval = args.frameInterval;
            }
            if(!!args.transitionTimeS)
            {
                this.args.transitionTimeS = args.transitionTimeS;
            }
            if(!!args.font)
            {
                this.args.font = args.font;
            }
            if(!!args.overlayColour)
            {
                this.args.overlayColour = args.overlayColour;
            }
            if(args.showTutorialOnce != null)
            {
                this.args.showTutorialOnce = args.showTutorialOnce;
            }
            if(!!args.tutorialIden)
            {
                this.args.tutorialIden = args.tutorialIden;
            }
            if(args.allowSkip != null)
            {
                this.args.allowSkip = args.allowSkip;
            }
            if(!!args.zIndex)
            {
                this.args.zIndex = args.zIndex;
            }
        }
        //clear all current steps
        this.steps = [];
        
        this.animationManager = new TutorialAnimationManager();
        this.animationManager.initialise(this.args, () => {
            if(localStorage)
            {
                localStorage.setItem(this.args.tutorialIden, "true");
            }
            if(this.tutorialEnd != null)
            {
                this.tutorialEnd()
            }
    });
    }

    

    public addStep(controlSelector: string|null|Element, message: string, duration:number|null = null, callback:()=>Promise<void>|null = null):void
    {
        const step = {
            control: controlSelector,
            stepMessage: message,
            durationS: duration,
            callback: callback,
        } as TutorialStep;

        if(step.callback == null)
        {
            step.callback = () => Promise.resolve();
        }
        this.steps.push(step);
    }

    public addForm(formSelector: string|null):void
    {
        var formControls = document.querySelectorAll(`${formSelector} input, ${formSelector} select, ${formSelector} textarea, ${formSelector} button`);

        for(let i = 0; i < formControls.length; i++)
        {
            var control = formControls[i];
            let duration: number | null = null;
            const durAttr = control.getAttribute("data-at-duration");
            if(!!durAttr)
            {
                duration = parseInt(durAttr)
            }
            this.addStep(control, control.getAttribute("data-at-message"), duration);
        }
    }
    public run(): void
    {
        if(localStorage && this.args.showTutorialOnce)
        {
            const hasCompleted = localStorage.getItem(this.args.tutorialIden);
            if(hasCompleted)
            {
                this.animationManager.endTutorial();
                return;
            }
        }
        this.animationManager.timeToNextStep = this.steps[0].durationS != null ? this.steps[0].durationS * 1000 : null;
        this.animationManager.run(this.steps);
    }
}