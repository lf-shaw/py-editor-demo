export default {
  path: "/editor",
  meta: {
    icon: "baselineSecurity",
    title: "编辑器",
    rank: 50
  },
  children: [
    {
      path: "/editor/index",
      component: () => import("@/views/editor/index.vue"),
      name: "Editor",
      meta: {
        icon: "baselineKey",
        title: "编辑器",
        showParent: true
      }
    }
  ]
};
