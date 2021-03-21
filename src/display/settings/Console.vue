<style>
.gcode-command-field .v-input__slot {
    margin-bottom: 0;
}

.gcode-command-field .v-text-field__details {
    display: none;
}

.gcode-command-btn {
    margin-top: 5px;
}

.log-cell.title-cell {
    vertical-align: top;
    height: auto !important;
}

.log-cell.content-cell {
    vertical-align: top;
    min-height: auto;
    height: auto !important;
}
</style>

<template>
    <v-container fluid fill-height>
        <v-row fill-height>
            <v-col xs12 style="overflow: auto; height: 100vh;">

                <v-data-table
                    :headers="headers"
                    :options="options"
                    :sort-by.sync="sortBy"
                    :items="events"
                    item-key="date"
                    fixed-header
                    hide-default-footer
                    disable-pagination
                    class="event-table"
                    :custom-sort="customSort"
                    mobile-breakpoint="0"
                    dense
                >
                    <template #no-data>
                        <div class="text-center">empty</div>
                    </template>

                    <template #item="{ item }">
                        <tr>
                            <td class="log-cell title-cell py-2 flex-grow-0 pr-0 d-none d-sm-table-cell">
                                {{ formatTimeMobile(item.date) }}
                            </td>
                            <td class="log-cell content-cell py-2" colspan="2">
                                <span v-if="item.message" :class="'message '+colorConsoleMessage(item)"
                                      v-html="formatConsoleMessage(item.message)"></span>
                            </td>
                        </tr>
                    </template>
                </v-data-table>

            </v-col>
            <v-col class="col-auto no-gutters px-0">
                <v-menu :offset-y="true" :close-on-content-click="false" title="Setup Console">
                    <template v-slot:activator="{ on, attrs }">
                        <v-btn class="gcode-command-btn my-0 px-2 minwidth-0" color="lightgray" v-bind="attrs"
                               v-on="on">
                            <v-icon>mdi-cog</v-icon>
                        </v-btn>
                    </template>
                    <v-list>
                        <v-list-item class="minHeight36">
                            <v-checkbox class="mt-0" v-model="hideWaitTemperatures" hide-details
                                        label="Hide temperatures"></v-checkbox>
                        </v-list-item>
                        <v-list-item class="minHeight36">
                            <v-checkbox class="mt-0" v-model="boolCustomFilters" hide-details
                                        label="Custom filters"></v-checkbox>
                        </v-list-item>
                    </v-list>
                </v-menu>
            </v-col>
        </v-row>

    </v-container>
</template>

<script>
import Console from '@/pages/Console';

export default {
    extends: Console
}
</script>