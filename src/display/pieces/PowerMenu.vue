<style>
#power {
    z-index: 8;
}
.fab-tooltip {
    margin-left: 1em;
}

</style>

<template>
    <div v-if="!['printing', 'paused', 'complete'].includes(printer_state)">
    <v-overlay z-index="8" opacity="0.9" :value="power_btn"></v-overlay>
    <v-speed-dial id="power" v-model="power_btn"
                  bottom right fixed
                  direction="top"
                  transition="slide-x-transition"
    >
        <template v-slot:activator>
            <v-btn v-model="power_btn" color="grey darken-1" dark fab>
                <v-icon v-if="power_btn">mdi-close</v-icon>
                <v-icon v-else>mdi-power-settings</v-icon>
            </v-btn>
        </template>

        <v-tooltip :value="true" left content-class="fab-tooltip">
            <template v-slot:activator="{ on, attrs }">
                <v-btn fab dark small color="orange"
                       @click="doHostReboot()"
                       v-bind="attrs"
                       v-on="on">
                    <v-icon>mdi-restart</v-icon>
                </v-btn>
            </template>
            <span>Reboot</span>
        </v-tooltip>

        <v-tooltip :value="true" left content-class="fab-tooltip">
            <template v-slot:activator="{ on, attrs }">
                <v-btn fab dark small color="red"
                       @click="doHostShutdown()"
                       v-bind="attrs"
                       v-on="on">
                    <v-icon>mdi-power</v-icon>
                </v-btn>
            </template>
            <span>Shutdown</span>
        </v-tooltip>

    </v-speed-dial>
    </div>
</template>

<script>

import Vue from "vue";
import {mapState} from "vuex";

export default {
    name: "PowerMenu.vue",
    data: () => ({
        power_btn: null,
    }),
    computed: {
        ...mapState({
            printer_state: state => state.printer.print_stats.state,
            devices: (state) => state.server.power.devices,
        }),
    },
    methods: {
        changeSwitch(device, value) {
            this.setPower(device, (value === 'off') ? 1 : 0)
        },
        setPower(device, value) {
            let rpc = value === 1 ? "machine.device_power.on" : "machine.device_power.off"
            Vue.prototype.$socket.sendObj(rpc,{ [device.device]: null },"server/power/responseToggle")
        },
        doRestart: function() {
            this.showMenu = false
            this.$store.commit('server/addEvent', { message: "RESTART", type: 'command' })
            this.$socket.sendObj('printer.gcode.script', { script: "RESTART" })
        },
        doFirmwareRestart: function() {
            this.showMenu = false
            this.$store.commit('server/addEvent', { message: "FIRMWARE_RESTART", type: 'command' })
            this.$socket.sendObj('printer.gcode.script', { script: "FIRMWARE_RESTART" })
        },
        doServiceRestartKlipper: function() {
            this.showMenu = false
            this.$socket.sendObj('machine.services.restart', { service: "klipper" })
        },
        doServiceRestartMoonraker: function() {
            this.showMenu = false
            this.$socket.sendObj('machine.services.restart', { service: "moonraker" })
        },
        doHostReboot: function() {
            this.showMenu = false
            this.$socket.sendObj('machine.reboot', { })
        },
        doHostShutdown: function() {
            this.showMenu = false
            this.$socket.sendObj('machine.shutdown', { })
        },
    }
}
</script>