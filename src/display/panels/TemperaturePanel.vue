<style>
.heat-status {
    position: absolute;
    right: 10px;
    top: 4px;
}
.bg-progress {
    position: absolute;
    width: 101%;
    height: 100%;
    left: 0;
    top: 0;
    z-index: 0;
    transform-origin: top;
    background-color: #111;
}
.bg-progress + * {
    position: relative;
    z-index: 5;
}
</style>

<template>
    <v-container class="pb-2">
        <v-row dense>

            <v-col v-for="(heater, index) in heaters" v-bind:key="index">
                <v-card class="text-center" @click="activateSheet(heater)">
                    <div v-if="heater.target > 0" class="bg-progress" :style="'transform: scaleY('+(1-(heater.temperature/heater.target).toFixed(1))+')'" ></div>
                    <v-card-text>
                        <v-icon :color="heater.color" x-large class="mb-2">mdi-{{ heater.icon }}</v-icon>
                        <small
                            class="heat-status">{{ heater.target > 0 ? (heater.power !== null ? (heater.power > 0 ? (heater.power * 100).toFixed(0) + '%' : "0%") : "active") : "off" }}</small>

                        <span v-for="(values, key) of heater.additionValues" v-bind:key="key"
                              class="d-block">{{ values.value.toFixed(1) }} {{ values.unit }}</span>
                        <div class="caption">{{ convertName(heater.name) }}</div>

                        <div>
                            <span class="title" :class="heater.target > 0 ? 'white--text' : ''">{{ heater.temperature ? heater.temperature.toFixed(1) : 0 }}°C</span>
                            <span v-if="heater.target > 0" class="caption"> / {{ heater.target }}°C</span>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col v-for="(sensor,index) in temperatureSensors" v-bind:key="index+999">
                <v-card class="text-center">
                    <v-card-text>
                        <v-icon color="grey" x-large class="mb-2"
                                :title="'min: '+sensor.min_temp+'° / max: '+sensor.max_temp+'°'">{{ sensor.icon }}
                        </v-icon>
                        <div class="caption">{{ convertName(sensor.name) }}</div>
                        <div class="title">
                            <span>{{ sensor.temperature ? sensor.temperature.toFixed(1) : 0 }}°C</span>
                        </div>
                        <span v-for="(values, key) of sensor.tempListAdditionValues" v-bind:key="key"
                              class="d-block">d{{ values.value.toFixed(1) }} {{ values.unit }}</span>
                    </v-card-text>
                </v-card>
            </v-col>

            <!--        <v-col v-for="(fan, index) in temperatureFans" v-bind:key="index+99" >-->
            <!--            <v-row align="center">-->
            <!--                <v-col class="flex-grow-0 py-2 pl-8 pr-0  colHeaterIcons">-->
            <!--                    <v-icon :color="(fan.target ? 'grey lighten-5' : 'grey darken-2')" :class="(fan.speed ? ' icon-rotate' : '')">mdi-fan</v-icon>-->
            <!--                </v-col>-->
            <!--                <v-col class="py-2 font-weight-bold"><span style="cursor: pointer;" @click="openHeater(fan)">{{ convertName(fan.name) }}</span></v-col>-->
            <!--                <v-col class="py-2 text-center d-none d-sm-block"><small>{{ fan.target > 0 && fan.speed > 0 ? (fan.speed * 100).toFixed(0)+"%" : (fan.target > 0 ? "standby" : "off") }}</small></v-col>-->
            <!--                <v-col class="py-2 text-center">-->
            <!--                    <span class="d-block">{{ fan.temperature ? fan.temperature.toFixed(1) : 0}}°C</span>-->
            <!--                    <span v-for="(values, key) of fan.additionValues" v-bind:key="key" class="d-block">{{ values.value.toFixed(1) }} {{ values.unit }}</span>-->
            <!--                </v-col>-->
            <!--                <v-col class="text-center py-2 pr-8 pr-0  vertical_align_center">-->
            <!--                    <toolInput :name="fan.name" :target="fan.target" command="SET_TEMPERATURE_FAN_TARGET" attribute-name="temperature_fan" :items="fan.presets" ></toolInput>-->
            <!--                </v-col>-->
            <!--            </v-row>-->
            <!--        </v-col>-->

            <!--        <v-divider class="my-2" v-if="boolTempchart"></v-divider>-->
            <!--        <v-row v-if="boolTempchart">-->
            <!--            <v-col class="px-8 pt-6">-->
            <!--                <temp-chart ></temp-chart>-->
            <!--            </v-col>-->
            <!--        </v-row>-->
        </v-row>



        <v-bottom-sheet v-model="sheetHeater" inset>
            <v-sheet class="text-center pa-10" v-if="heater">
                <v-row class="d-flex align-center">
                    <v-col class="col-2">
                        <div>{{ convertName(heater.name) }}</div>
                        <div>
                            <v-icon :color="heater.color" x-large class="mb-2">mdi-{{ heater.icon }}</v-icon>
                            <small
                                class="heat-status">{{ heater.target > 0 ? (heater.power !== null ? (heater.power > 0 ? (heater.power * 100).toFixed(0) + '%' : "0%") : "active") : "off" }}</small>
                            <div class="caption">
                                <span>{{ heater.temperature ? heater.temperature.toFixed(1) : 0 }}°C</span>
                                <span v-if="heater.target > 0"> / {{ heater.target }}°C</span>
                            </div>
                            <span v-for="(values, key) of heater.additionValues" v-bind:key="key"
                                  class="d-block">{{ values.value.toFixed(1) }} {{ values.unit }}</span>

                        </div>
                    </v-col>
                    <v-divider vertical></v-divider>
                    <v-col class="col-2">
                        <v-btn color="blue" fab @click="cooldownFromSheet">
                            <v-icon>mdi-snowflake</v-icon>
                        </v-btn>
                    </v-col>
                    <v-divider vertical></v-divider>
                    <v-col>
                        <tool-slider label="Temp" :target="heater.target" :max="heater.max_temp" :multi="1" :step="1" :command="heater_command" attribute-name="S" unit="°C"></tool-slider>
                    </v-col>
                </v-row>
            </v-sheet>
        </v-bottom-sheet>

    </v-container>
</template>

<script>

import toolsPanel from "@/components/panels/ToolsPanel";
import ToolSlider from "@/inputs/ToolSlider";

export default {
    extends: toolsPanel,
    components: {
        ToolSlider,
    },
    data: function () {
        return {
            sheetHeater: false,
            heater: {name: ''},
            heater_command: null
        }
    },
    methods : {
        activateSheet(heater) {
            this.sheetHeater = true;
            this.heater = heater;
            if (heater.type == 'heater_bed') {
                this.heater_command = 'M140'
            } else if (heater.type == 'extruder') {
                this.heater_command = 'M104'
            }
        },
        cooldownFromSheet() {
            let gcode = 'SET_HEATER_TEMPERATURE HEATER='+this.heater.name+' TARGET=0';
            this.$store.commit('server/addEvent', { message: gcode, type: 'command' })
            this.$socket.sendObj('printer.gcode.script', { script: gcode })
            this.sheetHeater = false;
        }
    }
}
</script>