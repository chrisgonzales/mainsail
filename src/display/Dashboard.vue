<style>
.btnHomeAxis {
    width: 40px;
    min-width: 40px !important;
}

.btnMinWidthAuto {
    min-width: 50px !important;
}

.recent-thumbnail img {
    display: block;
    width: auto;
    height: auto;
    max-width: 60px;
    max-width: 60px;
    -webkit-filter: grayscale(100%) sepia(25%) brightness(0.7) contrast(140%) hue-rotate(164deg) saturate(105%);
}
</style>

<template>
    <v-container fill-height class="pa-0 d-flex align-stretch">
        <v-row no-gutters>
            <v-col class="col-7 d-flex flex-column">
                <temperature-panel v-if="socket_connected && klippy_connected"></temperature-panel>

                <v-row class="grey grey--text text--lighten-1 darken-4 rounded mx-3 my-0">
                    <v-col class="flex-grow-0 d-flex align-center justify-center">
                        <v-icon>mdi-axis-arrow</v-icon>
                    </v-col>
                    <v-divider vertical></v-divider>
                    <v-col class="d-flex flex-column align-center justify-center">
                        <div class="caption"><strong>X</strong></div>
                        <div class="subtitle-2">{{ position.length ? position[0].toFixed(2) : "--" }}</div>
                    </v-col>
                    <v-divider vertical></v-divider>
                    <v-col class="d-flex flex-column align-center justify-center">
                        <div class="caption"><strong>Y</strong></div>
                        <div class="subtitle-2">{{ position.length ? position[1].toFixed(2) : "--" }}</div>
                    </v-col>
                    <v-divider vertical></v-divider>
                    <v-col class="d-flex flex-column align-center justify-center">
                        <div class="caption"><strong>Z</strong></div>
                        <div class="subtitle-2">{{ position.length ? position[2].toFixed(2) : "--" }}</div>
                    </v-col>
                </v-row>
                <v-row class="mx-2 my-2 mb-3">
                    <quick-control-button label="Move"
                                          icon="arrow-all"
                                          color="white"
                                          v-if="['standby', 'paused', 'complete', 'error'].includes(printer_state)"
                                          :action="activateSheet" argument="sheetMove"
                    ></quick-control-button>

                    <quick-control-button label="Home"
                                          icon="home"
                                          color="green"
                                          :action="doHome"
                                          :loading="loadings.includes('homeAll')"
                    ></quick-control-button>

                    <quick-control-button label="QGL"
                                          icon="spirit-level"
                                          color="lime"
                                          :action="doQGL"
                                          :loading="loadings.includes('qgl')"
                    ></quick-control-button>

                    <quick-control-button label="Extrude"
                                          icon="printer-3d-nozzle"
                                          color="pink"
                                          :action="activateSheet" argument="sheetExtrude"
                    ></quick-control-button>

                    <quick-control-button v-for="preset of this['gui/getPreheatPresets']"
                                          :label="preset.name"
                                          icon="fire"
                                          color="orange"
                                          v-bind:key="preset.index"
                                          :action="preheat" :argument="preset"
                    ></quick-control-button>

                    <quick-control-button label="Cooldown"
                                          icon="snowflake"
                                          color="blue"
                                          :action="cooldown"></quick-control-button>
                </v-row>
            </v-col>
            <v-col class="col-5">
                <v-row class="fill-height flex-wrap">
                    <v-col class="col-5 pa-0 pl-1 pt-4">
                        <v-btn small v-for="(macro, index) in this['printer/getMacros']" v-bind:key="index+99"
                               color="blue-grey darken-1"
                               class="ma-2" :loading="loadings.includes('macro_'+macro.name)"
                               @click="doSendMacro(macro.name)">{{ macro.name.replace(/_/g, " ") }}
                        </v-btn>
                    </v-col>
                    <v-col class="col-7 pa-0 pt-3 pr-3">
                        <fan-panel v-if="klippy_state === 'ready'"
                                   class="flex-wrap  justify-space-between pt-2 pr-3"></fan-panel>
                    </v-col>
                    <v-col class="col-12 pb-0 pr-6 align-self-end">
                        <v-card>
                            <v-card-text class="d-flex">
                                <v-btn fab color="green" class="mr-3" @click="startRecent">
                                    <v-icon>mdi-play</v-icon>
                                </v-btn>
                                <v-divider vertical></v-divider>
                                <div class="ml-3 flex-grow-1">
                                    <div class="d-flex justify-space-between">
                                        <span class="caption">last uploaded file </span>
