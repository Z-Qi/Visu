<template>
  <div id="stage" />
</template>

<script>
import Konva from 'konva';

let width = window.innerWidth / 2;
let height = window.innerHeight / 2;

export default {
  props: {
    images: {
      type: Array,
      required: true
    },
    resolution: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      stage: null,
      layer: null,
      canvasImages: []
    };
  },
  watch: {
    images(newImages, oldImages) {
      this.updateImages();
    }
  },
  mounted() {
    this.stage = new Konva.Stage({
      container: 'stage',
      width: width,
      height: height,
      draggable: true
    });

    this.layer = new Konva.Layer();
    this.stage.add(this.layer);

    this.updateImages();
  },
  methods: {
    updateImages() {
      this.layer.removeChildren();
      this.canvasImages = [];

      const width = 250;

      for (const i in this.images) {
        let konvaImage = new Konva.Image({
          x: 50 + (75 + width) * i,
          y: 200,
          width: width,
          height: (width * this.resolution.height) / this.resolution.width,
          draggable: true
        });
        this.layer.add(konvaImage);

        let image = new window.Image();
        image.onload = () => {
          this.canvasImages[i] = konvaImage;

          konvaImage.image(image);
          this.linkImages();

          this.layer.draw();
        };

        image.src = this.images[i].src;
      }
    },
    linkImages() {
      if (this.canvasImages.length != this.images.length) return;

      let images = this.canvasImages;
      for (let i = 1; i < images.length; i++) {
        let a = images[i - 1];
        let b = images[i];
        let points = [a.x() + a.width(), a.y() + a.height() / 2, b.x(), b.y() + b.height() / 2];
        console.log(a);
        console.log(b);
        console.log(points);
        let link = new Konva.Arrow({
          points: points,
          stroke: 'black'
        });
        this.layer.add(link);
      }
    }
  }
};
</script>
