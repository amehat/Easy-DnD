<template>
    <component :is="tag" v-bind="$attrs" v-on="$listeners" :class="cssClasses" :style="cssStyle">
        <slot></slot>
        <template v-for="(_, slot) of $scopedSlots" v-slot:[slot]="scope">
            <slot :name="slot" v-bind="scope"/>
        </template>
        <div class="__drag-image" v-if="showDragImage" ref="drag-image">
            <slot name="drag-image" :type="dragType" :data="dragData"></slot>
        </div>
    </component>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";

import useDropMixin from "../mixins/DropMixin";

export default defineComponent({
  name: 'Drop',
  props: {
    tag: {
      type: [String, Object, Function],
      default: 'div',
    },
  },
  setup(props) {
    const { tag } = props;
    const { dragInProgress, typeAllowed, } = useDropMixin();

    const showDragImage = computed(() => {
      // return dragInProgress && typeAllowed && $scopedSlots['drag-image'];
      return dragInProgress && typeAllowed;
    });

    return {
      showDragImage,
      tag,
    };
  }
});
</script>

<style lang="scss">
.drop-allowed.drop-in {
  &, * {
    cursor: pointer !important;
  }
}

.drop-forbidden.drop-in {
  &, * {
    cursor: no-drop !important;
  }
}
</style>

<style lang="scss" scoped>
/* Places a drag image out of sight while keeping its computed styles accessibles. */
.__drag-image {
  position: fixed;
  top: -10000px;
  left: -10000px;
  will-change: left, top;
}
</style>