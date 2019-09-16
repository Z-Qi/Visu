<template>
  <div>
    <b-container fluid>
      <b-row class="my-4" no-gutters>
        <b-col cols="3">
          <video-container ref="videoContainer" @metadata-loaded="updateData" @snippets-changed="onSnippetsChanged"></video-container>
        </b-col>
        <b-col cols="9">
          <b-tabs pills card>
            <b-tab title="Visualisation" active>
              <b-spinner v-if="video && !features.processedFrames" variant="primary"></b-spinner>
              <feature-canvas
                v-if="features.processedFrames"
                :images="features.processedFrames"
                :resolution="video.resolution"
                :snippets="snippets"
                @frame-clicked="onFrameClicked"
              ></feature-canvas>
            </b-tab>
            <b-tab title="Clustering">
              <b-spinner v-if="video && !features.clusteredImages" variant="primary"></b-spinner>
              <cluster-canvas
                v-if="features.clusteredImages"
                :images="features.clusteredImages"
                :resolution="video.resolution"
                :snippets="snippets"
                @frame-clicked="onFrameClicked"
              ></cluster-canvas>
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
import ClusterCanvas from '../components/ClusterCanvas';
import { BContainer, BRow, BCol, BTabs, BTab, BButton, BFormFile, BSpinner } from 'bootstrap-vue';
import 'simplebar';
import 'simplebar/dist/simplebar.css';

import { detectObjects, detectObjectsInFrames } from '../feature_detection/yolo';
import { extractKeyframes, getShotBoundaryInfo } from '../feature_detection/keyframes';
import { getClusteredImages } from '../feature_detection/clustering';
import { extractFrames } from '../util/extract_frames';
import * as util from '../feature_detection/util';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as url from 'url';

export default {
  components: {
    VideoContainer,
    VideoFeatureContainer,
    DetectedObjectsContainer,
    ClusterCanvas,
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
      snippets: [],
      features: {},
    };
  },
  methods: {
    async updateData(video) {
      console.log(video);
      this.video = video;
      this.features = {};
      await this.processVideo();
    },
    async processVideo() {
      const extractedKeyframes = await extractKeyframes(this.video, 5);
      // todo: add option to use other other frames
      // todo: figure out what to do with sbd info
      const processedFrames = await detectObjectsInFrames(extractedKeyframes);
      const clusteredImages = await getClusteredImages(processedFrames);
      // const processedFrames = extractedKeyframes;
      this.features = {
        keyframes: extractedKeyframes,
        processedFrames: processedFrames,
        clusteredImages: clusteredImages,
      };
    },
    onSnippetsChanged(snippets) {
      this.snippets = snippets;
    },
    onFrameClicked(frame) {
      this.$refs.videoContainer.seek(frame.timestamp);
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
  max-height: 900px;
  overflow-x: auto;
}
</style>
