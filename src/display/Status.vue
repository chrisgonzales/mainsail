<style>
.print-progress {
    position: relative;
}

.print-progress-text {
    position: absolute;
    left: 50%;
    top: 50%;
    text-align: center;
    transform: translate(-50%, -50%);
}

.print-thumbnail img {
    width: auto;
    max-height: 80vh;
    -webkit-filter: grayscale(100%) sepia(25%) brightness(0.7) contrast(140%) hue-rotate(164deg) saturate(105%);
}
.complete.print-thumbnail img {
    -webkit-filter: grayscale(100%) sepia(100%) brightness(.9) contrast(120%) hue-rotate(23deg) saturate(280%);
}

.print-thumbnail-col {
    position: relative;
}
.print-title {
    position: absolute;
    top: 0;
    width: 100%;
}
.fan-controls {
    position: absolute;
    width: 100%;
    bottom: 10px;
}
</style>

<template>
    <v-container fill-height class="pa-0 ma-0">
        <v-row no-gutters style="height: 100vh">

            <v-col class="d-flex flex-column" :class="['printing', 'paused'].includes(printer_state) ? 'col-6' :  'col-5'">

                <temperature-panel v-if="socket_connected && klippy_connected"></temperature-panel>

                <v-row class="grey grey--text text--lighten-1 darken-4 rounded mx-3 my-0">
                    <v-col class="flex-grow-0 d-flex align-center justify-center py-0">
                        <v-icon>mdi-axis-arrow</v-icon>
                    </v-col>
                    <v-divider vertical></v-divider>
                    <v-col class="d-flex flex-column align-center justify-center py-0">
                        <div class="caption"><strong>X</strong></div>
                        <div class="subtitle-2">{{ position.length ? position[0].toFixed(2) : "--" }}</div>
                    </v-col>
                    <v-divider vertical></v-divider>
                    <v-col class="d-flex flex-column align-center justify-center py-0">
                        <div class="caption"><strong>Y</strong></div>
                        <div class="subtitle-2">{{ position.length ? position[1].toFixed(2) : "--" }}</div>
                    </v-col>
                    <v-divider vertical></v-divider>
                    <v-col class="d-flex flex-column align-center justify-center py-0">
                        <div class="caption"><strong>Z</strong></div>
                        <div class="subtitle-2">{{ position.length ? position[2].toFixed(2) : "--" }}</div>
                    </v-col>
                    <v-divider vertical v-if="['printing', 'paused', 'error'].includes(printer_state) && 'filament_total' in current_file "></v-divider>
                    <v-col
                        v-if="['printing', 'paused', 'error'].includes(printer_state) && 'filament_total' in current_file "
                        class="d-flex flex-column align-center justify-center py-0">
                        <div class="caption">Speed</div>
                        <div class="subtitle-2">{{ (requested_speed / 60).toFixed(0) }} mm/s</div>
                    </v-col>
                </v-row>


                <v-row class="mx-2 my-2 mb-3">
                    <quick-control-button label="Z Step" :sublabel="(homing_origin.length > 1 ? homing_origin[2].toFixed(2) : 0.00 ) + 'mm'"
                                          icon="arrow-collapse-vertical"
                                          color="teal"
                                          v-if="['printing', 'paused'].includes(printer_state)"
                                          :action="activateSheet" argument="sheetZStep"
                    ></quick-control-button>

                    <quick-control-button label="Speed" :sublabel="(speed_factor * 100) + '%'"
                                          icon="speedometer"
                                          color="purple"
                                          v-if="['printing', 'paused'].includes(printer_state)"
                                          :action="activateSheet" argument="sheetSpeed"
                    ></quick-control-button>

                    <quick-control-button label="Flow" :sublabel="(extrude_factor * 100) + '%'"
                                          icon="printer-3d-nozzle"
                                          color="pink"
                                          v-if="['printing', 'paused'].includes(printer_state)"
                                          :action="activateSheet" argument="sheetFlow"
                    ></quick-control-button>

                    <quick-control-button label="Pause"
                                          icon="pause"
                                          color="orange"
                                          :loading="loadings.includes('statusPrintPause')"
                                          v-if="(printer_state === 'printing')"
                                          :action="btnPauseJob"
                    ></quick-control-button>

                    <quick-control-button label="Cancel"
                                          icon="stop"
                                          color="red"
                                          v-if="(printer_state === 'paused')"
                                          :action="btnCancelJob"
                    ></quick-control-button>

                    <quick-control-button label="Resume"
                                          icon="play"
                                          color="green"
                                          v-if="(printer_state === 'paused')"
                                          :action="btnResumeJob"
                    ></quick-control-button>

                    <quick-control-button label="Clear"
                                          icon="broom"
                                          color="light-blue"
                                          v-if="['error', 'complete'].includes(printer_state)"
                                          :loading="loadings.includes('statusPrintClear')"
                                          :action="clearJob"
                    ></quick-control-button>

                    <quick-control-button label="Reprint"
                                          icon="replay"
                                          color="green"
                                          v-if="['error', 'complete'].includes(printer_state)"
                                          :loading="loadings.includes('statusPrintReprint')"
                                          :action="btnReprintJob"
                    ></quick-control-button>
                </v-row>
            </v-col>
            <v-col class="flex-grow-1 d-flex flex-column text-center justify-center">


                <div class="text-center d-flex justify-space-around"
                     v-if="['printing', 'paused', 'error'].includes(printer_state) && 'filament_total' in current_file ">
                    <div>
                        <strong class="grey--text">Layer </strong>
                        <span>{{ current_layer }} of {{ max_layers }}</span>
                    </div>
                </div>

                <div class="print-progress my-5">
                    <span class="title print-progress-text">{{ Math.round(printPercent * 100) + "%" }}</span>
                    <v-progress-circular :value="Math.round(printProgress*100)"
                                         :rotate="270"
                                         :size="135"
                                         :width="12"
                                         :color="printPercent == 1 ? 'lime' : 'blue-grey'"></v-progress-circular>
                </div>
                <div>
                    <v-row class="d-flex px-3"
                           v-if="['printing', 'paused', 'error'].includes(printer_state)">
                        <v-col class="col-4">
                            <div class="grey--text caption"><strong>ETA</strong></div>
                            <div class="subtitle-2">{{ eta ? formatDateTime(eta) : '--' }}</div>
                        </v-col>
                        <v-col class="col-4">
                            <div class="grey--text caption"><strong>File</strong></div>
                            <div class="subtitle-2">{{ estimated_time_file ? formatTime(estimated_time_file) : '--' }}</div>
                        </v-col>
                        <v-col class="col-4">
                            <div class="grey--text caption"><strong>Slicer</strong></div>
                            <div class="subtitle-2">{{ estimated_time_slicer ? formatTime(estimated_time_slicer) : '--' }}</div>
                        </v-col>
                    </v-row>

                    <v-row class="d-flex px-3">
                        <v-col class="col-4">
                            <div class="grey--text caption"><strong>Filament</strong></div>
                            <div class="subtitle-2">
                            <span v-if="filament_used >= 1000"
                                  class=" text-no-wrap">{{ (filament_used / 1000).toFixed(2) }} m</span>
                                <span v-if="filament_used < 1000"
                                      class=" text-no-wrap">{{ filament_used.toFixed(2) }} mm</span>
                            </div>
                        </v-col>
                        <v-col class="col-4">
                            <div class="grey--text caption"><strong>Print</strong></div>
                            <div class="subtitle-2">{{ formatTime(print_time) }}</div>
                        </v-col>
                        <v-col class="col-4">
                            <div class="grey--text caption"><strong>Total</strong></div>
                            <div class="subtitle-2">{{ formatTime(print_time_total) }}</div>
                        </v-col>
                    </v-row>
                </div>
            </v-col>

            <v-divider vertical></v-divider>

            <v-col class="d-flex flex-column text-center print-thumbnail-col" :class="['printing', 'paused'].includes(printer_state) ? 'col-3' :  'col-4'">

                <div class="print-title subtitle-2 text--disabled pt-3 text-truncate">
                    <v-icon small
                            class="mr-1">mdi-file-outline</v-icon>
                    {{ current_filename }}
                </div>

                <div class="print-thumbnail" :class="printProgress === 1 ? 'complete' : ''"
                     v-if="
                            ['printing', 'paused', 'complete'].includes(printer_state) &&
                            current_file &&
                            current_file.thumbnails &&
                            current_file.thumbnails.length &&
                            current_file.thumbnails.find(element => element.width > 100)
                        ">
                    <img
                        :src="'data:image/gif;base64,'+(current_file.thumbnails ? current_file.thumbnails.find(element => element.width > 100).data : '')"/>
                </div>

                <div class="fan-controls">
                    <fan-panel v-if="klippy_state === 'ready'" controllable class="justify-space-around"></fan-panel>
                </div>

            </v-col>


        </v-row>


        <v-bottom-sheet v-model="sheetZStep"
                        inset
                        transition="none">
            <v-sheet>
                <p class="text-center pt-10 px-10">
                    <span class="caption grey--text">Current Offset</span> <span class="title">{{ homing_origin.length > 1 ? homing_origin[2].toFixed(2) : 0.00 }}mm</span>
                </p>

                <v-row class="pb-10">
                    <v-col
                        class="col text-center d-flex flex-column align-center flex-sm-row justify-center">
                        <v-btn-toggle dense no-gutters
                                      class="mx-2 mt-3 mt-sm-0 order-last flex-nowrap order-sm-first">
                            <v-btn large @click="sendBabySteppingDownFine()" class=""
                                   :loading="loadings.includes('babySteppingDownFine')">
                                <v-icon small class="mr-2">mdi-arrow-collapse-down</v-icon>
                                -0.01mm
                            </v-btn>
                            <v-btn large @click="sendBabySteppingDown()" class=""
                                   :loading="loadings.includes('babySteppingDown')">-0.05mm
                            </v-btn>
                        </v-btn-toggle>
                        <v-btn-toggle dense no-gutters class="mx-2 order-first flex-nowrap order-sm-last">
                            <v-btn large @click="sendBabySteppingUpFine()" class=""
                                   :loading="loadings.includes('babySteppingUpFine')">
                                <v-icon small class="mr-2">mdi-arrow-expand-up</v-icon>
                                +0.01mm
                            </v-btn>
                            <v-btn large @click="sendBabySteppingUp()" class=""
                                   :loading="loadings.includes('babySteppingUp')">+0.05mm
                            </v-btn>
                        </v-btn-toggle>
                    </v-col>
                </v-row>

            </v-sheet>
        </v-bottom-sheet>

        <v-bottom-sheet v-model="sheetSpeed" inset>
            <v-sheet class="text-center pa-10">
                <div>Speed</div>
                <tool-slider label="Speed factor" :target="speed_factor" :max="200" :multi="100" :step="5" command="M220" attribute-name="S" ></tool-slider>
            </v-sheet>
        </v-bottom-sheet>

        <v-bottom-sheet v-model="sheetFlow" inset>
            <v-sheet class="text-center pa-10">
                <div>Flow</div>
                <tool-slider label="Extrusion factor" :target="extrude_factor" :max="200" :multi="100" :step="1" command="M221" attribute-name="S" ></tool-slider>
            </v-sheet>
        </v-bottom-sheet>

    </v-container>
