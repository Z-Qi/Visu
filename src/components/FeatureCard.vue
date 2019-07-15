<template>
  <b-card no-body overlay :img-src="src" bg-variant="dark" text-variant="white">
    <b-card-text>{{ timestamp }}</b-card-text>
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
      type: String,
      default: '0:00'
    }
  },
  components: {
    BCard,
    BCardText
  }
};
</script>
