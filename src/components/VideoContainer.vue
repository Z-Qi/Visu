<template>
  <b-container fluid>
    <b-row>
      <b-col cols="4">
        <b-row>
          <b-col>
            <video
              ref="videoPlayer"
              class="video-js"
              @loadedmetadata="updateMetadata"
              @play="playing = true"
              @pause="playing = false"
            ></video>
          </b-col>
        </b-row>
        <b-row class="my-1">
          <b-col>
            <vue-slider
              ref="slider"
              v-model="values"
              v-bind="sliderOptions"
              @drag-start="dragging = true"
              @drag-end="dragging = false"
            />
          </b-col>
        </b-row>
        <b-row align-h="center" class="mb-1" no-gutters>
          <b-col>
            <b-button
              class="mx-1"
              :disabled="video.framerate == 0"
              @click="skipFrames(-video.framerate)"
              variant="dark"
              v-text="'<<'"
            />
            <b-button
              class="mx-1"
              :disabled="video.framerate == 0"
              @click="skipFrames(-1)"
              variant="dark"
              v-text="'<'"
            />
            <b-button
              class="mx-1 flex-grow-1"
              :disabled="video.framerate == 0"
              @click="togglePlaying"
              variant="dark"
              v-text="playing ? 'Pause' : 'Play'"
            />
            <b-button
              class="mx-1"
              :disabled="video.framerate == 0"
              @click="skipFrames(1)"
              variant="dark"
              v-text="'>'"
            />
            <b-button
              class="mx-1"
              :disabled="video.framerate == 0"
              @click="skipFrames(video.framerate)"
              variant="dark"
              v-text="'>>'"
            />
          </b-col>
        </b-row>
      </b-col>
      <b-col cols="4">
        <draggable :list="cuts">
          <b-row slot="header" class="list-item">
            <b-button
              class="mx-auto"
              :disabled="
                cuts.some(c => c.start == values[0] && c.end == values[1]) || dragging || values[0] == values[1]
              "
              @click="addCut"
              variant="dark"
              v-text="'Add Cut'"
            />
            <b-button
              class="mx-auto"
              :disabled="cuts.length < 1"
              @click="generateSummary"
              variant="dark"
              v-text="'Generate Summary'"
            />
          </b-row>
          <b-row class="list-item" v-for="cut in cuts" :key="cut.start + cut.end"
            >Start: {{ cut.start }}<br />End: {{ cut.end }}</b-row
          >
        </draggable>
      </b-col>
      <b-col cols="4">
        <div class="w-50 mx-auto">
          <label id="video-btn" for="videoFile">Open Video</label>
          <input
            id="videoFile"
            type="file"
            ref="videoInput"
            accept="video/*"
            @change="loadVideo"
            style="display: none"
          />
        </div>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

import VueSlider from 'vue-slider-component';
import 'vue-slider-component/theme/antd.css';

import Draggable from 'vuedraggable';

import { spawn } from 'child_process';
import { setInterval, clearInterval } from 'timers';
import * as path from 'path';

import Video from '../util/video';

export default {
  name: 'VideoContainer',
  components: {
    VueSlider,
    Draggable,
  },
  data() {
    return {
      video: {},
      options: {
        autoplay: false,
        controls: true,
        preload: 'auto',
        fluid: true,
        sources: [],
        children: {
          controlBar: {
            children: {
              playToggle: true,
              volumeControl: true,
              fullscreenToggle: true,
            },
          },
        },
      },
      player: null,
      playing: false,
      updateInterval: null,
      values: [0, 0],
      sliderOptions: {
        min: 0,
        max: 0,
        minRange: 0,
        maxRange: 0,
      },
      currentSliderIndex: 0,
      dragging: false,
      cuts: [],
    };
  },
  mounted() {
    this.player = videojs(this.$refs.videoPlayer, this.options);
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
        }, 1000 / this.video.framerate);
      } else {
        clearInterval(this.updateInterval);
      }
    },
    options(newOptions, oldOptions) {
      this.player.src(newOptions.sources[0]);
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
        this.player.currentTime(currentFrame / this.video.framerate);
      }
    },
  },
  methods: {
    async loadVideo() {
      this.video = new Video(this.$refs.videoInput.files[0].path);
      this.features = {};
      this.options = Object.assign({}, this.options, {
        sources: [
          {
            src: URL.createObjectURL(this.$refs.videoInput.files[0]),
            type: this.$refs.videoInput.files[0].type,
          },
        ],
      });
      this.updateFramerate();
    },
    updateFramerate() {
      let ffmpeg = spawn(
        'ffmpeg',
        [
          '-i',
          this.video.path.replace(new RegExp(' ', 'g'), '\\ '),
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
        this.video.framerate = Math.round(parseFloat(data));
        //backup as this will probably take longer than loading metadata
        this.updateSliderOptions();

        if (this.video.resolution) this.$emit('metadata-loaded', this.video);
      });

      ffmpeg.stderr.on('data', data => {
        this.video.framerate = -1;
      });
    },
    updateMetadata() {
      this.video.resolution = {
        width: this.player.videoWidth(),
        height: this.player.videoHeight(),
      };

      if (this.video.framerate) this.$emit('metadata-loaded', this.video);

      this.updateSliderOptions();
    },
    updateSliderOptions() {
      let length = Math.round(this.player.duration() * this.video.framerate);
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
      this.player.currentTime(time + frames / this.video.framerate);
      this.values.splice(this.currentSliderIndex, 1, (this.values[this.currentSliderIndex] += frames));
    },
    setCurrent(index) {
      this.currentSliderIndex = index;
    },
    validCut() {},
    addCut() {
      this.cuts.splice(this.cuts.length, 0, {
        start: this.values[0],
        end: this.values[1],
      });
    },
    generateSummary() {
      let summary = '|';

      for (let cut of this.cuts) {
        summary += cut.start + ':' + cut.end + '|';
      }

      console.log(summary);
    },
  },
};
</script>

<style>
.video-js .vjs-volume-control {
  margin-right: auto;
}

.video-js .vjs-big-play-button {
  display: none;
}

.list-item {
  position: relative;
  display: block;
  padding: 0.75rem 1.25rem;
  margin-bottom: -1px;
  background-color: #fff;
  border: 1px solid rgba(0, 0, 0, 0.25);
}

.list-item:first-child {
  border-top-left-radius: 0.25rem;
  border-top-right-radius: 0.25rem;
}

.list-item:last-child {
  margin-bottom: 0;
  border-bottom-right-radius: 0.25rem;
  border-bottom-left-radius: 0.25rem;
}

#video-btn {
  background: var(--blue);
  color: white;
  cursor: pointer;
  border-radius: 0.25rem;
  padding: 0.5rem 1rem;
  width: 100%;
}
</style>
