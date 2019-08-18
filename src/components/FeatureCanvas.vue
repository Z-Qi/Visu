<template>
  <div>
    <v-stage v-if="canvasImages.length > 0" :config="configKonva">
      <v-layer>
        <div v-for="(image, index) in canvasImages" :key="image.src">
          <v-image
            :config="{
              image: image,
              x: 50 + 450 * index,
              y: 50,
              scaleX: 0.2,
              scaleY: 0.2,
              draggable: true
            }"
          ></v-image>
        </div>
      </v-layer>
    </v-stage>
  </div>
</template>

<script>
export default {
  props: {
    images: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      configKonva: {
        width: this.images == undefined ? 0 : this.images.length * 500,
        height: 400
      },
      configCircle: {
        x: 100,
        y: 100,
        radius: 70,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 4
      },
      canvasImages: []
    };
  },
  // watch: {
  //   images(newImages, oldImages) {
  //     for (const i in this.images) {
  //       let image = new window.Image();
  //       image.onload = e => {
  //         console.log(i);
  //         console.log(e);
  //         this.canvasImages[i] = image;
  //         console.log(this.canvasImages[i]);
  //         console.log(this.canvasImages);
  //       };
  //       image.src = this.images[i].src;
  //     }
  //   }
  // }
  created() {
    for (const i in this.images) {
      let image = new window.Image();
      image.onload = e => {
        console.log(i);
        console.log(e);
        this.canvasImages.splice(i, 0, image);
        console.log(this.canvasImages[i]);
        console.log(this.canvasImages);
      };
      image.src = this.images[i].src;
    }
  }
};
</script>
