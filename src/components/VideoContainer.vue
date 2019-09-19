<template>
  <b-container fluid>
    <b-row>
      <b-col>
        <video
          ref="videoPlayer"
          class="video-js"
          @loadedmetadata="updateMetadata"
          @play="playing = true"
          @pause="playing = false"
        />
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
    <b-row 
      align-h="center" 
      class="mb-1" 
      no-gutters>
      <b-col>
        <b-button
          :disabled="!video.framerate"
          class="mx-1"
          variant="dark"
          @click="skipFrames(-video.framerate)"
        >
          <font-awesome-icon icon="fast-backward" />
        </b-button>
        <b-button 
          :disabled="!video.framerate" 
          class="mx-1" 
          variant="dark" 
          @click="skipFrames(-1)">
          <font-awesome-icon 
            icon="caret-left" 
            size="lg" />
        </b-button>
        <b-button
          :disabled="!video.framerate"
          class="mx-1 flex-grow-1"
          variant="dark"
          @click="togglePlaying"
        >
          <font-awesome-icon :icon="playing ? 'pause' : 'play'" />
        </b-button>
        <b-button 
          :disabled="!video.framerate" 
          class="mx-1" 
          variant="dark" 
          @click="skipFrames(1)">
          <font-awesome-icon 
            icon="caret-right" 
            size="lg" />
        </b-button>
        <b-button
          :disabled="!video.framerate"
          class="mx-1"
          variant="dark"
          @click="skipFrames(video.framerate)"
        >
          <font-awesome-icon icon="fast-forward" />
        </b-button>
      </b-col>
    </b-row>
    <b-row class="mt-3">
      <b-col 
        data-simplebar 
        class="scrollable">
        <draggable 
          :list="snippets" 
          draggable=".item">
          <b-row
            v-for="(snippet, index) in snippets"
            :key="snippet.start + snippet.end"
            no-gutters
            class="list-item item"
            style="text-align: start;"
          >
            <b-col cols="6">
              <b-row no-gutters>
                <b-col cols="7">
                  First Frame:
                  <br >Final Frame:
                </b-col>
                <b-col cols="5">
                  {{ snippet.start }}
                  <br >
                  {{ snippet.end }}
                </b-col>
              </b-row>
            </b-col>
            <b-col cols="5">
              Time:&emsp;{{ (snippet.start / video.framerate).toFixed(2) }} s
              <br >
              Time:&emsp;{{ (snippet.end / video.framerate).toFixed(2) }} s
            </b-col>
            <b-col cols="1">
              <font-awesome-icon 
                icon="times" 
                @click="removeSnippet(index)" />
            </b-col>
          </b-row>
          <b-row 
            slot="header" 
            no-gutters 
            class="list-item header">
            <b-button
              :disabled="
                snippets.some(c => c.start == values[0] && c.end == values[1]) || dragging || values[0] == values[1]
              "
              class="mr-1 flex-grow-1"
              variant="dark"
              @click="addSnippet"
              v-text="'Add Snippet'"
            />
            <b-button
              :disabled="snippets.length < 1"
              class="mr-1 flex-grow-1"
              variant="dark"
              @click="generateSummaryDialog"
              v-text="'Save Summary'"
            />
            <b-button 
              :disabled="snippets.length < 2" 
              variant="dark" 
              @click="sortSnippets">
              <font-awesome-icon 
                icon="sort" 
                size="lg" />
            </b-button>
          </b-row>
        </draggable>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <input
          id="videoFile"
          ref="videoInput"
          type="file"
          accept="video/*"
          style="display: none"
          @change="loadVideo"
        >
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

import 'simplebar';
import 'simplebar/dist/simplebar.css';

import { spawn } from 'child_process';
import { setInterval, clearInterval } from 'timers';
import * as path from 'path';

import Video from '../util/video';
import { generateSummary } from '../util/generate_summary';
const { app, dialog } = require('electron').remote;
const { ipcRenderer } = window.require('electron');

import ProgressBar from 'electron-progressbar';

import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faTimes,
  faSort,
  faFastForward,
  faFastBackward,
  faCaretLeft,
  faCaretRight,
  faPlay,
  faPause,
} from '@fortawesome/free-solid-svg-icons';
library.add(faTimes, faSort, faFastForward, faFastBackward, faCaretLeft, faCaretRight, faPlay, faPause);

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
        controls: false,
        preload: 'auto',
        fluid: true,
        sources: [],
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
      snippets: [],
    };
  },
  watch: {
    playing(newValue, oldValues) {
      if (newValue) {
        let index = 0;
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
      console.log(newOptions.sources[0]);
      this.values = [0, 0];
      this.snippets = [];
    },
    snippets() {
      this.$emit('snippets-changed', this.snippets);
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
  mounted() {
    this.player = videojs(this.$refs.videoPlayer, this.options);
    ipcRenderer.on('open-video-file', () => {
      this.$refs.videoInput.click();
    });
  },
  beforeDestroy() {
    if (this.player) {
      this.player.dispose();
    }
  },
  methods: {
    async loadVideo() {
      if (this.$refs.videoInput.files[0]) {
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
      }
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
          '"s/.*, \\(.*\\) fp.*/\\1/p"',
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
    seek(timestamp) {
      this.player.currentTime(timestamp);
      this.values.splice(this.currentSliderIndex, 1, Math.round(timestamp * this.video.framerate));
    },
    setCurrent(index) {
      this.currentSliderIndex = index;
    },
    addSnippet() {
      this.snippets.splice(this.snippets.length, 0, {
        start: this.values[0],
        end: this.values[1],
      });
    },
    removeSnippet(index) {
      this.snippets.splice(index, 1);
    },
    sortSnippets() {
      let sorted = this.snippets.sort((s1, s2) => (s1.start > s2.start ? 1 : -1));
      this.snippets = sorted;
    },
    generateSummaryDialog() {
      dialog.showSaveDialog(null, { defaultPath: app.getPath('documents') }, async summaryPath => {
        const snippetTimes = this.snippets.map(snippet => {
          return {
            start: snippet.start / this.video.framerate,
            end: snippet.end / this.video.framerate,
          };
        });

        if (summaryPath) {
          ipcRenderer.send('start-progress', {
            title: 'Generate Summary',
            text: 'Generating summary...',
            detail: `Saving to ${summaryPath}`,
            completedDetail: 'Finished!',
          });
          await generateSummary(snippetTimes, this.video.path, summaryPath);
          ipcRenderer.send('stop-progress');
        }
      });
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

.scrollable {
  max-height: 650px;
}

.header {
  position: sticky !important;
  top: 0px;
  z-index: 1;
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
</style>
