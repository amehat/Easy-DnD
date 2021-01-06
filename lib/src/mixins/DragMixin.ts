import { defineComponent, computed, onMounted, ref } from 'vue';

import useDragAwareMixin from "./DragAwareMixin";
import { createDragImage as useCreateDragImage } from "../ts/createDragImage";
import { dnd } from "../ts/DnD";

export default defineComponent({
  name: 'DragMixin',
  props: {
    type: {
      type: String,
      default: null,
    },
    data: {
      type: [String, Number, Object, Array, Boolean, Function],
      default: null,
    },
    dragImageOpacity: {
      type: Number,
      default: 0.7,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    goBack: {
      type: Boolean,
      default: false,
    },
    handle: {
      type: String,
      required: false,
    },
    delta: {
      type: Number,
      default: 3,
    },
  },
  setup(props) {
    const {
      dragInProgress,
      dragData,
      dragType,
      dragPosition,
      dragSource,
      dragTop,
    } = useDragAwareMixin();
    const {
      type,
      data,
      dragImageOpacity,
      disabled,
      goBack,
      handle,
      delta,
    } = props;

    const root = ref(null);
    
    let isDrag = true;
    let $el = null;
    let mouseIn: boolean = null;
    const isNodeList = (el: Element | NodeListOf<Element>): el is NodeListOf<Element> => {
      return 'item' in el
    }

    let comp = ref();
    let el: Element | NodeListOf<Element> = $el;
    let dragStarted = false;
    let initialUserSelect;
    let downEvent: TouchEvent | MouseEvent = null;
    let startPosition = null;

    if (handle) {
      el = $el.querySelectorAll(handle)
    }

    const currentDropMode = computed(() => {
      if (dragInProgress && dragSource === ref()) {
        if (dragTop && dragTop['dropAllowed']) {
          if (dragTop['reordering']) {
            return 'reordering';
          } else {
            return dragTop['mode'];
          }
        } else {
          return null;
        }
      } else {
        return null;
      }
    });

    const cssClasses = computed(() => {
      let clazz = {
        'dnd-drag': true
      } as any;
      if (!disabled) {
        return {
          ...clazz,
          'drag-source': dragInProgress && dragSource === ref(),
          'drag-in': dragIn,
          'drag-out': !dragIn,
          'drag-mode-copy': currentDropMode.value === 'copy',
          'drag-mode-cut': currentDropMode.value === 'cut',
          'drag-mode-reordering': currentDropMode.value === 'reordering',
          'drag-no-handle': !handle
        };
      } else {
        return {
          ...clazz
        };
      }
    });

    const dragIn = computed(() => {
      return !dragInProgress && mouseIn;
    });

    const created = function () {
      this.reEmit("dragstart");
      this.reEmit("dragend");
    }

    const reEmit = function (eventName: string) {
      dnd.on(eventName, (ev) => {
        if (ev.source === this) {
          this.$emit(eventName, ev);
        }
      });
    }

    const createDragImage = function (selfTransform: string) {
        let image;
        if (this.$scopedSlots['drag-image']) {
            let el = this.$refs['drag-image'] as HTMLElement;
            if (el.childElementCount !== 1) {
                image = useCreateDragImage(el);
            } else {
                image = useCreateDragImage(el.children.item(0) as HTMLElement);
            }
        } else {
            image = useCreateDragImage($el as HTMLElement);
            image.style.transform = selfTransform;
        }
        image['__opacity'] = this.dragImageOpacity;
        return image;
    }

    const onMouseEnter = function () {
      mouseIn = true;
    }

    const onMouseLeave = function () {
      mouseIn = false;
    }

    const noop = function (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    const onMouseDown = function (e) {
      if (!disabled && downEvent === null) {
        initialUserSelect = document.body.style.userSelect;
        document.documentElement.style.userSelect = 'none'; // Permet au drag de se poursuivre normalement même
        // quand on quitte un élémént avec overflow: hidden.
        dragStarted = false;
        downEvent = e;
        if (downEvent.type === 'mousedown') {
          const mouse = event as MouseEvent;
          startPosition = {
            x: mouse.clientX,
            y: mouse.clientY
          };
        } else {
          const touch = event as TouchEvent;
          startPosition = {
            x: touch.touches[0].clientX,
            y: touch.touches[0].clientY
          };
        }
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('touchmove', onMouseMove, {
          passive: false,
        });
        document.addEventListener('easy-dnd-move', onEasyDnDMove);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('touchend', onMouseUp);
        document.addEventListener('selectstart', noop);
        // Prevents event from bubbling to ancestor drag components and initiate several drags at the same time
        e.stopPropagation();
        // Prevents touchstart event to be converted to mousedown
        //e.preventDefault();
      }
    }

    const onMouseMove = function (e: TouchEvent | MouseEvent) {
      // We ignore the mousemove event that follows touchend :
      if (downEvent === null) return;
      // On touch devices, we ignore fake mouse events and deal with touch events only.
      if (downEvent.type === 'touchstart' && e.type === 'mousemove') return;

      // Find out event target and pointer position :
      let target: Element;
      let x: number;
      let y: number;
      if (e.type === 'touchmove') {
        let touch = e as TouchEvent;
        x = touch.touches[0].clientX;
        y = touch.touches[0].clientY;
        target = document.elementFromPoint(x, y);
        if (!target) {
          // Mouse going off screen. Ignore event.
          return;
        }
      } else {
        let mouse = e as MouseEvent;
        x = mouse.clientX;
        y = mouse.clientY;
        target = mouse.target as Element;
      }

      // Distance between current event and start position :
      let dist = Math.sqrt(Math.pow(startPosition.x - x, 2) + Math.pow(startPosition.y - y, 2));

      // If the drag has not begun yet and distance from initial point is greater than delta, we start the drag :
      if (!dragStarted && dist > delta) {
        dragStarted = true;
        dnd.startDrag(root, downEvent, startPosition.x, startPosition.y, type, data);
        document.documentElement.classList.add('drag-in-progress');
      }

      // Dispatch custom easy-dnd-move event :
      if (dragStarted) {
        let custom = new CustomEvent("easy-dnd-move", {
          bubbles: true,
          cancelable: true,
          detail: {
            x,
            y,
            native: e
          }
        });
        target.dispatchEvent(custom);
      }

      // Prevent scroll on touch devices :
      e.preventDefault();
    }

    const onEasyDnDMove = function (e) {
      dnd.mouseMove(e, null);
    }

    const onMouseUp = function (e: MouseEvent | TouchEvent) {
      // On touch devices, we ignore fake mouse events and deal with touch events only.
      if (downEvent.type === 'touchstart' && e.type === 'mouseup') return;

      downEvent = null;

      // This delay makes sure that when the click event that results from the mouseup is produced, the drag is still
      // in progress. So by checking the flag dnd.inProgress, one can tell appart true clicks from drag and drop artefacts.
      setTimeout(() => {
        if (dragStarted) {
          document.documentElement.classList.remove('drag-in-progress');
          dnd.stopDrag(e);
        }
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('touchmove', onMouseMove);
        document.removeEventListener('easy-dnd-move', onEasyDnDMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.removeEventListener('touchend', onMouseUp);
        document.removeEventListener('selectstart', noop);
        document.documentElement.style.userSelect = initialUserSelect;
      }, 0);
    }

    if (isNodeList(el)) {
      el.forEach((element) => {
        element.addEventListener('mousedown', onMouseDown)
        element.addEventListener('touchstart', onMouseDown);
        element.addEventListener('mouseenter', onMouseEnter)
        element.addEventListener('mouseleave', onMouseLeave);
      })
    } else {
      el.addEventListener('mousedown', onMouseDown);
      el.addEventListener('touchstart', onMouseDown);
      el.addEventListener('mouseenter', onMouseEnter);
      el.addEventListener('mouseleave', onMouseLeave);
    }

    onMounted(() => {
      $el = root.value;
    });

    return {
      cssClasses,
      currentDropMode,
      created,
      createDragImage,
      onMouseEnter,
      onMouseLeave,
      noop,
      onMouseDown,
      onMouseMove,
      onEasyDnDMove,
      onMouseUp,
      reEmit,
      root,
      $el,
    };
  }
})
