<template>
  <div class="full-height">
    <b-container fluid class="full-height">
      <b-row align-v="start">
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
            :path="filePath"
            :options="videoOptions"
            v-on:framerate-updated="updateFramerate"
          ></video-container>

          <div>
            <label for="videoFile">Open Video</label>
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
          <video-feature-container :features="features" v-on:frame-selected="seek"></video-feature-container>
        </b-col>
      </b-row>

      <b-row align-v="end">
        <b-col>
          <button @click="python">Call Python</button>
        </b-col>
        <b-col>
          <button @click="yolo">Run yolo</button>
        </b-col>
        <b-col>
          <button v-if="framerate" @click="keyframes">Show keyframes</button>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

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
</style>

<script>
import VideoContainer from '../components/VideoContainer';
import VideoFeatureContainer from '../components/VideoFeatureContainer';
import { BContainer, BRow, BCol } from 'bootstrap-vue';
import 'simplebar';
import 'simplebar/dist/simplebar.css';

import { detectObjects } from '../feature_detection/yolo';
import { extractKeyframes } from '../feature_detection/keyframes';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';

const { app, ipcRenderer } = window.require('electron');

export default {
  components: {
    VideoContainer,
    VideoFeatureContainer,
    BContainer,
    BRow,
    BCol
  },
  data() {
    return {
      files: [],
      filePath: '',
      framerate: 0,
      features: [],
      videoOptions: {
        autoplay: false,
        controls: true,
        fluid: true,
        sources: []
      }
    };
  },
  mounted() {
    ipcRenderer.on('open-video-file', () => {
      this.$refs.videoInput.click();
    });
  },
  methods: {
    loadVideo() {
      this.files = this.$refs.videoInput.files;
      this.filePath = this.files[0].path;
      this.features = [];
      this.videoOptions = Object.assign({}, this.videoOptions, {
        sources: [
          {
            src: URL.createObjectURL(this.$refs.videoInput.files[0]),
            type: this.$refs.videoInput.files[0].type
          }
        ]
      });
    },
    updateFramerate(framerate) {
      this.framerate = framerate;
    },
    seek(timestamp) {
      this.$refs.videoContainer.seek(timestamp);
    },
    python() {
      let python = spawn('python3', ['./src/python_scripts/placeholder_test.py']);

      python.stdout.on('data', data => {
        console.log('Python: ' + data);
      });

      python.stderr.on('data', data => {
        console.log('Python: ' + data);
      });
    },
    async yolo() {
      let objects = await detectObjects(this.filePath, '1/50');
      console.log(objects);
    },
    async keyframes() {
      //changed to 5 for testing on short videos
      const keyframeDirectory = await extractKeyframes(this.filePath, 5);
      const keyframePaths = fs.readdirSync(keyframeDirectory).map(frame => {
        return {
          src: url.pathToFileURL(path.join(keyframeDirectory, frame)).toString() + '?time=' + Date.now(),
          timestamp: parseInt(frame.match(/\d+/)[0]) / this.framerate
        };
      });
      console.log(keyframePaths);
      this.features = keyframePaths.sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1));
    }
  }
};
</script>
