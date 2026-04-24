<script lang="ts">
  import PieMenu from './PieMenu/PieMenu.svelte';
</script>

<div class="overlay-root">
  <PieMenu />
</div>

<style>
  .overlay-root {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: transparent;
    overflow: hidden;
  }
</style>
