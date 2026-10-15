declare global {
	interface Array<T> {
		unique(): Array<T>;
	}
}

if (!Array.prototype.unique) {
	Array.prototype.unique = function<T>(this: T[]): T[] {
		return [...new Set(this)];
	};
}
