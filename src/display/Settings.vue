<style>


</style>

<template>
    <v-layout fill-height>

        <v-navigation-drawer v-model="drawer_settings" width="200">
            <v-list dense nav>
                <v-list-item v-for="(route, index) in settingsRoutes"
                             link
                             :to="route.path"
                             :key="index">
                    <v-list-item-icon>
                        <v-icon>mdi-{{ route.icon }}</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                        <v-list-item-title>{{ route.title }}</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
            </v-list>
        </v-navigation-drawer>

        <router-view></router-view>

    </v-layout>
</template>

<script>
import routes from '@/routes/display'

export default {
    components: {},
    data: () => ({
        drawer_settings: null,
        mini: false,
        routes,
    }),
    computed: {
        settingsRoutes: function () {
            return this.routes.filter(r => r.name == 'settings')[0].children.filter(r => !r.hidden);
        }
    },
    mounted() {
    }
}
</script>