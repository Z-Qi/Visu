<template>
  <div class="h-100">
    <b-container fluid class="h-100 overflow-auto">
      <b-row no-gutters class="h-100">
        <b-col cols="4" class="mt-4">
          <video-container
            ref="videoContainer"
            @metadata-loaded="updateData"
            @snippets-changed="onSnippetsChanged"
          />
        </b-col>
        <b-col cols="8" class="mt-4">
          <b-tabs pills card>
            <b-tab class="h-100" title="Visualisation" active>
              <b-spinner v-if="video && !features.processedFrames" variant="primary" />
              <feature-canvas
                v-if="features.processedFrames"
                :images="features.processedFrames"
                :resolution="video.resolution"
                :snippets="snippets"
                @frame-clicked="onFrameClicked"
              />
            </b-tab>
            <b-tab title="Clustering">
              <b-spinner v-if="video && !features.clusteredImages" variant="primary" />
              <cluster-canvas
                v-if="features.clusteredImages"
                :images="features.clusteredImages"
                :resolution="video.resolution"
                :snippets="snippets"
                @frame-clicked="onFrameClicked"
              />
            </b-tab>
            <b-tab title="Summary">
              <video-summary-container :snippets="snippets" :inputVideo="video" />
            </b-tab>
          </b-tabs>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import VideoContainer from '../components/VideoContainer';
import FeatureCanvas from '../components/FeatureCanvas';
import ClusterCanvas from '../components/ClusterCanvas';
import VideoSummaryContainer from '../components/VideoSummaryContainer';
import { BContainer, BRow, BCol, BTabs, BTab, BButton, BFormFile, BSpinner } from 'bootstrap-vue';
import 'simplebar';
import 'simplebar/dist/simplebar.css';

import Splitpanes from 'splitpanes';
import 'splitpanes/dist/splitpanes.css';

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
    ClusterCanvas,
    FeatureCanvas,
    VideoSummaryContainer,
    BContainer,
    BRow,
    BCol,
    BTabs,
    BTab,
    BSpinner,
    Splitpanes,
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
      const extractedKeyframes = await extractKeyframes(this.video, 10);

      const processedFrames = await detectObjectsInFrames(extractedKeyframes);

      const clusteredImages = await getClusteredImages(processedFrames);

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

<style>
.splitpanes--vertical > .splitpanes__splitter {
  box-sizing: content-box !important;
  width: 1px;
  border-width: 0 5px;
  border-color: white;
  border-style: solid;
  background: rgba(0, 0, 0, 0.25);
}
</style>
