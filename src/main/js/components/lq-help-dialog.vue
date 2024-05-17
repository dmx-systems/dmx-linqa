<template>
  <el-dialog class="lq-help-dialog" :visible="visible" width="350px" @close="close">
  </el-dialog>
</template>

<script>
export default {

  props: {
    visible: Boolean
  },

  data () {
    return {
    }
  },

  computed: {
  },

  methods: {
    close () {
      this.$emit('close')
    }
  }
}
</script>

<style>
.lq-help-dialog {
}
</style>
