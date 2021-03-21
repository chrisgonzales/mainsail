<style>
</style>

<template>
    <v-container fluid>
        <v-row class="d-flex pa-3 align-center text-center">

            <v-col>
                <v-card>
                    <v-card-text>
                        <v-icon>mdi-toggle-switch</v-icon>
                    </v-card-text>
                    <v-card-text>Disable Motors</v-card-text>
                </v-card>
            </v-col>

            <v-col>
                <v-card>
                    <v-card-text>
                        <v-icon>mdi-electric-switch</v-icon>
                    </v-card-text>
                    <v-card-text>Trigger Endstops</v-card-text>
                </v-card>
            </v-col>

        </v-row>

    </v-container>
</template>

<script>

export default {
    data() {
        return {
        }
    },
    computed: {

    },
    methods: {

    },
}
</script>