export class TutorialArgs {
    public transitionTimeMS: number | null = 400;
    public font: string = "16px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    public overlayColour: string = "rgba(15,23,42,0.6)"
    public highlightColour: string = "rgba(79, 142, 247, 0.7)"
    public showTutorialOnce: boolean = true;
    public tutorialIden: string = `prys-at-seen-${window.location.origin}${window.location.pathname}`;
    public allowSkip: boolean = false;
    public zIndex: string = "2";

}