<template>
    <component :is="tag" v-bind="$attrs">
        <slot></slot>
        <template v-for="(_, slot) of $scopedSlots" v-slot:[slot]="scope">
            <slot :name="slot" v-bind="scope"/>
        </template>
    </component>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";

import useDragAwareMixin from "../mixins/DragAwareMixin";
import { dnd } from "../ts/DnD";

export default defineComponent({
  name: 'DropMask',
  props: {
    tag: {
      type: [String, Object,Function],
      default: 'div',
    }
  },
  setup(props) {
    const { tag } = props;
    const {} = useDragAwareMixin();
    const root = ref(null);

    let isDropMask = true;
    let el =  null;
    let comp = root;

    const createDragImage = function (): string {
      return 'source';
    }

    const onMouseMove = function (e) {
      dnd.mouseMove(e, comp);
    }

    onMounted(() => {
      el = root.value;
      el.addEventListener('easy-dnd-move', onMouseMove);
    });

    return {
      isDropMask,
    };
  }
});
</script>