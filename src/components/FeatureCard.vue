<template>
  <b-card no-body :img-src="src" bg-variant="dark" text-variant="white">
    <b-card-text>{{ timestamp.toFixed(3).replace('.', ':') }}</b-card-text>
  </b-card>
</template>

<script>
import { BCard, BCardText } from 'bootstrap-vue';

export default {
  props: {
    src: {
      type: String,
      default: 'N/A'
    },
    timestamp: {
      type: Number,
      default: 0
    }
  },
  components: {
    BCard,
    BCardText
  }
};
</script>