</template>

<script>
import {mapState} from "vuex";
import StatusPanel from "@/components/panels/StatusPanel";
import ZOffsetPanel from "@/components/panels/ZOffsetPanel";
import TemperaturePanel from "@/display/panels/TemperaturePanel";
import QuickControlButton from "@/display/pieces/QuickControlButton";
import ToolSlider from '@/inputs/ToolSlider';

export default {
    components: {
        TemperaturePanel,
        QuickControlButton,
        ToolSlider,
    },
    data: function () {
        return {
            sheetZStep: false,
            sheetControls: false,
            sheetSpeed: false,
            sheetFlow: false,
        }
    },
    computed: {
        ...mapState({
            toolhead: state => state.printer.toolhead,
            position: state => state.printer.toolhead.position,
            gcode_position: state => state.printer.gcode_move.gcode_position,
            requested_speed: state => state.printer.gcode_move.speed,

            homing_origin: state => state.printer.gcode_move.homing_origin,
            homed_axis: state => state.printer.toolhead.homed_axes,

            printProgress: state => state.printer.virtual_sdcard.progress,
            file_position: state => state.printer.virtual_sdcard.file_position,
            current_file: state => state.printer.current_file,

            print_time: state => state.printer.print_stats.print_duration,
            print_time_total: state => state.printer.print_stats.total_duration,
            filament_used: state => state.printer.print_stats.filament_used,
            current_filename: state => state.printer.print_stats.filename,
            printer_state: state => state.printer.print_stats.state,
            print_stats_message: state => state.printer.print_stats.message,

            display_message: state => state.printer.display_status.message,
            loadings: state => state.socket.loadings,
            extrude_factor: state => state.printer.gcode_move.extrude_factor,
            speed_factor: state => state.printer.gcode_move.speed_factor,

            socket_connected: state => state.socket.isConnected,
            klippy_connected: state => state.server.klippy_connected,
            klippy_state: state => state.server.klippy_state,
        }),

        printPercent: StatusPanel.computed.printPercent,
        max_layers: StatusPanel.computed.max_layers,
        current_layer: StatusPanel.computed.current_layer,
        estimated_time_file: StatusPanel.computed.estimated_time_file,
        estimated_time_filament: StatusPanel.computed.estimated_time_filament,
        estimated_time_slicer: StatusPanel.computed.estimated_time_slicer,
        eta: StatusPanel.computed.eta,
    },
    methods: {
        btnPauseJob: StatusPanel.methods.btnPauseJob,
        btnResumeJob: StatusPanel.methods.btnResumeJob,
        btnCancelJob: StatusPanel.methods.btnCancelJob,
        btnClearJob: StatusPanel.methods.btnClearJob,
        btnReprintJob: StatusPanel.methods.btnReprintJob,
        formatTime: StatusPanel.methods.formatTime,
        formatDateTime: StatusPanel.methods.formatDateTime,

        sendBabySteppingDownFine: ZOffsetPanel.methods.sendBabySteppingDownFine,
        sendBabySteppingDown: ZOffsetPanel.methods.sendBabySteppingDown,
        sendBabySteppingUpFine: ZOffsetPanel.methods.sendBabySteppingUpFine,
        sendBabySteppingUp: ZOffsetPanel.methods.sendBabySteppingUp,

        activateSheet(sheet) {
            this[sheet] = true;
        },
        clearJob() {
            this.btnClearJob();
            this.$router.push('/display');
        }
    },
}
</script>