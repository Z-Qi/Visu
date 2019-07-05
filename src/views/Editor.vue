<template>
  <div>
    <div>
      <header>
        <h1>Video Editor</h1>
      </header>
    </div>

    <div>
      <video-container :path="filePath" :options="videoOptions"></video-container>
    </div>

    <div>
      <label for="videoFile">Open Video</label>
      <input id="videoFile" type="file" ref="videoInput" accept="video/*" @change="loadVideo" style="display: none" />
    </div>

    <div>
      <button @click="python">Call Python</button>
    </div>
    <div>
      <button @click="yolo">Run yolo</button>
    </div>
  </div>
</template>

<script>
import VideoContainer from '../components/VideoContainer';
import { detectObjects } from '../feature_detection/yolo'
import { spawn } from 'child_process';
const { app, ipcRenderer } = window.require('electron');

export default {
  components: {
    VideoContainer
  },
  data() {
    return {
      files: [],
      filePath: '',
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
      this.videoOptions = Object.assign({}, this.videoOptions, {
        sources: [
          {
            src: URL.createObjectURL(this.$refs.videoInput.files[0]),
            type: this.$refs.videoInput.files[0].type
          }
        ]
      });
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
    }
  }
};
</script>
