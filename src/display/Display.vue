<style>
@import '../assets/styles/fonts.css';
@import '../assets/styles/toastr.css';

html {
    overflow-y: auto !important;
}
.theme--dark.v-application {
    background: black !important;
}
.button-min-width-auto {
    min-width: auto !important;
}

::-webkit-scrollbar {
    display: none;
}

#emergencyStop{
    z-index: 7;
}

#content {
    margin-right: 85px;
}

</style>

<template>
    <v-app>
        <v-navigation-drawer v-model="drawer" class="grey darken-4" permanent mini-variant app>
            <v-list style="height: 100%" class="d-flex flex-column">
                <v-list-item v-for="(route, index) in activeRoutes"
                             link class="d-flex flex-row"
                             :to="route.path"
                             :key="index">
                    <div>
                        <v-icon>mdi-{{ route.path == currentPage && route.iconActive ? route.iconActive : route.icon }}</v-icon>
                    </div>
                    <div>
                        <v-list-item-title> {{ route.title }}</v-list-item-title>
                    </div>
                </v-list-item>
<!--                <v-list-item></v-list-item>-->
            </v-list>
        </v-navigation-drawer>

        <v-main id="content">
            <keep-alive>
                <router-view></router-view>
            </keep-alive>
        </v-main>

        <v-btn color="red" elevation="2" id="emergencyStop" v-if="isConnected"
               @click="clickEmergencyStop" :loading="loadings.includes('emergencyStop')"
               fab fixed top right v-blur
        >
            <v-icon large>mdi-alert-octagon-outline</v-icon>
        </v-btn>

        <power-menu></power-menu>

    </v-app>
</template>

<script>
import routes from '@/routes/display'
import {mapState, mapGetters} from 'vuex'
import '@/display/panels';
import powerMenu from '@/display/pieces/PowerMenu';

// import axios from "axios";

export default {
    props: {
        source: String,
    },
    components: {
        powerMenu,
    },
    data: () => ({
        drawer: null,
        activeClass: 'active',
        routes,
        boolNaviHeightmap: false,
    }),
    created() {
        this.$vuetify.theme.dark = true;
        this.boolNaviHeightmap = (typeof (this.config.bed_mesh) !== "undefined");
    },
    computed: {
        currentPage: function () {
            return this.$route.fullPath;
        },
        activeRoutes: function () {
            return this.routes.filter(r => !r.hidden);
        },
        ...mapState({
            isConnected: state => state.socket.isConnected,
            hostname: state => state.printer.hostname,
            apiHost: state => state.socket.hostname,
            apiPort: state => state.socket.port,
            klippy_state: state => state.server.klippy_state,
            printer_state: state => state.printer.print_stats.state,
            loadings: state => state.socket.loadings,

            toolhead: state => state.printer.toolhead,
            printername: state => state.gui.general.printername,
            virtual_sdcard: state => state.printer.virtual_sdcard,
            current_file: state => state.printer.print_stats.filename,
            boolNaviWebcam: state => state.gui.webcam.bool,
            config: state => state.printer.configfile.config,
            save_config_pending: state => state.printer.configfile.save_config_pending,

            klipperVersion: state => state.printer.software_version,
            remoteMode: state => state.socket.remoteMode,
        }),
        ...mapGetters([
            'getTitle',
            'getVersion',
        ]),
        print_percent: {
            get() {
                return this.$store.getters["printer/getPrintPercent"]
            }
        },
        customStylesheet: {
            get() {
                return this.$store.getters["files/getCustomStylesheet"]
            }
        },
        isUpdateAvailable: {
            get() {
                return this.$store.getters["server/updateManager/isUpdateAvailable"]
            }
        }
    },
    methods: {
        clickEmergencyStop: function () {
            this.$store.commit('socket/addLoading', {name: 'emergencyStop'});
            setTimeout(() => {
                this.$store.commit('socket/removeLoading', {name: 'emergencyStop'});
            }, 3000);
            this.$socket.sendObj('printer.emergency_stop', {}, 'socket/removeLoading',{ name: 'topbarEmergencyStop' });
        },
        navStatus(status) {
            let routes = this.$router.options.routes;
            let navStatus = null;
            let navDash = null;

            for (let i in routes) {
                if (routes[i].name == 'status') {
                    navStatus = routes[i];
                } else if (routes[i].name == 'dashboard') {
                    navDash = routes[i];
                }
            }
            navStatus.hidden = !status;
            navDash.hidden = status;
        }
    },
    watch: {
        current_file: {
            handler: function (newVal) {
                this.$socket.sendObj("server.files.metadata", {filename: newVal}, "files/getMetadataCurrentFile");
            }
        },
        printer_state: {
            handler: function (newVal) {
                this.navStatus(['printing', 'paused', 'complete'].includes(newVal));
                if (this.currentPage == '/display/dashboard' && ['printing', 'paused', 'complete'].includes(newVal)) {
                    this.$router.push('/display/status');
                } else if (this.currentPage == '/display/status' && !['printing', 'paused', 'complete'].includes(newVal)) {
                    this.$router.push('/display/dashboard');
                }
            }
        },
        config() {
            this.boolNaviHeightmap = (typeof (this.config.bed_mesh) !== "undefined");
        },
        customStylesheet(newVal) {
            if (newVal !== null) {
                let style = document.getElementById("customStylesheet")
                if (!style) {
                    style = document.createElement('link')
                    style.id = "customStylesheet"
                    style.type = "text/css"
                    style.rel = "stylesheet"
                }

                style.href = newVal
                document.head.appendChild(style)
            } else {
                let style = document.getElementById("customStylesheet")
                if (style) style.remove()
            }
        },
        defaultFavicons() {
            this.drawFavicon(this.print_percent);
        },
    },
}
</script>

