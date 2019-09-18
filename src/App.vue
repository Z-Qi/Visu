<template>
  <div id="app">
    <editor />
  </div>
</template>

<script>
import Editor from './views/Editor.vue';

export default {
  name: 'App',
  components: {
    Editor,
  },
};
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100%;
}

* {
  margin: 0;
  padding: 0;
}

html,
body {
  height: 100%;
}
</style>
