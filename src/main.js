import Vue from 'vue';
import App from './App.vue';
import Bootstrap from 'bootstrap-vue';
import Konva from 'vue-konva';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

Vue.config.productionTip = false;

Vue.component('font-awesome-icon', FontAwesomeIcon);

Vue.use(Bootstrap);
Vue.use(Konva);

new Vue({
  render: h => h(App),
}).$mount('#app');
