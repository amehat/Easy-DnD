import { computed } from 'vue';

import { dnd } from "../ts/DnD";

export default () => {
    const dragInProgress = computed(() => {
      return dnd.inProgress;
    });

    const dragData = computed(() =>{
      return dnd.data;
    });

    const dragType = computed(() => {
      return dnd.type;
    });

    const dragPosition = computed(() => {
      return dnd.position;
    });

    const dragSource = computed(() => {
      return dnd.source;
    });

    const dragTop = computed(() => {
      return dnd.top;
    });

    return {
      dragInProgress,
      dragData,
      dragType,
      dragPosition,
      dragSource,
      dragTop,
    }
};
