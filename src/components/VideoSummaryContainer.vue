<template>
  <b-container fluid>
    <b-row align-h="center">
      <b-col cols="6">
        <video ref="videoPlayer" class="video-js" />
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

import { BContainer, BRow, BCol, BSpinner } from 'bootstrap-vue';

import { spawn } from 'child_process';
import { pathToFileURL } from 'url';

import * as fs from 'fs';

import { removeFile, removeDirectory, createDirectory, getFullPath, CLIP_DIR } from '../feature_detection/util';

export default {
  components: {
    BContainer,
    BRow,
    BCol,
    BSpinner,
  },
  props: {
    snippets: {
      type: Array,
      required: true,
    },
    inputVideo: {
      required: true,
    },
  },
  data() {
    return {
      player: null,
      video: null,
      snippetClips: [],
      options: {
        autoplay: false,
        controls: true,
        preload: 'auto',
        fluid: true,
        sources: [],
      },
    };
  },
  mounted() {
    removeDirectory(CLIP_DIR);
    this.player = videojs(this.$refs.videoPlayer, this.options);
    createDirectory(CLIP_DIR);
  },
  watch: {
    async snippets(newSnippets, oldSnippets) {
      const snippetsToDelete = this.snippetClips.filter(
        s => !newSnippets.some(ns => ns.start == s.start && ns.end == s.end)
      );
      await this.generateVideoFile(snippetsToDelete);
    },
    options() {
      this.player.src(this.options.sources[0]);
      this.player.removeClass('vjs-waiting');
    },
  },
  methods: {
    async generateVideoFile(snippetsToDelete) {
      this.player.reset();
      this.player.addClass('vjs-waiting');
      for (const snippet of snippetsToDelete) {
        removeFile(snippet.file);
      }
      this.snippetClips = [];
      if (this.snippets.length === 0) {
        this.options = Object.assign({}, this.options, {
          sources: [],
        });
      } else {
        for (const snippet of this.snippets) {
          const clipFile = await this.createClip(snippet.start, snippet.end);
          this.snippetClips.push({ start: snippet.start, end: snippet.end, file: clipFile });
        }
        this.video = await this.concatenateClips(this.snippetClips);
        this.options = Object.assign({}, this.options, {
          sources: [
            {
              src: `${pathToFileURL(this.video).toString()}?time=${Date.now()}`,
              type: 'video/mp4',
            },
          ],
        });
      }
    },
    concatenateClips(clips) {
      return new Promise((resolve, reject) => {
        const videoFile = getFullPath(CLIP_DIR, 'summary.mp4');
        const textFile = getFullPath(CLIP_DIR, 'clips.txt');
        let clipStrings = '';
        for (const clip of clips) {
          clipStrings += `file ${clip.file}\n`;
        }
        console.log(clipStrings);
        const ffmpeg = spawn('sh', [
          '-c',
          `echo "${clipStrings}" > ${textFile} && ffmpeg -f concat -safe 0 -i ${textFile} -c:a copy -c:v copy ${videoFile} -y`,
        ]);
        ffmpeg.on('exit', () => {
          removeFile(textFile);
          resolve(videoFile);
        });
        ffmpeg.stderr.on('data', data => {
          console.log(data.toString());
        });
      });
    },
    createClip(start, end) {
      return new Promise((resolve, reject) => {
        const clipFile = getFullPath(CLIP_DIR, `${start}_${end}.mp4`);
        const startTime = start / this.inputVideo.framerate;
        const endTime = end / this.inputVideo.framerate;
        const duration = endTime - startTime;
        const ffmpeg = spawn('sh', [
          '-c',
          `ffmpeg -ss ${startTime} -i "${this.inputVideo.path}" -t ${duration} -preset ultrafast ${clipFile} -n`,
        ]);
        ffmpeg.on('exit', () => {
          resolve(clipFile);
        });
        ffmpeg.stderr.on('data', data => {
          console.log(data.toString());
        });
      });
    },
  },
};
</script>