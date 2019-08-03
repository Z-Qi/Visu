<template>
  <div>
    <b-container>
      <b-row>
        <b-col col md="4" v-for="keyframe in features.keyframes" :key="keyframe.src">
          <feature-card
            :src="keyframe.src"
            :timestamp="keyframe.timestamp"
            @click.native="$emit('frame-selected', keyframe.timestamp)"
          />
        </b-col>
      </b-row>
      <b-row>
        <b-col v-for="boundary in features.shotBoundaries" :key="boundary.start">
          start: {{ boundary.start }}
          end: {{ boundary.end }}
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import FeatureCard from './FeatureCard';
import { BContainer, BRow, BCol } from 'bootstrap-vue';

export default {
  props: {
    features: {
      type: Object,
      required: true
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

<style scoped>
.col {
  padding-bottom: 10px;
}
</style>
