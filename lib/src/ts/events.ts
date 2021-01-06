import Vue, { ref } from "vue";

export class DnDEvent {

    type: any;
    data: any;
    top: typeof ref;
    previousTop: typeof ref;
    source: typeof ref;
    position: { x, y };
    success: Boolean;
    native: TouchEvent | MouseEvent;

}

export class ReorderEvent {

    constructor(public from: number, public to: number) {}

    apply(array: any[]) {
        let tmp = array[this.from];
        array.splice(this.from, 1);
        array.splice(this.to, 0, tmp);
    }

}

export class InsertEvent {
    constructor(
        public type: string,
        public data: any,
        public index: number
    ) {}
}