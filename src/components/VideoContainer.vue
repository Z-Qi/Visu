<template>
  <div>
    <video ref="videoPlayer" class="video-js"></video>
  </div>
</template>

<script>
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

import { spawn } from 'child_process';

export default {
  name: 'VideoContainer',
  props: {
    path: {
      type: String,
      default: ''
    },
    options: {
      type: Object,
      default() {
        return {};
      }
    }
  },
  data() {
    return {
      player: null,
      framerate: 0
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
    options(newOptions, oldOptions) {
      this.player.src(newOptions.sources[0]);
      this.updateFramerate();
    }
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
          '"s/.*, \\\(.*\\\) fp.*/\\1/p"'
        ],
        {
          shell: true
        }
      );

      ffmpeg.stdout.on('data', data => {
        this.framerate = Math.round(parseFloat(data));
        this.$emit('framerate-updated', this.framerate);
      });

      ffmpeg.stderr.on('data', data => {
        this.framerate = -1;
      });
    },
    togglePlaying() {
      if (this.player.paused()) {
        this.player.play();
        this.$emit('playing');
      } else {
        this.player.pause();
        this.$emit('paused');
      }
    },
    skipFrames(frames) {
      let time = this.player.currentTime();
      this.player.currentTime(time + frames / this.framerate);
    },
    seek(timestamp) {
      this.player.currentTime(parseFloat(timestamp));
    },
    getResolution() {
      console.log(this.player.videoWidth());
      return {
        width: this.player.videoWidth(),
        height: this.player.videoHeight()
      };
    }
  }
};
</script>

<style>
.video-js .vjs-big-play-button {
  display: none;
}
</style>
