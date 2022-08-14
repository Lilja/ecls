
export class Failure<F> {
	public tag = "failure"
	constructor(public readonly value: F) {}
}
export class Success<S> {
	public tag = "success"
	constructor(public readonly value: S) {}
}
export type Result<T, F> = Success<T> | Failure<F>
export function isFailure<T,F>(t: Result<T,F>): t is Failure<F> {
	return t.tag === "failure"
}

