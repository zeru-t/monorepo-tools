type Undefinable<T> = T | undefined;
type Nullable<T> = T | null;
type Voidable<T> = T | void;
type Optional<T> = Undefinable<Nullable<Voidable<T>>>;

export { Undefinable, Nullable, Voidable, Optional };
