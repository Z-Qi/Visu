<template>
  <div>
    <b-container>
      <b-row>
        <b-col col md="4" v-for="feature in features" :key="feature.src">
          <feature-card
            :src="feature.src"
            :timestamp="feature.timestamp"
            @click.native="$emit('frame-selected', feature.timestamp)"
          />
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<style scoped>
.col {
  padding-bottom: 10px;
}
</style>

<script>
import FeatureCard from './FeatureCard';
import { BContainer, BRow, BCol } from 'bootstrap-vue';

export default {
  props: {
    features: {
      type: Array,
      default() {
        return [
          {
            src: 'https://vuejs.org/images/logo.png',
            timestamp: 0
          }
        ];
      }
    }
  },
  components: {
    FeatureCard,
    BContainer,
    BRow,
    BCol
  }
};
</script>
