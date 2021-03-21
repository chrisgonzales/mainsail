<template>
    <div class="d-flex no-gutters">

        <pin-control-piece v-for="object of fans" v-bind:key="object.name"
                           pin_type="fan"
                           :name="object.name" :type="object.type" :target="object.speed"
                           :controllable="object.controllable"
                           :multi="255"></pin-control-piece>

        <pin-control-piece v-for="object of lights" v-bind:key="object.name" pin_type="led"
                           :name="object.name" :type="object.type" :target="object.power"
                           :controllable="object.controllable"
                           :multi="parseInt(object.scale)"></pin-control-piece>

    </div>
</template>

<script>
import MiscellaneousPanel from "@/components/panels/MiscellaneousPanel";
import PinControlPiece from "@/display/pieces/PinControlPiece";

export default {
    extends: MiscellaneousPanel,
    props: {
        controllable: {
            type: Boolean,
            default: false,
        },
    },
    data: function () {
        return {
            sheet: false
        }
    },
    components: {
        PinControlPiece,
    },
    computed: {
        fans: {
            get() {
                if (this.controllable) return this.$store.getters["printer/getFans"].filter(obj => obj.controllable == true);

                return this.$store.getters["printer/getFans"];
            }
        },
        lights: {
            get() {
                return this.$store.getters["printer/getMiscellaneous"].filter(obj => obj.name.toLowerCase().indexOf('_led') != -1);
            }
        }
    },
    methods: {
        activateSheet() {
            this.sheet = true;
        }
    }
}
</script>