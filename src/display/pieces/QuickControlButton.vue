<style>

</style>

<template>
    <v-col border="red" :class="(color?color:'text--lighten-1 grey')+'--text'"

           @click="click"
            class="grey darken-4 quick-button rounded d-flex mx-1 flex-column align-center justify-center py-1 ">
        <v-btn icon :color="color||'grey'" :loading="loading">
            <v-icon>mdi-{{ icon }}</v-icon>
        </v-btn>
        <div class="subtitle-2">{{ label }}</div>
        <div v-if="sublabel" class="caption">{{ sublabel }}</div>
    </v-col>
</template>

<script>
export default {
    data: function () {
        return {};
    },
    props: {
        action: {
            type: Function,
            required: true,
        },
        icon: {
            type: String,
            required: true,
        },
        label: {
            type: String,
            required: true,
        },
        sublabel: {
            type: String,
            required: false,
        },
        argument: {
            required: false,
        },
        color: {
            type: String,
            required: false,
        },
        loading: {
            required: false
        }
    },
    methods : {
        click() {
            if (this.argument != undefined) {
                this.action(this.argument);
            } else {
                this.action();
            }
        }
    }
}
</script>