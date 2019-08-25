<template>
  <div class="full-height">
    <b-container fluid class="full-height">
      <b-row>
        <b-col>
          <header class="header">
            <h1>Video Editor</h1>
          </header>
        </b-col>
      </b-row>

      <b-row class="main-content" no-gutters>
        <b-col>
          <video-container
            ref="videoContainer"
            :path="video ? video.path : ''"
            :options="videoOptions"
            v-on:framerate-updated="updateFramerate"
          ></video-container>

          <div>
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

        <b-col data-simplebar class="scrollable">
          <div>
            <b-tabs pills card>
              <b-tab title="Keyframes" active>
                <video-feature-container :features="features" v-on:frame-selected="seek" />
              </b-tab>
              <b-tab v-if="features.processedFrames" title="Visualisation">
                <feature-canvas :images="features.processedFrames" :resolution="video.resolution"></feature-canvas>
              </b-tab>
            </b-tabs>
          </div>
        </b-col>
      </b-row>

      <b-row>
        <b-col>
          <b-button :disabled="!video" @click="skipFrames(-framerate)" variant="primary">&lt;&lt;</b-button>
          <b-button :disabled="!video" @click="skipFrames(-1)" variant="primary">&lt;</b-button>
          <b-button :disabled="!video" @click="togglePlaying" variant="primary">Play/Pause</b-button>
          <b-button :disabled="!video" @click="skipFrames(1)" variant="primary">&gt;</b-button>
          <b-button :disabled="!video" @click="skipFrames(framerate)" variant="primary">&gt;&gt;</b-button>
        </b-col>
        <b-col>
          <b-button :disabled="!video" @click="processVideo" variant="primary">Process Video</b-button>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import VideoContainer from '../components/VideoContainer';
import VideoFeatureContainer from '../components/VideoFeatureContainer';
import DetectedObjectsContainer from '../components/DetectedObjectsContainer';
import FeatureCanvas from '../components/FeatureCanvas';
import { BContainer, BRow, BCol, BTabs, BTab, BButton, BFormFile } from 'bootstrap-vue';
import 'simplebar';
import 'simplebar/dist/simplebar.css';

import {
  detectObjects,
  detectObjectsInFrames,
} from '../feature_detection/yolo';
import {
  extractKeyframes,
  getShotBoundaryInfo,
} from '../feature_detection/keyframes';
import { extractFrames } from '../util/extract_frames';
import * as util from '../feature_detection/util';
import { spawn } from 'child_process';
import Video from '../util/video';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';

const { app, ipcRenderer } = window.require('electron');

export default {
  components: {
    VideoContainer,
    VideoFeatureContainer,
    DetectedObjectsContainer,
    FeatureCanvas,
    BContainer,
    BRow,
    BCol,
    BTabs,
    BTab,
  },
  data() {
    return {
      video: null,
      features: {},
      videoOptions: {
        autoplay: false,
        controls: true,
        fluid: true,
        sources: [],
      },
    };
  },
  mounted() {
    ipcRenderer.on('open-video-file', () => {
      this.$refs.videoInput.click();
    });
  },
  methods: {
    loadVideo() {
      this.video = new Video(this.$refs.videoInput.files[0].path);
      this.features = {};
      this.videoOptions = Object.assign({}, this.videoOptions, {
        sources: [
          {
            src: URL.createObjectURL(this.$refs.videoInput.files[0]),
            type: this.$refs.videoInput.files[0].type,
          },
        ],
      });
    },
    updateFramerate(framerate) {
      this.video.framerate = framerate;
      this.updateResolution();
    },
    updateResolution() {
      this.video.resolution = this.$refs.videoContainer.getResolution();
    },
    togglePlaying() {
      this.$refs.videoContainer.togglePlaying();
    },
    skipFrames(frames) {
      this.$refs.videoContainer.skipFrames(frames);
    },
    seek(timestamp) {
      this.$refs.videoContainer.seek(timestamp);
    },
    async processVideo() {
      const extractedKeyframes = await extractKeyframes(this.video, 5);
      // todo: add option to use other other frames
      // todo: figure out what to do with sbd info
      const processedFrames = await detectObjectsInFrames(extractedKeyframes);
      this.features = {
        keyframes: extractedKeyframes,
        processedFrames: processedFrames,
      };
    },
  },
};
</script>

<style scoped>
.full-height {
  height: 100%;
}

.header {
  max-height: 15%;
  margin: 50px 0px 0px 0px;
}

.main-content {
  height: 70%;
  margin: 50px 0px;
}

.footer {
  max-height: 15%;
}

.scrollable {
  height: 100%;
  overflow-x: auto;
}

#video-btn {
  background: var(--blue);
  color: white;
  cursor: pointer;
  border-radius: 0.25rem;
  padding: 0.5rem 1rem;
}

</style>
