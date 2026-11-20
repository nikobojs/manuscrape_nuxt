export default defineAppConfig({
  ui: {
    tooltip: {
      // hide tooltips on touch devices
      slots: {
        content:
          "[@media(pointer:coarse)]:hidden px-2 py-1 h-auto text-xs font-normal truncate relative",
      },
    },
    // v3 inputs are inline-flex, keep the old full-width behavior
    input: { slots: { base: "w-full" } },
    textarea: { slots: { root: "w-full" } },
    select: { slots: { base: "w-full" } },
    selectMenu: { slots: { base: "w-full" } },
    inputMenu: { slots: { base: "w-full" } },
    // tailwind v4 dropped cursor:pointer on buttons, bring it back
    button: { slots: { base: "cursor-pointer" } },
    dropdownMenu: { slots: { item: "cursor-pointer" } },
  },
});
