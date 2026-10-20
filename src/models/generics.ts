type undefinable<T> = T | undefined;
type nullable<T> = T | null;
type voidable<T> = T | void;
type optional<T> = undefinable<nullable<voidable<T>>>;

export { undefinable, nullable, voidable, optional };
