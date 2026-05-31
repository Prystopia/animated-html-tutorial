export class TutorialStep {
    public control: string | null | HTMLElement = null;
    public stepMessage: string | null = null;
    public durationS: number | null = null;
    public callback?: (() => Promise<void>) | null = null;
}