<!--                                        <span class="caption grey&#45;&#45;text text&#45;&#45;lighten-3">{{ recentFileTime }}</span>-->
                                    </div>
                                    <span class="subtitle-1 white--text text-truncate">{{ recentFilename }}</span>
                                </div>

                                <div class="recent-thumbnail"
                                     v-if="
                                            recentFile &&
                                            recentFile.thumbnails &&
                                            recentFile.thumbnails.length &&
                                            recentFile.thumbnails.find(element => element.width > 100)
                                        ">
                                    <img
                                        :src="'data:image/gif;base64,'+(recentFile.thumbnails ? recentFile.thumbnails.find(element => element.width > 100).data : '')"/>
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-col>
        </v-row>

        <v-bottom-sheet v-model="sheetMove"
                        transition="none">
            <v-sheet>
                <v-container>
                    <v-row>

                        <v-col class="d-flex flex-column align-center justify-center my-5">
                            <div class="caption"><strong>X</strong></div>
                            <div class="subtitle-2">{{ position.length ? position[0].toFixed(2) : "--" }}</div>
                            <v-btn-toggle class="row no-gutters my-3 mx-0"
                                          style="flex-wrap: nowrap;">
                                <v-btn @click="doSendMove('X-'+steps, feedrateXY)" class="btnMinWidthAuto col"
                                       v-for="steps of stepsXYsorted" v-bind:key="'x-'+steps"><span
                                    class="body-2">-{{ steps }}</span></v-btn>
                                <v-btn @click="doHomeX" :color="homedAxes.includes('x') ? 'primary' : 'warning'"
                                       :loading="loadings.includes('homeX')"
                                       class="font-weight-bold btnHomeAxis">X
                                </v-btn>
                                <v-btn @click="doSendMove('X+'+steps, feedrateXY)" class="btnMinWidthAuto col"
                                       v-for="steps of stepsXYsortedReverse" v-bind:key="'x+'+steps"><span
                                    class="body-2">+{{ steps }}</span></v-btn>
                            </v-btn-toggle>
                        </v-col>

                        <v-divider vertical></v-divider>

                        <v-col class="d-flex flex-column align-center justify-center my-5">
                            <div class="caption"><strong>Y</strong></div>
                            <div class="subtitle-2">{{ position.length ? position[1].toFixed(2) : "--" }}</div>
                            <div>
                                <v-btn-toggle class="row no-gutters my-3 mx-0"
                                              style="flex-wrap: nowrap;">
                                    <v-btn @click="doSendMove('Y-'+steps, feedrateXY)" class="btnMinWidthAuto col"
                                           v-for="steps of stepsXYsorted" v-bind:key="'y-'+steps"><span
                                        class="body-2">-{{ steps }}</span></v-btn>
                                    <v-btn @click="doHomeY" :color="homedAxes.includes('y') ? 'primary' : 'warning'"
                                           :loading="loadings.includes('homeY')"
                                           class="font-weight-bold btnHomeAxis">Y
                                    </v-btn>
                                    <v-btn @click="doSendMove('Y+'+steps, feedrateXY)" class="btnMinWidthAuto col"
                                           v-for="steps of stepsXYsortedReverse" v-bind:key="'y+'+steps"><span
                                        class="body-2">+{{ steps }}</span></v-btn>
                                </v-btn-toggle>
                            </div>
                        </v-col>

                        <v-divider vertical></v-divider>

                        <v-col class="d-flex flex-column align-center justify-center my-5">
                            <div class="caption"><strong>Z</strong></div>
                            <div class="subtitle-2">{{ position.length ? position[2].toFixed(2) : "--" }}</div>
                            <v-btn-toggle class="row no-gutters my-3 mx-0"
                                          style="flex-wrap: nowrap;">
                                <v-btn @click="doSendMove('Z-'+steps, feedrateZ)" class="btnMinWidthAuto col"
                                       v-for="steps of stepsZsorted" v-bind:key="'z-'+steps"><span
                                    class="body-2">-{{ steps }}</span></v-btn>
                                <v-btn @click="doHomeZ" :color="homedAxes.includes('z') ? 'primary' : 'warning'"
                                       :loading="loadings.includes('homeZ')"
                                       class="font-weight-bold btnHomeAxis">Z
                                </v-btn>
                                <v-btn @click="doSendMove('Z+'+steps, feedrateZ)" class="btnMinWidthAuto col"
                                       v-for="steps of stepsZsortedReverse" v-bind:key="'z+'+steps"><span
                                    class="body-2">+{{ steps }}</span></v-btn>
                            </v-btn-toggle>
                        </v-col>
                    </v-row>

                </v-container>
            </v-sheet>
        </v-bottom-sheet>

        <v-bottom-sheet v-model="sheetExtrude" inset
                        transition="none">
            <v-sheet class="text-center">
                <v-container>
                    <v-row>
                        <v-col class="pt-4 text-center align-center">
                            <span class="caption grey--text">Extruder Temp:</span> <span
                            class="subtitle-1">{{ extruderTemp }}</span>
                        </v-col>
                    </v-row>
                    <v-row class="pt-4 px-10 pb-10">
                        <v-col class="col-3 mr-6 d-flex flex-column">
                            <v-btn @click="heatUpPLA()" small class="orange">
                                <v-icon left>mdi-fire</v-icon>
                                PLA - 210°C
                            </v-btn>
                            <v-btn @click="heatUpABS()" small class="my-3 orange darken-4">
                                <v-icon left>mdi-fire</v-icon>
                                ABS - 230°C
                            </v-btn>
                            <v-btn @click="cooldown()" small class="blue">
                                <v-icon left>mdi-snowflake</v-icon>
                                cooldown
                            </v-btn>
                        </v-col>
                        <v-divider vertical></v-divider>
                        <v-col class="d-flex flex-column text-right justify-space-around">
                            <div>
                                <v-label>Feed amount in mm:</v-label>
                                <v-btn-toggle class="ml-3" dense no-gutters>
                                    <v-btn v-for="amount in feedamountsSorted" v-bind:key="amount"
                                           @click="setFeedAmount(amount)" dense
                                           :class="(amount === feedAmount ? 'v-btn--active' : '') + ' btnMinWidthAuto flex-grow-1 px-0 _btnFeedrate'">{{ amount }}
                                    </v-btn>
                                </v-btn-toggle>
                            </div>
                            <div>
                                <v-label>Feedrate in mm/s:</v-label>
                                <v-btn-toggle class="ml-3" dense no-gutters style="flex-wrap: nowrap;">
                                    <v-btn v-for="rate in feedratesSorted" v-bind:key="rate" @click="setFeedrate(rate)"
                                           dense
                                           :class="(feedrate === rate ? 'v-btn--active' : '') + ' btnMinWidthAuto flex-grow-1 px-0 _btnFeedrate'">{{ rate }}
                                    </v-btn>
                                </v-btn-toggle>
                            </div>

                        </v-col>
                        <v-col class="d-flex flex-column col-2 text-left justify-space-around">
                            <v-btn @click="sendRetract()" :loading="loadings.includes('btnRetract')"
                                   color="red darken-4"
                                   :disabled="!this['printer/getExtrudePossible']">
                                <v-icon left>mdi-arrow-up-bold</v-icon>
                                Retract
                            </v-btn>
                            <v-btn @click="sendDetract()" :loading="loadings.includes('btnDetract')"
                                   color="green darken-1"
                                   :disabled="!this['printer/getExtrudePossible']">
                                <v-icon left>mdi-arrow-down-bold</v-icon>
                                Extrude
                            </v-btn>
                        </v-col>
                    </v-row>
                </v-container>

            </v-sheet>
        </v-bottom-sheet>

        <v-bottom-sheet v-model="sheetRecent" light inset>
            <v-sheet
                class="text-center"
                height="200px"
            >
                <div class="py-5" v-if="recentFile">
                    <span class="text-h6">{{ recentFile.filename }}</span>
                </div>
                <div class="d-flex align-center">
                    <v-spacer></v-spacer>
                    <v-btn color="green" outlined icon x-large fab @click="startPrint">
                        <v-icon>mdi-play</v-icon>
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="orange" outlined icon x-large fab @click="preheatRecent">
                        <v-icon class="flip-icon">mdi-car-defrost-rear</v-icon>
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="red darken-1" outlined icon x-large fab @click="removeRecent">
                        <v-icon large>mdi-delete</v-icon>
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="grey darken-1" outlined icon fab
                           @click="sheetRecent = !sheetRecent">
                        <v-icon large>mdi-close</v-icon>
                    </v-btn>
                    <v-spacer></v-spacer>
                </div>
            </v-sheet>
        </v-bottom-sheet>


    </v-container>
