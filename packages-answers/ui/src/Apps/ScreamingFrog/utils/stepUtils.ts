export type StepFn<T> = (ctx: T) => Promise<T>

export interface Step<T> {
    label: string
    fn: StepFn<T>
}

export async function runSteps<T>(steps: Step<T>[], ctx: T, onProgress: (stepIdx: number, label: string) => void): Promise<T> {
    for (let i = 0; i < steps.length; i++) {
        onProgress(i, steps[i].label)
        ctx = await steps[i].fn(ctx)
    }
    return ctx
}
