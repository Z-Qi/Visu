import Vue from 'vue';
import App from './App.vue';
import Bootstrap from 'bootstrap-vue';
import Konva from 'vue-konva';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

Vue.config.productionTip = false;

Vue.use(Bootstrap);
Vue.use(Konva);

new Vue({
  render: h => h(App)
}).$mount('#app');