</template>

<script>
import {mapGetters, mapState} from "vuex";
import Files from "@/pages/Files";
import ControlPanel from "@/components/panels/ControlPanel";
import ToolsPanel from "@/components/panels/ToolsPanel";
import QuickControlButton from "@/display/pieces/QuickControlButton";
import {findDirectory} from "@/plugins/helpers";

export default {
    components: {
        QuickControlButton,
    },
    data: () => ({
        sheetExtrude: false,
        sheetMove: false,
        sheetRecent: false,
        feedAmount: 25,
        feedrate: 5,
        files: [],
        currentPath: 'gcodes',
        defaultPath: 'gcodes',
        recentFile: null,
        dialogPrintFile: {
            show: false,
            item: {}
        },
    }),
    computed: {
        ...mapState({
            position: state => state.printer.toolhead.position,
            socket_connected: state => state.socket.isConnected,
            klippy_connected: state => state.server.klippy_connected,
            klippy_state: state => state.server.klippy_state,
            loadings: state => state.socket.loadings,
            cooldownGcode: state => state.gui.cooldownGcode,
            config: state => state.printer.configfile.config,

            feedamounts: state => state.gui.dashboard.extruder.feedamounts,
            feedrates: state => state.gui.dashboard.extruder.feedrates,

            filetree: state => state.files.filetree,
            homedAxes: state => state.printer.toolhead.homed_axes,
            printer_state: state => state.printer.print_stats.state,
            extruder: state => state.printer.extruder,
            feedrateXY: state => state.gui.dashboard.control.feedrateXY,
            stepsXY: state => state.gui.dashboard.control.stepsXY,
            feedrateZ: state => state.gui.dashboard.control.feedrateZ,
            stepsZ: state => state.gui.dashboard.control.stepsZ,
        }),
        ...mapGetters([
            'printer/getMacros',
            'gui/getPreheatPresets',
            'printer/getExtrudePossible',
        ]),

        stepsXYsorted: ControlPanel.computed.stepsXYsorted,
        stepsXYsortedReverse: ControlPanel.computed.stepsXYsortedReverse,
        stepsZsorted: ControlPanel.computed.stepsZsorted,
        stepsZsortedReverse: ControlPanel.computed.stepsZsortedReverse,

        feedamountsSorted: ControlPanel.computed.feedamountsSorted,
        feedratesSorted: ControlPanel.computed.feedratesSorted,

        recentFilename: function () {
            if (!this.recentFile) return '';
            return this.currentPath.replace(this.defaultPath, '') + '/' + this.recentFile.filename;
        },
        recentFileTime: function () {
            if (!this.recentFile) return '';
            return this.formatDate(this.recentFile.modified)
        },
        extruderTemp: function () {
            return this.extruder ? this.extruder.temperature.toFixed(1) + '°C' : '';
        }
    },
    created() {
        this.loadPath();
    },
    methods: {
        doHome: ControlPanel.methods.doHome,
        doHomeX: ControlPanel.methods.doHomeX,
        doHomeY: ControlPanel.methods.doHomeY,
        doHomeZ: ControlPanel.methods.doHomeZ,
        doQGL: ControlPanel.methods.doQGL,
        doSendMove: ControlPanel.methods.doSendMove,
        doSend: ControlPanel.methods.doSend,
        doSendMacro: ControlPanel.methods.doSendMacro,

        cooldown: ToolsPanel.methods.cooldown,
        preheat: ToolsPanel.methods.preheat,

        setFeedAmount: ControlPanel.methods.setFeedAmount,
        setFeedrate: ControlPanel.methods.setFeedrate,
        sendRetract: ControlPanel.methods.sendRetract,
        sendDetract: ControlPanel.methods.sendDetract,

        getSmallThumbnail: Files.methods.getSmallThumbnail,
        getBigThumbnail: Files.methods.getBigThumbnail,
        getThumbnailWidth: Files.methods.getThumbnailWidth,
        formatPrintTime: Files.methods.formatPrintTime,
        loadPath: Files.methods.loadPath,

        activateSheet(sheet) {
            this[sheet] = true;
        },
        loadRecentFile: function () {

            let dirArray = this.currentPath.split("/");
            this.files = findDirectory(this.filetree, dirArray);
            this.files = this.files.filter(file => file.filename !== "thumbs" && file.filename.substr(0, 1) !== ".");
            let dt = 0;
            let rf = null;

            for (const file of this.files) {
                let t = file.modified.getTime();
                if (t > dt) {
                    dt = t;
                    rf = file;
                }
            }
            if (rf && rf.isDirectory) {
                this.currentPath += "/" + rf.filename;
                this.loadPath();
            } else {
                this.recentFile = rf;
            }


        },
        startRecent() {
            this.sheetRecent = true;
        },
        startPrint() {
            let filename = (this.currentPath + "/" + this.recentFile.filename).substring(7);
            this.sheetRecent = false;
            this.$socket.sendObj('printer.print.start', {filename: filename});
            this.$router.push('/display/status');
        },
        formatDate(date) {
            let tmp2 = new Date(date)
            let str = '';

            str += tmp2.getMonth() + '/'
                + tmp2.getDate().toString().padStart(2, '0') + ' - '
                + tmp2.getHours().toString().padStart(2, '0') + ':' + tmp2.getMinutes().toString().padStart(2, '0')
            ;

            return str;
        },
        heatUpPLA: function () {
            let gcode = "M104 S210";
            this.$store.commit('server/addEvent', {message: gcode, type: 'command'});
            this.$socket.sendObj('printer.gcode.script', {script: gcode});
        },
        heatUpABS: function () {
            let gcode = "M104 S230";
            this.$store.commit('server/addEvent', {message: gcode, type: 'command'});
            this.$socket.sendObj('printer.gcode.script', {script: gcode});
        },
        preheatRecent() {
            if (
                'first_layer_extr_temp' in this.recentFile &&
                'first_layer_bed_temp' in this.recentFile &&
                !['error', 'printing', 'paused'].includes(this.printer_state)
            ) {
                let gcode = ""
                if (this.recentFile.first_layer_extr_temp > 0) {
                    gcode = "M104 S" + this.recentFile.first_layer_extr_temp
                    this.$store.commit('server/addEvent', {message: gcode, type: 'command'})
                    this.$socket.sendObj('printer.gcode.script', {script: gcode})
                }

                if (this.recentFile.first_layer_bed_temp > 0) {
                    gcode = "M140 S" + this.recentFile.first_layer_bed_temp
                    this.$store.commit('server/addEvent', {message: gcode, type: 'command'})
                    this.$socket.sendObj('printer.gcode.script', {script: gcode})
                }
            }
        },
        removeRecent() {
            this.$socket.sendObj('server.files.delete_file', {path: this.currentPath + "/" + this.recentFile.filename}, 'files/getDeleteFile');
        }
    },
    watch: {
        filetree: {
            deep: true,
            handler(newVal) {
                let dirArray = this.currentPath.split("/");
                this.files = findDirectory(newVal, dirArray);
                this.files = this.files.filter(file => file.filename !== "thumbs" && file.filename.substr(0, 1) !== ".");
                this.loadRecentFile()
            }
        },
        recentFile: {
            handler: function (newVal) {
                this.$socket.sendObj("server.files.metadata", {filename: newVal.filename}, "files/getMetadata");
            }
        },
    }
}
</script>