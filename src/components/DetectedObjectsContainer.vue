<template>
  <div>
    <b-container>
      <b-row>
        <b-col cols="12" xl="6" v-for="frame in frames" :key="frame.src">
          <b-card no-body :img-src="frame.src" bg-variant="dark" text-variant="white" class="frame-card">
              <b-container>
                  <b-row>
                      <b-col cols="auto" v-for="(obj, index) in frame.objects" :key="`obj-${index}`" class="obj-label">
                        {{ obj }}
                      </b-col>
                  </b-row>
              </b-container>
          </b-card>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import { BContainer, BRow, BCol, BCard, BCardText } from 'bootstrap-vue';

export default {
  props: {
    frames: {
      type: Array,
    }
  },
  components: {
    BContainer,
    BRow,
    BCol,
    BCard,
    BCardText
  }
};
</script>

<style scoped>
.col {
  padding-bottom: 10px;
}

.obj-label {
    margin: 0.5em;
    background-color: gray;
    border-radius: 0.4em;
}

.frame-card {
  margin-bottom: 1em;
}
</style>
