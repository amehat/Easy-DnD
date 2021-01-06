import {Component, Prop, Vue} from "vue-property-decorator";
import { computed, defineComponent, onMounted, ref } from 'vue';

import useDragAwareMixin from "./DragAwareMixin";
import { createDragImage as useCreateDragImage } from "../ts/createDragImage";
import { DnDEvent } from "../ts/events";
import { dnd } from "../ts/DnD";

export default ({
  name: 'DropMixin',
  props: {
    acceptsType: {
      type: [String, Array, Function],
      default: () => () => true,
    },
    acceptsData: {
      type: Function,
      default: () => true,
    },
    mode: {
      type: String,
      default: 'copy',
    },
    dragImageOpacity: {
      type: Number,
      default: 0.7,
    },
  },
  emits: [
    'copy',
    'dragover',
    'dragenter',
    'dragleave',
    'dragenter',
    'drop'
  ],
  setup(props, { emit }) {
    const {
      dragData,
      dragInProgress,
      dragTop,
      dragType,
    } = useDragAwareMixin();
    const {
      acceptsType,
      acceptsData,
      mode,
      dragImageOpacity,
    } = props;
    const root = ref(null);

    let isDrop = true;
    let $el = null;
    let el = $el;
    let comp = ref();

    const onMouseMove = function (e) {
      dnd.mouseMove(e, comp);
    }

    el.addEventListener('easy-dnd-move', onMouseMove);

    const compatibleMode = computed(() => {
      if (dragInProgress) {
        return mode === 'copy' || dnd.sourceListeners.hasOwnProperty(mode);
      } else {
        return null;
      }
    });

    const dropIn = computed(() => {
      if (dragInProgress) {
        return dragTop === ref();
      } else {
        return null;
      }
    });

    const typeAllowed = computed(() => {
      if (dragInProgress) {
        return effectiveAcceptsType(dragType.value);
      } else {
        return null;
      }
    });

    const dropAllowed = computed(() => {
      if (dragInProgress) {
        if (typeAllowed) {
          return compatibleMode && effectiveAcceptsData(dragData.value, dragType.value);
        } else {
          return null;
        }
      } else {
        return null;
      }
    });

    const cssClasses = computed(() => {
      let clazz = {
        'dnd-drop': true
      } as any;
      if (dropIn !== null) {
        clazz = {
          ...clazz,
          "drop-in": dropIn,
          "drop-out": !dropIn
        };
      }
      if (typeAllowed !== null) {
        clazz = {
          ...clazz,
          "type-allowed": typeAllowed,
          "type-forbidden": !typeAllowed
        };
      }
      if (dropAllowed !== null) {
        clazz = {
          ...clazz,
          "drop-allowed": dropAllowed,
          "drop-forbidden": !dropAllowed
        };
      }
      return clazz;
    });

    const cssStyle = computed(() => {
      return {};
    });

    const effectiveAcceptsType = function (type: string) {
      if (acceptsType === null) {
        return true;
      } else if (typeof (acceptsType) === 'string') {
        return acceptsType === type;
      } else if (typeof (acceptsType) === 'object' && Array.isArray(acceptsType)) {
        return acceptsType.includes(type);
      } else {
        return acceptsType(type);
      }
    };

    const effectiveAcceptsData = function (data: any, type: any) {
      return acceptsData(data, type);
    };

    /**
     * Returns true if the current drop area participates in the current drag operation.
     */
    const candidate = function (type: string) {
      return effectiveAcceptsType(type);
    };

    const createDragImage = function () {
      let image;
      if (this.$refs['drag-image']) {
        let el = this.$refs['drag-image'] as HTMLElement;
        if (el.childElementCount !== 1) {
          image = useCreateDragImage(el);
        } else {
          image = useCreateDragImage(el.children.item(0) as HTMLElement);
        }
        image['__opacity'] = dragImageOpacity;
      } else {
        image = 'source';
      }
      return image;
    };

    const created = function () {
      dnd.on("dragpositionchanged", onDragPositionChanged);
      dnd.on("dragtopchanged", onDragTopChanged);
      dnd.on("drop", onDrop);
    };

    const destroyed = function () {
      dnd.off("dragpositionchanged", onDragPositionChanged);
      dnd.off("dragtopchanged", onDragTopChanged);
      dnd.off("drop", onDrop);
    };

    const onDragPositionChanged = function (event: DnDEvent) {
      if (this === event.top) {
        emit("dragover", event);
      }
    };
    
    const onDragTopChanged = function (event: DnDEvent) {
      if (this === event.top) {
        emit("dragenter", event);
      }
      if (this === event.previousTop) {
        emit("dragleave", event);
      }
    };

    const onDrop = function (event: DnDEvent) {
      if (dropIn && this.compatibleMode && dropAllowed) {
        doDrop(event);
      }
    };

    const doDrop = function (event: DnDEvent) {
      emit('drop', event);
      // event.source.emit(mode, event);
      // TODO: pour test, à changer
      emit(mode === 'copy' ? mode : 'copy', event);
    }

    onMounted(() => {
      $el = root.value;
    });

    return {
      candidate,
      compatibleMode,
      createDragImage,
      created,
      cssClasses,
      cssStyle,
      destroyed,
      dropAllowed,
      dropIn,
      effectiveAcceptsType,
      effectiveAcceptsData,
      onDragPositionChanged,
      onDragTopChanged,
      onDrop,
      doDrop,
      typeAllowed,
    };
  }
})
