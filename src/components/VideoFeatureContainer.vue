<template>
  <div>
    <b-container>
      <b-row>
        <b-col col md="4" v-for="feature in features" :key="feature.src">
          <feature-card :src="feature.src" :timestamp="feature.timestamp" />
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
            src: 'https://miro.medium.com/max/1838/1*f8jKCd8c6dctd1QqO2P_sA.png',
            timestamp: '1:23:456'
          },
          {
            src: 'https://miro.medium.com/max/1838/1*f8jKCd8c6dctd1QqO2P_sA.png',
            timestamp: '1:23:567'
          },
          {
            src: 'https://miro.medium.com/max/1838/1*f8jKCd8c6dctd1QqO2P_sA.png',
            timestamp: '1:23:789'
          },
          {
            src: 'https://miro.medium.com/max/1838/1*f8jKCd8c6dctd1QqO2P_sA.png',
            timestamp: '1:23:890'
          },
          {
            src: 'https://miro.medium.com/max/1838/1*f8jKCd8c6dctd1QqO2P_sA.png',
            timestamp: '1:23:901'
          },
          {
            src: 'https://miro.medium.com/max/1838/1*f8jKCd8c6dctd1QqO2P_sA.png',
            timestamp: '1:23:012'
          },
          {
            src: 'https://miro.medium.com/max/1838/1*f8jKCd8c6dctd1QqO2P_sA.png',
            timestamp: '1:23:123'
          },
          {
            src: 'https://miro.medium.com/max/1838/1*f8jKCd8c6dctd1QqO2P_sA.png',
            timestamp: '1:23:234'
          },
          {
            src: 'https://miro.medium.com/max/1838/1*f8jKCd8c6dctd1QqO2P_sA.png',
            timestamp: '1:23:345'
          },
          {
            src: 'https://miro.medium.com/max/1838/1*f8jKCd8c6dctd1QqO2P_sA.png',
            timestamp: '1:34:456'
          },
          {
            src: 'https://miro.medium.com/max/1838/1*f8jKCd8c6dctd1QqO2P_sA.png',
            timestamp: '1:45:456'
          },
          {
            src: 'https://miro.medium.com/max/1838/1*f8jKCd8c6dctd1QqO2P_sA.png',
            timestamp: '1:56:456'
          },
          {
            src: 'https://miro.medium.com/max/1838/1*f8jKCd8c6dctd1QqO2P_sA.png',
            timestamp: '1:67:456'
          },
          {
            src: 'https://miro.medium.com/max/1838/1*f8jKCd8c6dctd1QqO2P_sA.png',
            timestamp: '1:78:456'
          },
          {
            src: 'https://miro.medium.com/max/1838/1*f8jKCd8c6dctd1QqO2P_sA.png',
            timestamp: '1:89:456'
          },
          {
            src: 'https://miro.medium.com/max/1838/1*f8jKCd8c6dctd1QqO2P_sA.png',
            timestamp: '1:90:456'
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
