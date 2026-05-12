<script lang="ts">
  import appIconUrl from "../../../assets/app-icon.svg";

  export let size = 40;
  export let title: string | null = null;
  let className = "";

  export { className as class };
</script>

<img
  class={className}
  src={appIconUrl}
  alt={title ?? ""}
  width={size}
  height={size}
  aria-hidden={title ? undefined : "true"}
  draggable="false"
/>
