<style>
.pin-status {
    position: relative;
    padding-bottom: 1.3em;
    max-height: 50%;
}

.pin-status *, .pin-adjust * {
    user-select: none;
}

.pin-status .icon {
    position: absolute;
    left: 0;
    width: 100%;
    height: 60px;
}

.pin-status .pin-title {
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 100%;
}

.pin-status .pin-power {
    position: absolute;
    bottom: 2.5em;
    left: 0;
    width: 100%;
    text-align: center;
}

.pin-adjust {
    position: relative;
}

.pin-adjust .icon {
    position: absolute;
    left: 0;
    width: 100%;
    height: 100px;
}

.pin-adjust .pin-power {
    text-align: center;
}

.pin-title {
    text-transform: capitalize;
}

.icon-rotate {
    animation-duration: 1500ms;
}

.rotate-woah {
    animation-duration: 500ms;
}

.rotate-fast {
    animation-duration: 1000ms;
}

.rotate-slow {
    animation-duration: 2000ms;
}
</style>

<template>

    <div class="pin-status my-1" align="center"
         @click="triggerSheet">
        <!--                   v-bind="attrs" @click="switchOutputPin" v-long-press="triggerDialog" >-->
        <v-progress-circular :value="Math.round(target*100)" class="progress"
                             :rotate="270"
                             :size="70"
                             :width="5"
                             color="blue-grey"></v-progress-circular>

        <v-icon v-if="pin_type == 'fan'"
                :class="'icon ' + (target ? 'icon-rotate' : 'grey--text text--darken-3') + rotateSpeed">mdi-fan
        </v-icon>

        <v-icon v-if="pin_type == 'led'"
                :class="'icon ' + (target ? '' : 'grey--text text--darken-3')">mdi-lightbulb{{ target ? '' : '-outline' }}
        </v-icon>

        <div class="pin-power caption grey--text text--lighten-1" align="center">
            {{ Math.round(target * 100) }}
        </div>

        <div :class="'pin-title caption ' + (!controllable ? 'grey--text text--darken-2' : '')"
             align="center">{{ convertName(name, pin_type) }}
        </div>


        <v-bottom-sheet v-model="sheet" inset
                        @click:outside="removeRotaryEncode"
                        transition="none">
            <v-sheet class="text-center">
                <v-container>
                    <v-row class="d-flex pa-10">
                        <v-col class="flex-grow-0 pr-10">
                            <div class="pin-adjust"
                                 @click="switchOutputPin">
                                <v-progress-circular :value="Math.round(target*100)" class="progress"
                                                     :rotate="270"
                                                     :size="100"
                                                     :width="7"
                                                     color="light-blue"></v-progress-circular>

                                <v-icon v-if="pin_type === 'fan'"
                                        :class="'icon ' + (target ? 'icon-rotate' : 'grey--text text--darken-3') + rotateSpeed"
                                        x-large>mdi-fan
                                </v-icon>
                                <v-icon v-if="pin_type === 'led'"
                                        :class="'icon ' + (target ? '' : 'grey--text text--darken-3')"
                                        x-large>mdi-lightbulb{{ target ? '' : '-outline' }}
                                </v-icon>
                            </div>
                        </v-col>
                        <v-col class="d-flex flex-grow-1 flex-column justify-center">
                            <span class="pin-title">{{ convertName(name, pin_type) }}</span>
                            <v-slider v-if="controllable"
                                      v-model="value"
                                      :min="0"
                                      :max="1"
                                      :step="0.01"
                                      @change="sendCmd"
                                      class="flex-grow-0"
                                      hide-details>

                                <template v-slot:prepend>
                                    <v-icon @click="decrement">mdi-minus</v-icon>
                                </template>

                                <template v-slot:append>
                                    <v-icon @click="increment">mdi-plus</v-icon>
                                </template>
                            </v-slider>

                            <div class="pin-power caption grey--text text--lighten-1" align="center">{{ Math.round(target * 100) }}
                            </div>
                        </v-col>
                    </v-row>

                </v-container>
            </v-sheet>
        </v-bottom-sheet>
    </div>
</template>

<script>
import {convertName} from "@/plugins/helpers";

export default {
    data: function () {
        return {
            value: this.target,
            sheet: false,
        }
    },
    props: {
        target: {
            type: Number,
            required: true,
        },
        name: {
            type: String,
            required: true,
            default: ''
        },
        type: {
            type: String,
            required: false,
            default: ''
        },
        controllable: {
            type: Boolean,
            required: false,
            default: false
        },
        multi: {
            type: Number,
            required: false,
            default: 1
        },
        pin_type: {
            type: String,
            required: false,
            default: null,
        }
    },
    computed: {
        rotateSpeed: function () {
            if (this.target >= 0.75) {
                return ' rotate-woah'
            } else if (this.target >= 0.50) {
                return ' rotate-fast';
            } else if (this.target <= 0.25) {
                return ' rotate-slow'
            }
            return '';
        }
    },
    methods: {
        onRotaryEncode(e) {
            if (e.detail.direction == 'clockwise') {
                this.increment()
            } else if (e.detail.direction == 'counterClockwise') {
                this.decrement()
            }
        },
        removeRotaryEncode() {
            document.removeEventListener('onRotaryEncode', this.onRotaryEncode);
        },
        triggerSheet() {
            if (this.controllable) {
                this.sheet = true;
                document.addEventListener('onRotaryEncode', this.onRotaryEncode);
            }
        },
        convertName(name, remove) {
            let n = convertName(name).toLowerCase();
            return (n.indexOf(remove) != 0 && n.indexOf(remove) != -1) ? n.replace(remove, '') : n;
        },
        sendCmd() {
            let gcode = "";

            if (this.type === "fan") gcode = "M106 S" + (this.value * this.multi).toFixed(0)
            if (this.type === "fan_generic") gcode = "SET_FAN_SPEED FAN=" + this.name + " SPEED=" + (this.value * this.multi)
            if (this.type === "output_pin") gcode = "SET_PIN PIN=" + this.name + " VALUE=" + (this.value * this.multi).toFixed(2)

            if (gcode !== "") {
                this.$store.commit('server/addEvent', {message: gcode, type: 'command'})
                this.$socket.sendObj('printer.gcode.script', {script: gcode})
            }
        },
        switchOutputPin() {
            if (this.controllable) {
                this.value = this.value ? 0 : 1
                this.sendCmd();
            }
        },
        decrement() {
            if (this.value == 0.10) this.value = 0.01;
            this.value = this.value > 0 ? (this.value - 0.01).toFixed(2) : 0;
            this.sendCmd();
        },
        increment() {
            if (this.value < 0.10) this.value = 0.09;
            this.value = this.value < 1 ? (this.value + 0.01).toFixed(2) : 100;
            this.sendCmd();
        }
    }
}
</script>