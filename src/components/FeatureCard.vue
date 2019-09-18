<template>
  <b-card 
    :img-src="src" 
    no-body 
    bg-variant="dark" 
    text-variant="white">
    <b-card-text>{{ timestamp.toFixed(3).replace('.', ':') }}</b-card-text>
  </b-card>
</template>

<script>
import { BCard, BCardText } from 'bootstrap-vue';

export default {
  components: {
    BCard,
    BCardText
  },
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
};
</script>
