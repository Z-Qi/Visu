<template>
  <div>
    <div>
      <header>
        <h1>Video Editor</h1>
      </header>
    </div>

    <div>
      <video-container v-if="files.length" :options="videoOptions"></video-container>
    </div>

    <div>
      <label for="videoFile" class="btn">Open Video</label>
      <input id="videoFile" type="file" ref="videoInput" accept="video/*" @change="loadVideo" style="display: none" />
    </div>
  </div>
</template>

<script>
import VideoContainer from '../components/VideoContainer';
const { ipcRenderer } = window.require('electron');

export default {
  components: {
    VideoContainer
  },
  data() {
    return {
      files: [],
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
      this.videoOptions = Object.assign({}, this.videoOptions, {
        sources: [
          {
            src: URL.createObjectURL(this.$refs.videoInput.files[0]),
            type: this.$refs.videoInput.files[0].type
          }
        ]
      });
    }
  }
};
</script>
