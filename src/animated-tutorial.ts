export class TutorialArgs
{
    public frameInterval: number|null =  1000/60;
    public transitionTimeS: number|null = 100;
    public cutout: "Box"|"Oval" = "Box";
    public font: string = "19px Arial";
    public overlayColour: string = "rgba(100,100,100,0.8)"

}
export class TutorialStep
{
    public control:string|null = null;
    public stepMessage: string|null = null;
    public durationS: number = 2;
    public callback: (() => Promise<void>) | null = null;
}

export class TutorialDrawingManager
{
    private canvas: HTMLCanvasElement|null  = null;
    private ctx: CanvasRenderingContext2D|null = null;
    private args: TutorialArgs|null = null;

    public initialise(args: TutorialArgs): void
    {
        this.args = args;
        this.canvas = document.createElement("canvas");
        //TODO - needs to be configurable to ensure we don't sit under existing elements
        this.canvas.style.zIndex = "2";
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

    public drawMessage(x: number,y: number, message: string): void
    {
        if(this.ctx != null && this.args != null)
        {
            const maxWidth = 500;

            //need to handle wrapping of text
            this.ctx.font = this.args.font;

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
            
            //me.ctx.fillRect(x,y, 250, 150);
            this.ctx.beginPath();
            
            this.ctx.fillStyle = "#000000";
            for(let i = 0; i < lines.length; i++)
            {
                this.ctx.fillText(lines[i], boxLeft + 10, boxHeight + 25 + (textHeight * i));
            }
            
            this.ctx.restore();
        }
    }

    private skipStep(): void
    {
        //store reference to timeout
        //clear current timout
        //increment index by one, call run method again

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
            document.body.removeChild(this.canvas);
        }
        this.canvas = null;
    }
}
//TODO - Add in fadein/fadeout animation rather than a transition
export class TutorialAnimationManager
{
	private currentStep: number = 0;
    private isTransitioning: boolean = false;
    private timeToNext: number = 0;
    public timeToNextStep: number = 0;
    private args: TutorialArgs = new TutorialArgs();
    private drawingManager: TutorialDrawingManager|null = null;

    public initialise(args: TutorialArgs): void
    {
        this.args = args;
        this.drawingManager = new TutorialDrawingManager();
        this.drawingManager.initialise(args);
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
                //console.log(control, parent, "Control top", contTop, "parentHeight", parent.scrollHeight, parent.offsetHeight, parent.clientHeight, parent.scrollTop);
                //try to keep elements in the middle of the element
                //control top is within the hidden element, so need to get the percentage
                const maxScroll = (parent.scrollHeight - parent.clientHeight)
                let scrollOffset = (contTop - middle);
                //console.log(parent.scrollHeight - parent.clientHeight);
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
            const control: HTMLElement|null = document.querySelector(step.control);
        
            if(control != null)
            {
                const scrollAmount = this.scrollToElement(control, 50);
                const bounds = control.getBoundingClientRect();
                //need to position the circles better + centre better
                x = bounds.left;// + window.scrollX;
                //console.log(scrollAmount);
                console.log(scrollAmount);
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
            if(this.timeToNext > 0)
            {
                var percentage = (this.args?.transitionTimeS ?? 0 - this.timeToNext)/(this.args?.transitionTimeS ?? 1);
                //TODO - add check for 0 index - shouldn't happen as we can't transition before having at least one step
                var previousStep = steps[this.currentStep - 1];
                const previousControl: HTMLElement|null = previousStep.control ? document.querySelector(previousStep.control) : null;
                var prevX = previousControl ? previousControl.getBoundingClientRect().left : (window.innerWidth / 2);
                var prevY = previousControl ? previousControl.getBoundingClientRect().top : (window.innerHeight / 2);
                var x = this.lerp(prevX, x, percentage);
                var y = this.lerp(prevY, y, percentage);
                
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
                this.drawingManager?.drawMessage(mesX, mesY, step?.stepMessage ?? "");


				if(this.timeToNextStep <= 0)
				{
                    if(steps[this.currentStep].callback != null)
                    {
                        steps[this.currentStep].callback!().then(()=>{
                        //clear arc
                        this.currentStep++;
                        if(this.currentStep < steps.length)
                        {
                            this.isTransitioning = true;
                            this.timeToNext = this.args.transitionTimeS ?? 0;
                            this.timeToNextStep = steps[this.currentStep].durationS * 1000;
                            setTimeout(() => this.run(steps), this.args?.frameInterval ?? 0);
                        }
                        else
                        {
                            //need to remove the canvas if we have finished the process
                            //once we have reached the end of the steps we can just destroy without a timeout
                            this.drawingManager?.destroy();
                            return;
                        }
                        });
                    }
				}
                else
                {
                    //TODO - add in click to confirm as well as a countdown (?optional run mode?)
                    //TODO - no need to render all frames, just keep the message on screen for the specified time
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
    //TODO - add local storage check to se whether user has already completed the tutorial based on the provided id or route

    private steps: TutorialStep[] = [];
    private args: TutorialArgs|null = null;

    private animationManager: TutorialAnimationManager|null = null;

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
            
        }
        //clear all current steps
        this.steps = [];
        
        this.animationManager = new TutorialAnimationManager();
        this.animationManager.initialise(this.args);
    }

    

    public addStep(controlSelector: string|null, message: string, duration:number = 2, callback:(()=>Promise<void>)|null = null):void
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

    public run()
    {
        if(this.animationManager != null)
        {
            this.animationManager.timeToNextStep = this.steps[0].durationS * 1000;
            this.animationManager.run(this.steps);
        }
    }
}