<template>
  <div>
    <video
      ref="videoPlayer"
      class="video-js"
      @loadedmetadata="updateSliderOptions"
      @play="playing = true"
      @pause="playing = false"
    ></video>
    <h6>Framerate: {{ framerate }}</h6>
    <vue-slider
      ref="slider"
      v-model="values"
      v-bind="sliderOptions"
      @drag-start="dragging = true"
      @drag-end="dragging = false"
    >
    </vue-slider>
    <b-container>
      <b-row align-h="center" class="mt-1" no-gutters>
        <b-button class="mr-1" :disabled="framerate == 0" @click="skipFrames(-framerate)" variant="dark">
          &lt;&lt;
        </b-button>
        <b-button class="mr-1" :disabled="framerate == 0" @click="skipFrames(-1)" variant="dark">&lt;</b-button>
        <b-button
          class="mr-1 flex-grow-1"
          :disabled="framerate == 0"
          @click="togglePlaying"
          variant="dark"
          v-text="playing ? 'Pause' : 'Play'"
        ></b-button>
        <b-button class="mr-1" :disabled="framerate == 0" @click="skipFrames(1)" variant="dark">&gt;</b-button>
        <b-button class="mr-1" :disabled="framerate == 0" @click="skipFrames(framerate)" variant="dark"
          >&gt;&gt;</b-button
        >
      </b-row>
    </b-container>
  </div>
</template>

<style>
.video-js .vjs-volume-control {
  margin-right: auto;
}
</style>

<script>
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

import VueSlider from 'vue-slider-component';
import 'vue-slider-component/theme/antd.css';

import { spawn } from 'child_process';
import { setInterval, clearInterval } from 'timers';

export default {
  name: 'VideoContainer',
  props: {
    path: {
      type: String,
      default: '',
    },
    options: {
      type: Object,
      default() {
        return {};
      },
    },
  },
  components: {
    VueSlider,
  },
  data() {
    return {
      player: null,
      playing: false,
      updateInterval: null,
      framerate: 0,
      values: [0, 0],
      sliderOptions: {
        min: 0,
        max: 0,
        minRange: 0,
        maxRange: 0,
      },
      currentSliderIndex: 0,
      dragging: false,
    };
  },
  mounted() {
    this.player = videojs(this.$refs.videoPlayer, this.options);
    this.updateFramerate();
  },
  beforeDestroy() {
    if (this.player) {
      this.player.dispose();
    }
  },
  watch: {
    playing(newValue, oldValues) {
      if (newValue) {
        let index = this.currentSliderIndex;
        let val = this.values[index];

        this.updateInterval = setInterval(() => {
          this.values.splice(index, 1, val++);
        }, 1000 / this.framerate);
      } else {
        clearInterval(this.updateInterval);
      }
    },
    options(newOptions, oldOptions) {
      this.player.src(newOptions.sources[0]);
      this.updateFramerate();
    },
    values(newValues, oldValues) {
      if (newValues[0] > newValues[1]) {
        this.values[1] = this.values[0];
      }

      if (oldValues !== newValues) {
        this.currentSliderIndex = oldValues[0] != newValues[0] ? 0 : 1;
      }

      let currentFrame = oldValues[0] != newValues[0] ? newValues[0] : newValues[1];

      if (this.dragging || currentFrame == this.sliderOptions.max) {
        this.player.pause();
        this.playing = false;
        this.player.currentTime(currentFrame / this.framerate);
      }
    },
  },
  methods: {
    updateFramerate() {
      let ffmpeg = spawn(
        'ffmpeg',
        [
          '-i',
          this.path.replace(new RegExp(' ', 'g'), '\\ '),
          '2>&1',
          '|',
          'sed',
          '-n',
          '"s/.*, \\\(.*\\\) fp.*/\\1/p"',
        ],
        {
          shell: true,
        }
      );

      ffmpeg.stdout.on('data', data => {
        this.framerate = Math.round(parseFloat(data));
        //backup as this will probably take longer than loading metadata
        this.updateSliderOptions();
        this.$emit('framerate-updated', this.framerate);
      });

      ffmpeg.stderr.on('data', data => {
        this.framerate = -1;
      });
    },
    updateSliderOptions() {
      let length = Math.round(this.player.duration() * this.framerate);
      this.$set(this.sliderOptions, 'max', length);
      this.$set(this.sliderOptions, 'maxRange', length);
    },
    togglePlaying() {
      if (this.player.paused()) {
        this.player.play();
      } else {
        this.player.pause();
      }
    },
    skipFrames(frames) {
      let time = this.player.currentTime();
      this.player.currentTime(time + frames / this.framerate);
      this.values[this.currentSliderIndex] += frames;
    },
    getResolution() {
      return {
        width: this.player.videoWidth(),
        height: this.player.videoHeight(),
      };
    },
    setCurrent(index) {
      this.currentSliderIndex = index;
    },
  },
};
</script>

<style>
.video-js .vjs-big-play-button {
  display: none;
}
</style>
