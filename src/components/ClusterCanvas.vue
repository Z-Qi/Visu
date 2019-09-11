<template>
  <b-container fluid>
    <b-row align-v="stretch" no-gutters>
      <b-col>
        <multiselect
          v-model="filter"
          :options="options"
          :multiple="false"
          :close-on-select="true"
          :searchable="false"
          :show-labels="false"
          :placeholder="'Select a filter'"
        ></multiselect>
      </b-col>
    </b-row>
    <b-row>
      <b-col class="mt-2">
        <div id="cluster-stage" ref="clusterStage" class="rounded border" />
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import Konva from 'konva';
import { BContainer, BRow, BCol } from 'bootstrap-vue';
import Multiselect from 'vue-multiselect';

export default {
  components: {
    BContainer,
    BRow,
    BCol,
    Multiselect,
  },
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
      overlayLayer: null,
      filter: null,
      options: [],
    };
  },
  watch: {
    images(newImages, oldImages) {
      this.updateImages();
    },
    async filter() {
      await this.drawImages();
    },
  },
  mounted() {
    const stageStyle = window.getComputedStyle(this.$refs.clusterStage);
    const stageWidth = this.$refs.clusterStage.clientWidth;
    const stageHeight = window.innerHeight / 2;
    this.stage = new Konva.Stage({
      container: 'cluster-stage',
      width: stageWidth - parseFloat(stageStyle.paddingLeft) - parseFloat(stageStyle.paddingRight),
      height: stageHeight,
      draggable: true,
    });

    this.imageLayer = new Konva.Layer();
    this.overlayLayer = new Konva.Layer();
    this.stage.add(this.imageLayer);
    this.stage.add(this.overlayLayer);

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

    new ResizeObserver(() => {
      this.stage.size({
        width:
          this.$refs.clusterStage.clientWidth -
          parseFloat(stageStyle.paddingLeft) -
          parseFloat(stageStyle.paddingRight),
        height: stageHeight,
      });
      this.stage.position({ x: this.stage.width() / 2, y: this.stage.height() / 2 });
      this.stage.batchDraw();
    }).observe(this.$refs.clusterStage);

    this.updateImages();
  },
  methods: {
    async updateImages() {
      this.options = [];
      for (const img of this.images) {
        if (img.objects) {
          this.options.push(...img.objects);
        }
      }
      this.options = [...new Set(this.options)].sort();
      this.stage.scale({ x: 0.1, y: 0.1 });
      this.stage.position({ x: this.stage.width() / 2, y: this.stage.height() / 2 });
      await this.drawImages();
    },
    async drawImages() {
      this.imageLayer.removeChildren();
      const width = 250;
      const height = (width * this.resolution.height) / this.resolution.width;
      const y = height;

      let xFactor = 0;
      let yFactor = 0;

      for (const img of this.images) {
        xFactor = Math.max(xFactor, Math.abs(img.x));
        yFactor = Math.max(yFactor, Math.abs(img.y));
      }

      const maxSize = 4000;
      const xScale = maxSize / xFactor;
      const yScale = maxSize / yFactor;

      for (const i in this.images) {
        const konvaImage = new Konva.Image({
          x: this.images[i].x * xScale,
          y: this.images[i].y * yScale,
          width: width,
          height: height,
          image: await this.loadImage(this.images[i].src),
          shadowColor: '#000',
          shadowBlur: 14,
          shadowOffset: { x: 0, y: 13 },
          shadowOpacity: 0.4,
        });
        this.imageLayer.add(konvaImage);

        if (this.filter && !this.images[i].objects.includes(this.filter)) {
          konvaImage.opacity(0.2);
          konvaImage.shadowOpacity(0);
          konvaImage.moveToBottom();
          konvaImage.scale({x: 0.5, y: 0.5});
        } else {
          konvaImage.on('mouseenter', () => {
            this.overlayLayer.removeChildren();
            const mousePos = this.stage.getPointerPosition();
            const scale = 1 / this.stage.scaleX() <= 1.5 ? 1.5 : 1 / this.stage.scaleX();
            const size = {
              width: konvaImage.width() * scale,
              height: konvaImage.height() * scale,
            };
            let x = konvaImage.x() - size.width / 2 + konvaImage.width() / 2;

            const leftStageEdge = -this.stage.position().x / this.stage.scaleX();
            const rightStageEdge = (this.stage.width() - this.stage.position().x) / this.stage.scaleX();

            if (x <= leftStageEdge) {
              x = leftStageEdge;
            } else if (x + size.width >= rightStageEdge) {
              x = rightStageEdge - size.width;
            }

            const overlayImage = new Konva.Image({
              x: x,
              y: konvaImage.y() - size.height - 20,
              width: size.width,
              height: size.height,
              image: konvaImage.image(),
              shadowColor: '#000',
              shadowBlur: 38,
              shadowOffset: { x: 0, y: 19 },
              shadowOpacity: 0.4,
            });
            this.overlayLayer.add(overlayImage);
            this.overlayLayer.draw();
          });
          konvaImage.on('mouseout', () => {
            this.overlayLayer.removeChildren();
            this.overlayLayer.draw();
          });
          konvaImage.on('click', () => {
            this.$emit('frame-clicked', this.images[i]);
          });
        }
      }
      this.imageLayer.draw();
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
  },
};
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>

<style scoped>
.multiselect {
  min-height: 43px !important;
}
</style>

<style>
.multiselect__option--highlight,
.multiselect__tag {
  background: var(--primary) !important;
}

.multiselect__tag-icon:hover {
  background: #0056b3;
}

.multiselect__tag-icon::after {
  color: white;
}
</style>
