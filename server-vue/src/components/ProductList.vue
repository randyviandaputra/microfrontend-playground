<template>
  <div class="product-list">
    <h2 class="product-list__header">{{title}}</h2>
    <ul>
      <li v-for="(item, idx) in items" :key="idx" class="product-item">
        <img :src="item.imageUrl" class="product-item__image">
        <h4 class="product-item__title">{{ item.title }}</h4>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      required: true
    },
    items: {
      type: Array,
      default: () => []
    }
  },
  methods: {}
};
</script>
