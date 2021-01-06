import { defineComponent, nextTick, ref } from "vue";

import { dnd } from "./DnD";

/**
 * This class reacts to drag events emitted by the dnd object to manage a sequence of drag images and fade from one to the
 * other as the drag progresses.
 */
export default defineComponent({
  name: 'DragImagesManager',
  props: {},
  emits: [],
  setup(props, context) {
    let selfTransform: string = null;
    let clones: Map<typeof ref, HTMLElement> = null;
    let source: typeof ref = null;
    let sourcePos: { x: number, y: number } = null;
    let sourceClone: HTMLElement = null;

    const { emit } = context;

    const switchClone = function (top) {
      clones.forEach(clone => {
        clone.style.opacity = "0";
      });
      if (this.sourceClone) {
        sourceClone.style.opacity = "0";
      }

      let activeClone;
      if (top === null) {
        activeClone = getSourceClone();
      } else {
        if (!clones.has(top)) {
          let clone = top['createDragImage'](selfTransform);
          if (clone === 'source') {
            clone = getSourceClone();
          } else if (clone !== null) {
            clone.style.opacity = '0';
            document.body.appendChild(clone);
          }
          clones.set(top, clone);
        }
        activeClone = clones.get(top);
      }

      if (activeClone !== null) {
        activeClone.offsetWidth; // Forces broswer reflow
        activeClone.style.opacity = activeClone['__opacity'];
        activeClone.style.visibility = 'visible';
      }

      return activeClone;
    };

    const onDragStart = function (event) {
      sourcePos = {
        x: event.source.$el.getBoundingClientRect().left,
        y: event.source.$el.getBoundingClientRect().top,
      };
      selfTransform = "translate(-" + (event.position.x - this.sourcePos.x) + "px, -" + (event.position.y - sourcePos.y) + "px)";
      clones = new Map<typeof ref, HTMLElement>();
      source = event.source;
    };

    const onDragEnd = function (event) {
      nextTick(() => {
        if (!event.success && this.source['goBack']) {
          // Restore the drag image that is active when hovering outside any drop zone :
          let img = switchClone(null) as HTMLElement;

          // Move it back to its original place :
          window.requestAnimationFrame(() => {
            img.style.transition = "all 0.5s";
            window.requestAnimationFrame(() => {
              img.style.left = sourcePos.x + "px";
              img.style.top = sourcePos.y + "px";
              img.style.transform = "translate(0,0)";
              let handler = () => {
                this.cleanUp();
                img.removeEventListener("transitionend", handler);
              };
              img.addEventListener("transitionend", handler);
            })
          })
        } else {
          cleanUp();
        }
      });
    };

    const cleanUp = function () {
      clones.forEach((clone) => {
        if (clone.parentNode === document.body) {
          document.body.removeChild(clone);
        }
      });
      if (sourceClone !== null) {
        if (sourceClone.parentNode === document.body) {
          document.body.removeChild(this.sourceClone);
        }
      }
      selfTransform = null;
      clones = null;
      source = null;
      sourceClone = null;
      sourcePos = null;
    };

    const onDragTopChanged = function (event) {
      switchClone(event.top);
    };

    const getSourceClone = function () {
        if (sourceClone === null) {
            sourceClone = this.source['createDragImage'](selfTransform);
            sourceClone.style.opacity = '0';
            document.body.appendChild(sourceClone);
        }
        return this.sourceClone;
    };

    const onDragPositionChanged = function (event) {
      clones.forEach((clone) => {
        clone.style.left = dnd.position.x + "px";
        clone.style.top = dnd.position.y + "px";
      });
      if (sourceClone) {
        sourceClone.style.left = dnd.position.x + "px";
        sourceClone.style.top = dnd.position.y + "px";
      }
    }

    dnd.on('dragstart', onDragStart);
    dnd.on('dragtopchanged', onDragTopChanged);
    dnd.on('dragpositionchanged', onDragPositionChanged);
    dnd.on('dragend', onDragEnd);
    
    return {
      cleanUp,
      getSourceClone,
      onDragEnd,
      onDragStart,
      onDragTopChanged,
      onDragPositionChanged,
      switchClone,
    };
  }
});

// TODO: instancier le composant
// DragImagesManager();
