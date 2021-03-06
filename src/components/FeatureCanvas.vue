<template>
  <b-container class="h-100" fluid>
    <b-row align-v="stretch" no-gutters>
      <b-col cols="10" class="mr-4">
        <multiselect
          v-model="filter"
          :options="options"
          :multiple="true"
          :max="colors.length - filterRows.length"
          :close-on-select="false"
          :searchable="false"
          :show-labels="false"
          :placeholder="filterRows.length < colors.length ? 'Select filters' : 'Can\'t add more filters'"
          :disabled="filterRows.length == colors.length"
        />
      </b-col>
      <b-button
        :disabled="filter.length === 0"
        class="flex-grow-1"
        variant="primary"
        @click="addNewFilter()"
      >Add Filters</b-button>
    </b-row>
    <b-container fluid>
      <b-row class="mt-2">
        <b-col
          v-for="(f, i) in shownFilters"
          :key="f.filters"
          :style="`background: ${f.background}`"
          class="py-1 mr-2 text-black rounded border-bottom"
          cols="auto"
        >
          <span class="filter-badge" @click="() => navigateToRow(f)">
            Contains a
            <b>{{f.filter}}</b>
          </span>
          <button type="button" class="ml-2 close" aria-label="Close" @click="removeFilter(i + 1)">
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
    <b-row>
      <b-col>
        <div id="overview" ref="overview" class="my-2 border" />
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <vue-slider
          v-model="sliderPosition"
          :tooltip="'none'"
          :min="sliderValues.min"
          :max="sliderValues.max"
          :interval="1"
        />
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import Konva from 'konva';
import { BButton, BContainer, BRow } from 'bootstrap-vue';
import Multiselect from 'vue-multiselect';

import VueSlider from 'vue-slider-component';
import 'vue-slider-component/theme/default.css';

