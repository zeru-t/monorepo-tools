declare global {
	interface Array<T> {
		unique(): T[];
		first(): T | undefined;
		last(): T | undefined;
	}
}

if (!Array.prototype.unique) {
	Array.prototype.unique = function<T>(this: T[]) {
		return [...new Set(this)];
	};
}

if (!Array.prototype.first) {
	Array.prototype.first = function<T>(this: T[]) {
		return this[0];
	};
}

if (!Array.prototype.last) {
	Array.prototype.last = function<T>(this: T[]) {
		return this[this.length - 1];
	};
}
