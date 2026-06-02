import { TutorialAnimationManager } from "./animation-manager";
import { TutorialArgs } from "./models/tutorial-args";
import { TutorialStep } from "./models/tutorial-step";

export class AnimatedTutorial {
    private steps: TutorialStep[] = [];
    private args!: TutorialArgs;
    private animationManager: TutorialAnimationManager | null = null;

    constructor(args: TutorialArgs | null = null) {
        this.initialise(args);
    }

    private initialise(args: TutorialArgs | null = null): void {
        this.args = new TutorialArgs();
        if (args != null) {
            if (args.transitionTimeMS != null) {
                this.args.transitionTimeMS = args.transitionTimeMS;
            }
            if (!!args.font) {
                this.args.font = args.font;
            }
            if (!!args.overlayColour) {
                this.args.overlayColour = args.overlayColour;
            }
            if (args.showTutorialOnce != null) {
                this.args.showTutorialOnce = args.showTutorialOnce;
            }
            if (!!args.tutorialIden) {
                this.args.tutorialIden = args.tutorialIden;
            }
            if (args.allowSkip != null) {
                this.args.allowSkip = args.allowSkip;
            }
            if (!!args.zIndex) {
                this.args.zIndex = args.zIndex;
            }
            if (!!args.highlightColour) {
                this.args.highlightColour = args.highlightColour
            }
        }
        //clear all current steps
        this.steps = [];

        this.animationManager = new TutorialAnimationManager();
        this.animationManager.initialise(this.args, () => {
            if (localStorage) {
                localStorage.setItem(this.args.tutorialIden, "true");
            }
            window.dispatchEvent(new CustomEvent("tutorialend"));
        });
    }



    public addStep(controlSelector: string | null | Element, message: string, duration: number | null = null, callback: (() => Promise<void>) | null = null): void {
        const step = {
            control: controlSelector,
            stepMessage: message,
            durationS: duration,
            callback: callback,
        } as TutorialStep;

        if (step.callback == null) {
            step.callback = () => Promise.resolve();
        }
        this.steps.push(step);
    }

    public addForm(formSelector: string): void {
        if (formSelector != null) {
            var formControls = document.querySelectorAll(`${formSelector} input, ${formSelector} select, ${formSelector} textarea, ${formSelector} button`);

            for (let i = 0; i < formControls.length; i++) {
                var control = formControls[i];
                if (control) {
                    let duration: number | null = null;
                    const durAttr = control.getAttribute("data-at-duration");
                    if (!!durAttr) {
                        duration = parseInt(durAttr)
                    }
                    if (control.getAttribute("data-at-message") == null) {
                        console.warn(`Control ${control.id} has no message to display`)
                    }
                    this.addStep(control, control.getAttribute("data-at-message") || "", duration);
                }
            }
        }
    }
    public run(): void {
        if (localStorage && this.args.showTutorialOnce) {
            const hasCompleted = localStorage.getItem(this.args.tutorialIden);
            if (hasCompleted) {
                this.animationManager?.endTutorial();
                return;
            }
        }
        if (this.animationManager && (this.steps?.length ?? 0) > 0) {
            this.animationManager.resetTutorial();
            this.animationManager.timeToNextStep = this.steps[0].durationS != null ? this.steps[0].durationS * 1000 : null;
            this.animationManager.run(this.steps);
        }
    }
}