<template>
    <component :is="tag" v-bind="$attrs" :class="cssClasses">
        <slot></slot>
        <template v-for="(_, slot) of $scopedSlots" v-slot:[slot]="scope">
            <slot :name="slot" v-bind="scope"/>
        </template>
        <div class="__drag-image" ref="drag-image">
            <slot name="drag-image"></slot>
        </div>
    </component>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

// import useDragMixin from "../mixins/DragMixin";

export default defineComponent({
  name: 'Drag',
  props: {
    tag: {
      type: [String, Object, Function],
      default: 'div',
    },
  },
  setup(props) {
    const { tag } = props;
    // const {} = useDragMixin();

    return {};
  },
});
</script>

<style lang="scss">
.drop-allowed.drop-in * {
  cursor: inherit !important;
}

.drop-forbidden.drop-in {
  &, * {
    cursor: no-drop !important;
  }
}

.drag-no-handle.drag-in {
  cursor: move;
  cursor: grab;
}
</style>

<style lang="scss">
html.drag-in-progress * {
  cursor: move !important;
  cursor: grabbing !important;
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