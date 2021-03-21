import Vue from 'vue'
import WebSocketClient from '@/plugins/wsClient'
import App from './Display.vue'
import vuetify from '@/plugins/vuetify'
import VueResource from 'vue-resource'
import '@/components'
import store from '@/store'
import vueHeadful from 'vue-headful';
import VueRouter from "vue-router";
import routes_display from "@/routes/display";

const router = new VueRouter({mode: 'history', routes: routes_display});

Vue.config.productionTip = false;

Vue.use(VueResource);
Vue.use(vuetify);
Vue.http.headers.common['Content-Type'] = 'application/json';
Vue.http.headers.common['Access-Control-Allow-Origin'] = '*';
Vue.http.headers.common['Accept'] = 'application/json, text/plain, */*';
Vue.http.headers.common['Access-Control-Allow-Headers'] = 'Origin, Accept, Content-Type, Authorization, Access-Control-Allow-Origin';
Vue.http.headers.common['Access-Control-Allow-Methods'] = 'POST, GET, PUT, OPTIONS, DELETE, OPTIONS';

Vue.component('vue-headful', vueHeadful);
Vue.directive('blur', {
    inserted: function (el) {
        el.onfocus = (ev) => ev.target.blur()
    }
});
Vue.directive('long-press', {
    bind: function (el, binding) {

        el._timeout = null;
        el._hasMoved = false

        let _ontouchend = function() {
            el._hasMoved = false
            clearTimeout(el._timeout)
        };

        let _ontouchmove = function () {
            if (!el._hasMoved) {
                el._hasMoved = true
            }
        }

        let _ontouchstart = ((e) => {
            const context = this;
            el._timeout = setTimeout(function () {
                if (!el._hasMoved) {
                    binding.value.call(context, e)
                    el._hasMoved = false
                }
            }, 1000)
        });

        el.addEventListener('touchstart', _ontouchstart, false)
        el.addEventListener('touchmove', _ontouchmove, false)
        document.addEventListener('touchend', _ontouchend, false)
    }
});

fetch('/config.json')
    .then(res => res.json())
    .then(file => {
        store.commit('socket/setData', file);

        const socketClient = new WebSocketClient(store.state.socket.protocol + '://' + store.state.socket.hostname + ':' + store.state.socket.port + '/websocket', {
            store: store,
            reconnectEnabled: true,
            reconnectInterval: store.state.socket.reconnectInterval,
        });

        if (!store.state.socket.remoteMode) socketClient.connect()
        Vue.prototype.$socket = socketClient;

        new Vue({
            vuetify,
            router,
            store,
            render: h => h(App)
        }).$mount('#app')
    })
    .catch((error) => {
        let p = document.createElement("p");
        let content = document.createTextNode("config.json not found or cannot be decoded!");
        p.appendChild(content);
        document.getElementById('app').append(p);
        window.console.error('Error:', error);
    });
