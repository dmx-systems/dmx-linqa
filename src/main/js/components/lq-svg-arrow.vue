<template>
  <svg class="lq-svg-arrow" :viewBox="viewBox">
    <defs>
      <marker :id="arrowheadId" markerWidth="5" markerHeight="4" refX="4" refY="2" orient="auto-start-reverse">
        <polygon points="0 0, 5 2, 0 4" :fill="color" />
      </marker>
    </defs>
    <line x1="0" y1="0" :x2="width" y2="0" :stroke="color" stroke-width="4" :marker-start="markerStartUrl"
      :marker-end="markerEndUrl" />
  </svg>
</template>

<script>
export default {

  mounted () {
    this.arrowheadId = 'arrowhead-' + this.$el.__vue__._uid     // TODO: DOM-global marker defs instead synthetic IDs
    this.markerUrl = `url(#${this.arrowheadId})`
  },

  props: {
    arrowheads: String
  },

  data () {
    return {
      width: 50,          /* is lq-line-menu item width */
      height: 30,         /* is lq-line-menu item height */
      color: '#606266',   /* is .el-dropdown-menu__item color */
      arrowheadId: undefined,
      markerUrl: undefined
    }
  },

  computed: {

    viewBox () {
      return `0 ${-this.height / 2 - 2} ${this.width} ${this.height}`
    },

    markerStartUrl () {
      return ['start', 'start-end'].includes(this.arrowheads) && this.markerUrl
    },

    markerEndUrl () {
      return ['end', 'start-end'].includes(this.arrowheads) && this.markerUrl
    }
  }
}
</script>

<style>
.lq-svg-arrow {
  overflow: visible;
}
</style>
