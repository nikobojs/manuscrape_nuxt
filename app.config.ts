export default defineAppConfig({
  ui: {
    tooltip: {
      // replace h-6 with h-auto in nuxt ui v2.10.0
      base: '[@media(pointer:coarse)]:hidden px-2 py-1 h-auto text-xs font-normal truncate relative'
    },
    modal: {
      base: 'relative text-left rtl:text-right overflow-visible w-full flex flex-col',
    }
  }
})
