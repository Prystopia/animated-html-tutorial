import { TutorialArgs } from "./models/tutorial-args";

export class TutorialDrawingManager {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private args: TutorialArgs | null = null;

    private prevBounds: number[] = [];
    private nextBounds: number[] = [];
    private skipBounds: number[] = [];
    private nextCallback: (() => void) | null = null;
    private prevCallback: (() => void) | null = null
    private endCallback: (() => void) | null = null;
    private readonly clickHandler = (ev: MouseEvent) => this.handleClick(ev);


    public initialise(args: TutorialArgs, width: number, height: number, nextCallback: () => void, prevCallback: () => void, endCallback: () => void): void {
        this.args = args;
        this.nextCallback = nextCallback;
        this.prevCallback = prevCallback;
        this.endCallback = endCallback;
        this.canvas = document.createElement("canvas");
        this.canvas.addEventListener("click", this.clickHandler);
        this.resize(width, height);
        this.canvas.style.zIndex = this.args.zIndex;
        this.canvas.style.position = "fixed";
        this.canvas.style.display = "block";
        this.canvas.style.top = "0";
        this.canvas.style.left = "0";
        this.canvas.style.right = "0";
        this.canvas.style.bottom = "0";

        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext("2d")
    }

    public resize(width: number, height: number) {
        if (this.canvas) {
            this.canvas.setAttribute("width", `${width}px`);
            this.canvas.setAttribute("height", `${height}px`);
        }
    }

    public createArc(x: number, y: number, rad: number): void {
        if (this.ctx != null) {
            this.ctx.beginPath();
            this.ctx.arc(x, y, rad, 0, 2 * Math.PI)
            this.ctx.stroke();
            this.ctx.clip();
            this.clear();
            this.ctx.restore();
        }
    }

    public drawBackground(): void {
        this.clear();
        if (this.ctx != null && this.canvas != null && this.args != null) {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.fillStyle = this.args.overlayColour;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            if (this.args.allowSkip) {
                this.ctx.save();
                const skipText = '✕  Skip';
                this.ctx.font = '13px system-ui, -apple-system, sans-serif';
                const textMetrics = this.ctx.measureText(skipText);
                const pillW = textMetrics.width + 24;
                const pillH = 30;
                const pillX = (this.canvas.width / 2) - pillW - 20;
                const pillY = this.canvas.height - pillH - 20;

                this.ctx.fillStyle = 'rgba(255,255,255,0.15)';
                this.ctx.beginPath();
                this.ctx.roundRect(pillX, pillY, pillW, pillH, 4);
                this.ctx.fill();

                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillText(skipText, pillX + 12, pillY + 20);

                this.skipBounds[0] = pillX;
                this.skipBounds[1] = pillY;
                this.skipBounds[2] = pillW;
                this.skipBounds[3] = pillH;

                this.ctx.restore();
            }
        }
    }

    public restore() {
        if (this.ctx != null) {
            this.ctx.restore();
        }
    }

    public createCutoutBox(x: number, y: number, width: number, height: number): void {
        if (this.ctx != null && this.args != null) {
            // clip path — rounded rect punches a soft-edged hole in the overlay
            this.ctx.beginPath();
            this.ctx.roundRect(x - 6, y - 6, width + 12, height + 12, 8);
            this.ctx.clip();
            this.clear();
            this.ctx.restore(); // unwinds the clip

            // glow ring — drawn after restore so it renders on top of the overlay
            this.ctx.save();
            this.ctx.strokeStyle = this.args.highlightColour;
            this.ctx.lineWidth = 2;
            this.ctx.shadowColor = 'rgba(79, 142, 247, 0.35)';
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.roundRect(x - 8, y - 8, width + 16, height + 16, 10);
            this.ctx.stroke();
            this.ctx.restore();
        }
    }

    public handleClick(mouseEvent: MouseEvent): void {
        //check if the mouse click is within the prev or next bounding boxes
        const x = mouseEvent.clientX;
        const y = mouseEvent.clientY;

        if (x > this.prevBounds[0] && x < this.prevBounds[0] + this.prevBounds[2]
            && y > this.prevBounds[1] && y < this.prevBounds[1] + this.prevBounds[3]) {
            this.prevCallback?.();
            return;
        }

        if (x > this.nextBounds[0] && x < this.nextBounds[0] + this.nextBounds[2]
            && y > this.nextBounds[1] && y < this.nextBounds[1] + this.nextBounds[3]) {
            this.nextCallback?.();
            return;
        }



        if (this.args?.allowSkip && x > this.skipBounds[0] && x < this.skipBounds[0] + this.skipBounds[2]
            && y > this.skipBounds[1] && y < this.skipBounds[1] + this.skipBounds[3]) {

            this.endCallback?.();
            return;
        }
    }

