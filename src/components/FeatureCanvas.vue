<template>
  <b-container fluid>
    <b-row align-v="stretch" no-gutters>
      <b-col cols="10" class="mr-4">
        <multiselect
          v-model="filter"
          :options="options"
          :multiple="true"
          :close-on-select="false"
          :searchable="false"
          :show-labels="false"
          placeholder="Select filters"
        ></multiselect>
      </b-col>
      <b-button
        class="flex-grow-1"
        variant="outline-primary"
        @click="addNewFilter()"
        :disabled="filter.length === 0"
      >Add Filters</b-button>
    </b-row>
    <b-container fluid>
      <b-row class="mt-2" v-for="(f, i) in shownFilters" :key="f.filters">
        <b-col class="py-1 text-black bg-light rounded border-bottom" cols="auto">
          <span class="filter-badge" @click="() => navigateToRow(f)">
            Contains a
            <span v-for="(val, j) in f.filter" :key="val">
              <span>
                <b>{{val}}</b>
              </span>
              <span v-if="j < f.filter.length - 1">,&nbsp;</span>
              <span v-if="j == f.filter.length - 2">and&nbsp;</span>
            </span>
          </span>
          <button
            type="button"
            class="ml-2 close"
            aria-label="Close"
            @click="removeFilter(shownFilters.length - i)"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </b-col>
      </b-row>
    </b-container>
    <b-row>
      <b-col>
        <div id="stage" ref="stage" class="rounded border" />
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import Konva from 'konva';
import { BButton, BContainer, BRow } from 'bootstrap-vue';
import Multiselect from 'vue-multiselect';

export default {
  components: {
    BButton,
    BContainer,
    BRow,
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
      linkLayer: null,
      overlayLayer: null,
      filter: [],
      filterRows: [],
      options: [],
      indexMap: new Map(),
    };
  },
  computed: {
    shownFilters: function() {
      return this.filterRows
        .filter(r => r.filter.length > 0)
        .slice()
        .reverse();
    },
  },
  watch: {
    images(newImages, oldImages) {
      this.updateImages();
    },
  },
  mounted() {
    const stageStyle = window.getComputedStyle(this.$refs.stage);
    const stageHeight = window.innerHeight / 2;
    this.stage = new Konva.Stage({
      container: 'stage',
      width: this.$refs.stage.clientWidth - parseFloat(stageStyle.paddingLeft) - parseFloat(stageStyle.paddingRight),
      height: stageHeight,
      draggable: true,
    });

    this.linkLayer = new Konva.Layer();
    this.imageLayer = new Konva.Layer();
    this.overlayLayer = new Konva.Layer();
    this.stage.add(this.linkLayer);
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

    window.addEventListener('resize', () => {
      this.stage.size({
        width: this.$refs.stage.clientWidth - parseFloat(stageStyle.paddingLeft) - parseFloat(stageStyle.paddingRight),
        height: stageHeight,
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
      this.stage.scale({ x: 0.3, y: 0.3 });
      this.stage.position({ x: 0, y: this.stage.height() / 2 });
      await this.drawImages();
    },
    async drawImages() {
      this.imageLayer.removeChildren();
      const width = 250;
      const height = (width * this.resolution.height) / this.resolution.width;
      const y = height;

      for (const i in this.filterRows) {
        const images = this.filterRows[i].images;
        this.filterRows[i].canvasImages = [];
        for (const j in images) {
          const konvaImage = new Konva.Image({
            x: (75 + width) * this.indexMap.get(images[j].src),
            y: y - i * 300,
            width: width,
            height: height,
            image: await this.loadImage(images[j].src),
          });

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
            this.$emit('frame-clicked', images[j]);
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
      this.filter = [];
    },
    addNewFilter() {
      this.addFilter(this.filter);
      this.drawImages();
    },
    navigateToRow(row) {
      this.stage.position({
        x: row.canvasImages[0].x() * this.stage.scaleX(),
        y: -row.canvasImages[0].y() * this.stage.scaleY() + this.stage.height() / 2,
      });
      this.stage.batchDraw();
    },
    async removeFilter(index) {
      this.filterRows.splice(index, 1);
      await this.drawImages();
    },
  },
};
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>

<style scoped>
#stage {
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  cursor: pointer;
}

.multiselect {
  min-height: 43px !important;
}

.filter-badge {
  cursor: pointer;
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
