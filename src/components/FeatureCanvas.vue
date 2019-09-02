<template>
  <div>
    <b-form-select v-model="filter" :options="options" multiple :select-size="4"></b-form-select>
    <b-button id="filter-btn" variant="outline-primary" @click="addNewFilter()">Add filter</b-button>
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
      filterRows: [],
      options: [],
      indexMap: new Map(),
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
      this.filterRows = [];
      this.addFilter([]);
      this.options = [];
      this.indexMap = new Map();

      for (const i in this.images) {
        this.indexMap.set(this.images[i].src, i);

        if (this.images[i].objects) {
          this.options.push(...this.images[i].objects);
        }
      }

      this.options = [...new Set(this.options)];
      await this.drawImages();
    },
    async drawImages() {
      this.imageLayer.removeChildren();
      const width = 250;
      const height = (width * this.resolution.height) / this.resolution.width;
      const y = this.stage.getHeight() / 2 - height / 2;

      for (const i in this.filterRows) {
        const images = this.filterRows[i].images;
        this.filterRows[i].canvasImages = [];
        for (const j in images) {
          const konvaImage = new Konva.Image({
            x: 50 + (75 + width) * this.indexMap.get(images[j].src),
            y: y - i * 300,
            width: width,
            height: height,
            image: await this.loadImage(images[j].src),
          });
          this.filterRows[i].canvasImages.push(konvaImage);
          this.imageLayer.add(konvaImage);
        }
      }
      this.imageLayer.draw();
      this.linkImages();
    },
    linkImages() {
      this.linkLayer.removeChildren();
      for (const i in this.filterRows) {
        const images = this.filterRows[i].canvasImages;
        for (let j = 1; j < images.length; ++j) {
          const a = images[j - 1];
          const b = images[j];
          const points = [a.x() + a.width(), a.y() + a.height() / 2, b.x(), b.y() + b.height() / 2];
          const link = new Konva.Arrow({
            points: points,
            pointerLength: 15,
            pointerWidth: 15,
            stroke: '#007bff',
            fill: '#007bff',
          });
          this.linkLayer.add(link);
        }
      }
      this.linkLayer.draw();
    },
    loadImage(src) {
      return new Promise(resolve => {
        const image = new window.Image();
        image.src = src;
        image.onload = () => {
          resolve(image);
        };
      });
    },
    addFilter(filter) {
      this.filterRows.push({
        filter: filter,
        images: this.images.filter(img => filter.every(val => img.objects.includes(val))),
      });
    },
    addNewFilter() {
      this.addFilter(this.filter);
      this.drawImages();
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
