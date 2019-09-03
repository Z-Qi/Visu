<template>
  <div class="h-100">
    <b-container fluid class="h-100">
      <b-row class="m-4" no-gutters>
        <b-col>
          <video-container ref="videoContainer" @metadata-loaded="updateData"></video-container>
        </b-col>
      </b-row>

      <b-row class="m-4" no-gutters>
        <b-col cols="12">
          <b-tabs pills card>
            <b-tab title="Visualisation" active>
              <b-spinner v-if="video && !features.processedFrames" variant="primary"></b-spinner>
              <feature-canvas
                v-if="features.processedFrames"
                :images="features.processedFrames"
                :resolution="video.resolution"
              ></feature-canvas>
            </b-tab>
            <b-tab title="Keyframes" v-if="features.processedFrames" data-simplebar class="scrollable">
              <video-feature-container :features="features" />
            </b-tab>
          </b-tabs>
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
import { BContainer, BRow, BCol, BTabs, BTab, BButton, BFormFile, BSpinner } from 'bootstrap-vue';
import 'simplebar';
import 'simplebar/dist/simplebar.css';

import { detectObjects, detectObjectsInFrames } from '../feature_detection/yolo';
import { extractKeyframes, getShotBoundaryInfo } from '../feature_detection/keyframes';
import { extractFrames } from '../util/extract_frames';
import * as util from '../feature_detection/util';
import { spawn } from 'child_process';
import * as fs from 'fs';
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
    BSpinner,
  },
  data() {
    return {
      video: null,
      features: {},
    };
  },
  mounted() {
    ipcRenderer.on('open-video-file', () => {
      this.$refs.videoInput.click();
    });
  },
  methods: {
    async updateData(video) {
      console.log(video);
      this.video = video;
      await this.processVideo();
    },
    async processVideo() {
      const extractedKeyframes = await extractKeyframes(this.video, 5);
      // todo: add option to use other other frames
      // todo: figure out what to do with sbd info
      const processedFrames = await detectObjectsInFrames(extractedKeyframes);
      // const processedFrames = extractedKeyframes;
      this.features = {
        keyframes: extractedKeyframes,
        processedFrames: processedFrames,
      };
    },
  },
};
</script>

<style scoped>
.main-content {
  height: 80%;
  padding-top: 15px;
}

.footer {
  max-height: 20%;
}

.scrollable {
  max-height: 575px;
  overflow-x: auto;
}
</style>