export default {
  components: {
    BButton,
    BContainer,
    BRow,
    Multiselect,
    VueSlider,
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
    snippets: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      stage: null,
      overviewStage: null,
      overviewLayer: null,
      imageLayer: null,
      linkLayer: null,
      overlayLayer: null,
      filter: [],
      filterRows: [],
      options: [],
      colors: [],
      indexMap: new Map(),
      sliderPosition: 0,
      sliderValues: {
        min: -50,
        max: 0,
      },
    };
  },
  computed: {
    shownFilters: function() {
      return this.filterRows.filter(r => r.filter.length > 0);
    },
  },
  watch: {
    async images(newImages, oldImages) {
      await this.updateImages();
    },
    async snippets(newSnippets, oldSnippets) {
      await this.drawImages();
    },
    sliderPosition() {
      this.stage.position({ x: -this.sliderPosition, y: this.stage.position().y });
      this.stage.batchDraw();
    },
  },
  mounted() {
    const stageStyle = window.getComputedStyle(this.$refs.stage);
    const stageWidth = this.$refs.stage.clientWidth;
    const stageHeight = window.innerHeight / 1.6;
    this.stage = new Konva.Stage({
      container: 'stage',
      width: stageWidth - parseFloat(stageStyle.paddingLeft) - parseFloat(stageStyle.paddingRight),
      height: stageHeight,
      draggable: true,
    });

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
      this.sliderValues.max = Math.floor((this.sliderValues.max / oldScale) * newScale);

      const newPos = {
        x: -(mousePointTo.x - mousePos.x / newScale) * newScale,
        y: -(mousePointTo.y - mousePos.y / newScale) * newScale,
      };
      this.stage.position(newPos);
      this.stage.batchDraw();
    });

    this.stage.on('xChange', e => {
      let position = -Math.floor(e.newVal);
      if (position < this.sliderValues.min) {
        position = this.sliderValues.min;
      } else if (position > this.sliderValues.max) {
        position = this.sliderValues.max;
      }
      this.sliderPosition = position;
    });

    this.imageLayer = new Konva.Layer();
    this.linkLayer = new Konva.Layer();
    this.overlayLayer = new Konva.Layer();
    this.stage.add(this.imageLayer);
    this.stage.add(this.linkLayer);
    this.stage.add(this.overlayLayer);

    const overviewStageHeight = 60;
    this.overviewStage = new Konva.Stage({
      container: 'overview',
      width: this.$refs.overview.clientWidth,
      height: overviewStageHeight,
    });

    this.overviewLayer = new Konva.Layer();
    this.overviewStage.add(this.overviewLayer);

    new ResizeObserver(() => {
      this.stage.size({
        width: this.$refs.stage.clientWidth - parseFloat(stageStyle.paddingLeft) - parseFloat(stageStyle.paddingRight),
        height: stageHeight,
      });
      this.overviewStage.size({
        width: this.$refs.overview.clientWidth,
        height: overviewStageHeight,
      });
      this.stage.batchDraw();
      this.drawOverview();
    }).observe(this.$refs.stage);

    this.updateImages();
  },
  methods: {
    async updateImages() {
      this.options = [];
      this.indexMap = new Map();

      for (let i = 0; i < this.images.length; ++i) {
        this.indexMap.set(this.images[i].src, i);

        if (this.images[i].objects) {
          this.options.push(...this.images[i].objects);
        }
      }

      this.options = [...new Set(this.options)].sort();

      this.stage.scale({ x: 0.3, y: 0.3 });
      this.stage.position({ x: 50, y: this.stage.height() / 2 });

      this.colors = ['#ffffff', '#ff6b88', '#f9dc5c', '#c2eabd', '#66adff', '#ffbb63'];

      this.filterRows = [];
      this.addFilter([]);

      await this.drawImages();
      this.linkImages();
      this.drawOverview();
    },
    async drawImages() {
      this.imageLayer.removeChildren();
      const width = 250;
      const height = (width * this.resolution.height) / this.resolution.width;
      const y = height;

      // todo: clean up these magic numbers
      this.sliderValues.max = Math.floor(
        ((width + 75) * this.images.length - this.stage.width()) * this.stage.scaleX()
      );

      this.stage.dragBoundFunc(pos => {
        let newX = -Math.floor(pos.x);
        if (newX < this.sliderValues.min) {
          newX = this.sliderValues.min;
        } else if (newX > this.sliderValues.max) {
          newX = this.sliderValues.max;
        }
        return {
          x: -newX,
          y: pos.y,
        };
      });

      for (let i = 0; i < this.filterRows.length; ++i) {
        const row = this.filterRows[i];
        const images = row.images;
        row.canvasImages = [];

        for (let j = 0; j < images.length; ++j) {
          const konvaImage = new Konva.Image({
            x: (75 + width) * this.indexMap.get(images[j].src),
            y: y - i * 300,
            width: width,
            height: height,
            image: await this.loadImage(images[j].src),
            shadowColor: '#000',
            shadowBlur: 14,
            shadowOffset: { x: 0, y: 13 },
            shadowOpacity: 0.4,
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

          row.canvasImages.push(konvaImage);
          this.imageLayer.add(konvaImage);
        }

        const backgroundPadding = 50;
        const backgroundWidth = row.canvasImages[row.canvasImages.length - 1].x() - row.canvasImages[0].x() + width;
        const rowBackground = new Konva.Rect({
          x: row.canvasImages[0].x() - backgroundPadding / 2,
          y: y - i * 300 - backgroundPadding / 2,
          width: backgroundWidth + backgroundPadding,
          height: height + backgroundPadding,
          fill: row.background,
          cornerRadius: 15,
        });
        this.imageLayer.add(rowBackground);
        rowBackground.moveToBottom();
      }
      this.highlightImages();
      this.imageLayer.draw();
    },
    drawOverview() {
      this.overviewLayer.removeChildren();
      for (let i = 1; i < this.filterRows.length; ++i) {
        const images = this.filterRows[i].images;
        for (let j = 0; j < images.length; ++j) {
          const images = this.filterRows[i].images;
          const rectX = this.overviewStage.width() * (this.indexMap.get(images[j].src) / this.images.length);
          const rectY = (this.colors.length - i - 1) * (this.overviewStage.height() / this.colors.length);
          const rectWidth = this.overviewStage.width() / this.images.length;
          const rectHeight = this.overviewStage.height() / this.colors.length;
          const rect = new Konva.Rect({
            x: rectX,
            y: rectY,
            width: rectWidth,
            height: rectHeight,
            fill: this.colors[i],
          });
          this.overviewLayer.add(rect);
        }
      }
      this.overviewLayer.draw();
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
            stroke: '#000000',
            fill: '#000000',
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
      // todo: check for duplicate filters (order doesn't matter)
      if (filter.length === 0) {
        this.filterRows.push({
          filter: filter,
          images: this.images,
          background: this.colors[this.filterRows.length],
        });
      } else {
        for (const f of filter) {
          const filteredImages = this.images.filter(img => img.objects.includes(f));
          this.filterRows.push({
            filter: f,
            images: filteredImages,
            background: this.colors[this.filterRows.length],
          });
        }
      }
    },
    addNewFilter() {
      this.addFilter(this.filter);
      this.filter = [];
      this.drawImages();
      this.drawOverview();
    },
    navigateToRow(row) {
      this.stage.position({
        x: -row.canvasImages[0].x() * this.stage.scaleX(),
        y: -row.canvasImages[0].y() * this.stage.scaleY() + this.stage.height() / 2,
      });
      this.stage.batchDraw();
    },
    async removeFilter(index) {
      this.filterRows.splice(index, 1);
      for (let i = 0; i < this.filterRows.length; ++i) {
        this.filterRows[i].background = this.colors[i];
      }
      await this.drawImages();
      this.drawOverview();
    },
    highlightImages() {
      for (const row of this.filterRows) {
        for (const i in row.images) {
          if (this.snippets.some(s => s.start <= row.images[i].frameNumber && s.end >= row.images[i].frameNumber)) {
            row.canvasImages[i].shadowOpacity(0.0);
            row.canvasImages[i].cache();
            row.canvasImages[i].filters([Konva.Filters.RGBA]);
            row.canvasImages[i].red(135);
            row.canvasImages[i].green(181);
            row.canvasImages[i].blue(255);
            row.canvasImages[i].alpha(0.5);
          }
        }
      }
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
