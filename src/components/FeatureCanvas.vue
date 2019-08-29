<template>
  <div>
    <b-form-select v-model="filter" :options="options" multiple :select-size="4"></b-form-select>
    <b-button id="filter-btn" variant="outline-primary" @click="filterImages">Add filter</b-button>
    <div id="stage" ref="stage" />
  </div>
</template>

<script>
import Konva from 'konva';
import { BFormSelect, BButton } from 'bootstrap-vue';

export default {
  props: {
    images: {
      type: Array,
      required: true,
    },
    resolution: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      stage: null,
      imageLayer: null,
      linkLayer: null,
      filter: [],
      options: [],
      canvasImages: [],
    };
  },
  watch: {
    images(newImages, oldImages) {
      this.updateImages();
    },
  },
  mounted() {
    const stageStyle = window.getComputedStyle(this.$refs.stage);
    this.stage = new Konva.Stage({
      container: 'stage',
      width: this.$refs.stage.clientWidth - parseFloat(stageStyle.paddingLeft) - parseFloat(stageStyle.paddingRight),
      height: window.innerHeight / 2,
      draggable: true,
    });

    this.imageLayer = new Konva.Layer();
    this.linkLayer = new Konva.Layer();
    this.stage.add(this.imageLayer);
    this.stage.add(this.linkLayer);

    this.stage.on('wheel', e => {
      e.evt.preventDefault();
      const scaleBy = 1.05;
      const oldScale = this.stage.scaleX();
      const mousePos = this.stage.getPointerPosition();
      const mousePointTo = {
        x: mousePos.x / oldScale - this.stage.x() / oldScale,
        y: mousePos.y / oldScale - this.stage.y() / oldScale,
      };

      const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
      this.stage.scale({ x: newScale, y: newScale });

      const newPos = {
        x: -(mousePointTo.x - mousePos.x / newScale) * newScale,
        y: -(mousePointTo.y - mousePos.y / newScale) * newScale,
      };
      this.stage.position(newPos);

      this.stage.batchDraw();
    });

    window.addEventListener('resize', () => {
      this.stage.size({
        width: this.$refs.stage.clientWidth - parseFloat(stageStyle.paddingLeft) - parseFloat(stageStyle.paddingRight),
        height: window.innerHeight / 2,
      });
      this.stage.batchDraw();
    });

    this.updateImages();
  },
  methods: {
    async updateImages() {
      this.imageLayer.removeChildren();
      this.canvasImages = [];
      this.options = [];

      const width = 250;
      const height = (width * this.resolution.height) / this.resolution.width;
      const y = this.stage.getHeight() / 2 - height / 2;

      for (const i in this.images) {
        console.log(this.images[i]);
        this.options.push(...this.images[i].objects);
        let konvaImage = new Konva.Image({
          x: 50 + (75 + width) * i,
          y: y,
          width: width,
          height: height,
          draggable: true,
        });
        konvaImage.on('dragmove', () => this.linkImages());
        this.imageLayer.add(konvaImage);

        let image = new window.Image();
        image.src = this.images[i].src;
        await this.loadImage(image);
        this.canvasImages.push(konvaImage);

        konvaImage.image(image);

        this.imageLayer.draw();
      }
      // remove duplicates
      this.options = [...new Set(this.options)];

      this.linkImages();
    },
    linkImages() {
      if (this.canvasImages.length !== this.images.length) return;

      this.linkLayer.removeChildren();
      let images = this.canvasImages;
      for (let i = 1; i < images.length; i++) {
        let a = images[i - 1];
        let b = images[i];
        let points = [a.x() + a.width(), a.y() + a.height() / 2, b.x(), b.y() + b.height() / 2];
        let link = new Konva.Arrow({
          points: points,
          pointerLength: 15,
          pointerWidth: 15,
          stroke: '#007bff',
          fill: '#007bff',
        });
        this.linkLayer.add(link);
      }
      this.linkLayer.draw();
    },
    loadImage(image) {
      return new Promise(resolve => {
        image.onload = resolve;
      });
    },
    filterImages() {
      for (let i = 0; i < this.images.length; ++i) {
        if (this.filter.every(val => this.images[i].objects.includes(val))) {
          this.canvasImages[i].y(this.canvasImages[i].y() - 300);
        }
      }
      this.imageLayer.draw();
      this.linkImages();
    },
  },
};
</script>

<style scoped>
#stage {
  width: 100%;
  padding: 10px;
  border: 2px solid #007bff;
  border-radius: 8px;
  margin: 10px;
  cursor: pointer;
}

#filter-btn {
  margin-top: 10px;
}
</style>