    public drawMessage(x: number, y: number, message: string, isManualStep: boolean,
        isFirstStep: boolean,
        isLastStep: boolean, currentStep: number = 1, totalSteps: number = 1): void {
        const PADDING = 16;
        const BUTTON_BAR_H = 44;  // height of the Prev/Next row when isManualStep
        const STEP_COUNTER_H = 20; // vertical space reserved for "N / M" label
        let maxWidth = 500;

        if (this.ctx != null && this.args != null) {
            this.ctx.font = this.args.font;
            //break on spaces
            var words = message.split(" ");
            const lines: string[] = [words[0]];
            let lineIndex = 0;
            let count = 1;
            while (count < words.length) {
                let currentMessage = lines[lineIndex];

                let width = this.ctx.measureText(`${currentMessage} ${words[count]}`);
                //adding the new word pushes it over the boundary, so start a new line
                if ((width.width + 20) > maxWidth) {
                    lineIndex++;
                    lines[lineIndex] = words[count];
                }
                else {
                    lines[lineIndex] = `${currentMessage} ${words[count]}`;
                }

                count++;
            }

            if (lines.length == 1) {
                maxWidth = Math.max(this.ctx.measureText(lines[0]).width + PADDING * 2, 160);
            }

            var textHeight = 22;
            const textContentH = STEP_COUNTER_H + (textHeight * lines.length) + PADDING * 2;
            const height = textContentH + (isManualStep ? BUTTON_BAR_H : 0);
            let boxLeft = x;
            //check if width goes off the page
            if (x + maxWidth > window.innerWidth) {
                boxLeft = x - maxWidth;
            }

            let boxHeight = y;
            if (boxHeight + height > window.innerHeight) {
                //this message will overflow off the bottom of the screen
                boxHeight = y - height;
            }
            this.ctx.save();
            this.ctx.shadowColor = 'rgba(0,0,0,0.18)';
            this.ctx.shadowBlur = 24;
            this.ctx.shadowOffsetY = 6;

            this.ctx.fillStyle = '#ffffff';
            this.ctx.strokeStyle = '#e5e7eb';
            this.ctx.lineWidth = 1;

            this.ctx.beginPath();
            this.ctx.roundRect(boxLeft, boxHeight, maxWidth, height, 10);
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.restore();

            if (isManualStep) {
                // divider line between message and button row
                const dividerY = boxHeight + textContentH;
                this.ctx.save();
                this.ctx.strokeStyle = '#f3f4f6';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(boxLeft + 1, dividerY);
                this.ctx.lineTo(boxLeft + maxWidth - 1, dividerY);
                this.ctx.stroke();

                const btnY = dividerY + 8;
                const btnH = 28;
                const halfW = maxWidth / 2;
                const btnPad = 8;

                // Back button (left half) 
                if (!isFirstStep) {
                    this.ctx.beginPath();
                    this.ctx.fillStyle = '#f3f4f6';
                    this.ctx.roundRect(boxLeft + btnPad, btnY, halfW - btnPad * 1.5, btnH, 6);
                    this.ctx.fill();
                }

                // Next / Finish button (right half) — filled primary style
                const nextLabel = isLastStep ? 'Finish' : 'Next →';
                this.ctx.beginPath();
                this.ctx.fillStyle = '#4f8ef7';
                this.ctx.roundRect(boxLeft + halfW + btnPad * 0.5, btnY, halfW - btnPad * 1.5, btnH, 6);
                this.ctx.fill();

                // button labels
                this.ctx.font = '13px system-ui, -apple-system, sans-serif';
                this.ctx.textAlign = 'center';

                if (!isFirstStep) {
                    this.ctx.fillStyle = '#374151';
                    this.ctx.fillText('← Back', boxLeft + halfW * 0.5, btnY + 19);
                }

                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillText(nextLabel, boxLeft + halfW * 1.5, btnY + 19);

                this.ctx.textAlign = 'left'; // reset alignment
                this.ctx.restore();

                // hit bounds for click detection (format: [topLeftX, topLeftY, width, height])
                this.prevBounds[0] = boxLeft + btnPad;
                this.prevBounds[1] = btnY;
                this.prevBounds[2] = halfW - btnPad * 1.5;
                this.prevBounds[3] = btnH;

                this.nextBounds[0] = boxLeft + halfW + btnPad * 0.5;
                this.nextBounds[1] = btnY;
                this.nextBounds[2] = halfW - btnPad * 1.5;
                this.nextBounds[3] = btnH;
            }

            this.ctx.beginPath();
            if (totalSteps > 1) {
                const stepLabel = `${currentStep} / ${totalSteps}`;
                this.ctx.save();
                this.ctx.font = '12px system-ui, -apple-system, sans-serif';
                this.ctx.fillStyle = '#9ca3af';
                const stepW = this.ctx.measureText(stepLabel).width;
                this.ctx.fillText(stepLabel, boxLeft + maxWidth - stepW - PADDING, boxHeight + PADDING + 12);
                this.ctx.restore();
            }

            // message text — uses the configured font
            this.ctx.font = this.args.font;
            this.ctx.fillStyle = '#111827';
            const textStartY = boxHeight + PADDING + STEP_COUNTER_H;
            for (let i = 0; i < lines.length; i++) {
                this.ctx.fillText(lines[i], boxLeft + PADDING, textStartY + 18 + (textHeight * i));
            }
            this.ctx.restore();
        }
    }

    private clear(): void {
        if (this.ctx != null && this.canvas != null) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    public destroy() {
        this.ctx = null;

        if (this.canvas != null) {
            this.canvas.removeEventListener("click", this.clickHandler);
            document.body.removeChild(this.canvas);
        }
        this.canvas = null;
    }
}
