declare global {
	interface Array<T> {
		unique(): T[];
	}
}

if (!Array.prototype.unique) {
	Array.prototype.unique = function<T>(this: T[]) {
		return [...new Set(this)];
	};
}