<style>
body {
    background: #121212;
}

/*.sidebar-wrapper:before {
    position: absolute;
    content: ' ';
    top: 0; right: 0; bottom: 0; left: 0;
    background: #000;
    opacity: .5;
}*/

#nav-header {
    text-align: center;
    border-bottom: 1px solid #ffffff40;
    margin-bottom: 1em;
    padding: .75em 0 .75em 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

#nav-header img {
    height: 40px;
    margin-right: 1em;
}

#nav-header .v-toolbar__title {
    font-size: 24px;
    vertical-align: middle;
}

.v-navigation-drawer__content {
    z-index: 10;
}

nav ul.navi {
    list-style: none;
    padding: 0;
    margin: 0;
}

nav ul.navi li.nav-item {
    padding: 0;
    margin: 0;
}

nav ul.navi .nav-link {
    display: block;
    color: white;
    border-radius: .5em;
    line-height: 30px;
    font-size: 14px;
    font-weight: 600;
    padding: 10px 15px;
    opacity: .85;
    transition: all .15s ease-in;
    text-decoration: none;
    margin: 0.5em 1em;
}

nav ul.navi .nav-link:hover,
nav ul.navi li.active > .nav-link,
nav ul.navi .nav-link.router-link-active {
    background: rgba(255, 255, 255, .3);
    opacity: 1;
}

nav ul.navi li.active > .nav-link i.nav-arrow,
nav ul.navi .nav-link.router-link-active i.nav-arrow {
    transform: rotate(0);
}

nav ul.navi .nav-link > i.v-icon {
    color: white;
    font-size: 1.7em;
    margin-right: .5em;
}

nav ul.navi .nav-link > span.nav-title {
    line-height: 30px;
    font-weight: 600;
    text-transform: uppercase;
    white-space: nowrap;
    letter-spacing: 1px;
}

nav ul.navi .nav-link > .nav-arrow {
    float: right;
    margin-top: 5px;
    margin-right: 0;
    transform: rotate(90deg);
}

nav ul.navi .nav-link > .nav-arrow.right {
    transform: rotate(-90deg);
}

nav ul.navi > li > ul.child {
    display: none;
    list-style: none;
    padding: 0;
    margin: 0;
}

nav ul.navi > li > a.router-link-active + ul.child,
nav ul.navi > li.active > ul.child {
    display: block;
}

nav ul.navi > li > ul.child .nav-link {
    padding: 5px 15px 5px 15px;
}

nav ul.navi > li > ul.child .nav-link:hover,
nav ul.navi > li > ul.child .nav-link.router-link-active {
    background: rgba(255, 255, 255, .2);
}

nav ul.navi > li > ul.child .nav-link > span.nav-title {
    text-transform: capitalize;
    font-weight: 400;
    font-size: 14px;
}

</style>
