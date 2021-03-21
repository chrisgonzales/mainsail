<style>
.v-data-table .v-data-table-header__icon {
    margin-left: 7px;
}

.v-data-table th {
    white-space: nowrap;
}

.v-data-table .file-list-cursor:hover {
    cursor: pointer;
}

.minHeight36 {
    min-height: 36px;
}

.flip-icon {
    transform: rotate(180deg);
}

.grid-thumbnail img {
    max-width: 100%;
    max-height: 100%;
    -webkit-filter: grayscale(100%) sepia(25%) brightness(0.7) contrast(140%) hue-rotate(164deg) saturate(105%);
}

.grid-thumbnail,
.grid-thumbnail-icon {
    height: 160px;
}

.thumbnail-filename {
    position: absolute;
    bottom: 0;
    display: block;
    width: 90%;
}

.grid-file {
    position: relative;
}
</style>

<template>
    <div class="d-flex flex-column align-stretch" style="height: 100vh">

        <v-container class="d-flex align-left py-2 pr-3">
            <div class="flex-grow-1 d-flex text-left align-center">
                <v-btn-toggle v-model="listView" mandatory class="mr-3">
                    <v-btn title="Grid" small>
                        <v-icon small>mdi-view-grid</v-icon>
                    </v-btn>
                    <v-btn title="List" small>
                        <v-icon small>mdi-view-list</v-icon>
                    </v-btn>
                </v-btn-toggle>
                <v-btn @click="refreshFileList"
                       title="Refresh current Directory"
                       class="flex-grow-0 mr-3" small>
                    <v-icon small>mdi-refresh</v-icon>
                </v-btn>
                <span
                    class="caption">Current path: {{ this.currentPath !== 'gcodes' ? "/" + this.currentPath.substring(7) : "/" }}</span>
            </div>
            <div v-if="this.disk_usage !== null">
                <span class="caption">
                        Used: {{ formatFilesize(this.disk_usage.used) }}
                    <span class="grey--text text--darken-2">|</span>
                        Free: {{ formatFilesize(this.disk_usage.free) }}
                    <span class="grey--text text--darken-2">|</span>
                        Total: {{ formatFilesize(this.disk_usage.total) }}</span>
            </div>
            <div>

                <v-menu :offset-y="true" :close-on-content-click="false" title="Setup current list">
                    <template v-slot:activator="{ on, attrs }">
                        <v-btn class="flex-grow-1 ml-3" v-bind="attrs" v-on="on" small>
                            <v-icon small>mdi-cog</v-icon>
                        </v-btn>
                    </template>
                    <v-list>
                        <v-list-item class="minHeight36">
                            <v-checkbox class="mt-0" hide-details v-model="showHiddenFiles"
                                        label="Hidden files"></v-checkbox>
                        </v-list-item>
                        <v-divider></v-divider>
                        <v-list-item class="minHeight36" v-for="header of configHeaders" v-bind:key="header.key">
                            <v-checkbox class="mt-0" hide-details v-model="header.visible"
                                        @change="changeMetadataVisible(header.value)" :label="header.text"></v-checkbox>
                        </v-list-item>
                    </v-list>
                </v-menu>
            </div>
        </v-container>

        <div class="flex-grow-1 px-3" v-if="!listView" style="overflow: auto">
            <v-row class="px-2 pb-3">
                <v-col v-if="(currentPath !== 'gcodes')"
                       @click="clickRowGoBack"
                       class="col-2 pa-1"
                >
                    <div class="grey darken-4 rounded pa-3 grid-file">
                        <v-icon left>mdi-folder-upload</v-icon>
                        <span class="caption text-truncate mb-2">..</span>
                    </div>
                </v-col>
                <v-col
                    @click="clickRow(item)"
                    class="col-2 pa-1"
                    v-for="(item,key) in sortedDirectories" v-bind:key="key">
                    <div class="grey darken-4 rounded pa-3 grid-file">
                        <v-icon left>mdi-folder</v-icon>
                        <span class="caption text-truncate mb-2">{{ item.filename }}</span>
                    </div>
                </v-col>
            </v-row>
            <v-row class="px-2">
                <v-col
                    class="col-2 pa-1"
                    @click="clickRow(item)"
                    v-for="(item,key) in sortedFiles" v-bind:key="key">
                    <div class="grey darken-4 rounded pa-3 grid-file text-center">
                        <div
                            class="grid-thumbnail"
                            v-if="!item.isDirectory && getBigThumbnail(item)">
                            <img :src="getBigThumbnail(item)"/>
                        </div>

                        <div
                            class="grid-thumbnail-icon d-flex flex-column justify-center"
                            v-if="!item.isDirectory && !getBigThumbnail(item)">
                            <v-icon left x-large color="grey">mdi-file-code</v-icon>
                        </div>

                        <div class="thumbnail-filename caption text-truncate mb-2">{{ item.filename }}</div>
                    </div>
                </v-col>
            </v-row>
        </div>

        <div class="flex-grow-1 px-3" v-if="listView" style="overflow: auto">
            <v-data-table
                dense
                :items="files"
                class="files-table"
                :headers="filteredHeaders"
                :options="options"
                :custom-sort="sortFiles"
                :sort-by.sync="sortBy"
                :sort-desc.sync="sortDesc"
                height="100%"
                fixed-header
                item-key="name"
                mobile-breakpoint="0"
                hide-default-footer
                :disable-pagination="true" style="height: 100%">

                <template slot="items" slot-scope="props">
                    <td v-for="header in filteredHeaders" v-bind:key="header.text">{{ props.item[header.value] }}
                    </td>
                </template>

                <template #no-data>
                    <div class="text-center">empty</div>
                </template>

                <template slot="body.prepend" v-if="(currentPath !== 'gcodes')">
                    <tr
                        class="file-list-cursor"
                        @click="clickRowGoBack"
                    >
                        <td class="pr-0 text-center" style="width: 32px;">
                            <v-icon>mdi-folder-upload</v-icon>
                        </td>
                        <td class=" " colspan="8">..</td>
                    </tr>
                </template>

                <template v-slot:item="{ item }">
                    <tr
                        @contextmenu="showContextMenu($event, item)"
                        @click="clickRow(item)"
                        class="file-list-cursor"
                        :data-name="item.filename"
                    >
                        <td class="pr-0 text-center" style="width: 32px;">
                            <v-icon v-if="item.isDirectory">mdi-folder</v-icon>
                            <v-icon v-if="!item.isDirectory && !(getSmallThumbnail(item))"
                                    class="grey--text text--lighten-1">mdi-file-code
                            </v-icon>
                            <v-tooltip
                                v-if="!item.isDirectory && getSmallThumbnail(item) && getBigThumbnail(item)"
                                top>
                                <template v-slot:activator="{ on, attrs }">
                                    <img :src="getSmallThumbnail(item)" width="32"
                                         height="32"
                                         v-bind="attrs" v-on="on"/>
                                </template>
                                <span><img :src="getBigThumbnail(item)"
                                           width="250"/></span>
                            </v-tooltip>
                            <img v-if="!item.isDirectory && getSmallThumbnail(item) && !getBigThumbnail(item)"
                                 :src="getSmallThumbnail(item)" width="32" height="32"/>
                        </td>
                        <td class=" ">{{ item.filename }}</td>
                        <td class="text-no-wrap text-right"
                            v-if="headers.filter(header => header.value === 'size')[0].visible">{{ item.isDirectory ? '--' : formatFilesize(item.size) }}
                        </td>
                        <td class="text-no-wrap text-right"
                            v-if="headers.filter(header => header.value === 'object_height')[0].visible">{{ item.object_height ? item.object_height.toFixed(2) + ' mm' : '--' }}
                        </td>
                        <td class="text-no-wrap text-right"
                            v-if="headers.filter(header => header.value === 'layer_height')[0].visible">{{ item.layer_height ? item.layer_height.toFixed(2) + ' mm' : '--' }}
                        </td>
                        <td class="text-no-wrap text-right"
                            v-if="headers.filter(header => header.value === 'filament_total')[0].visible">{{ item.filament_total ? item.filament_total.toFixed() + ' mm' : '--' }}
                        </td>
                        <td class="text-no-wrap text-right"
                            v-if="headers.filter(header => header.value === 'estimated_time')[0].visible">{{ formatPrintTime(item.estimated_time) }}
                        </td>
                        <td class="text-no-wrap text-right"
                            v-if="headers.filter(header => header.value === 'slicer')[0].visible">{{ item.slicer ? item.slicer : '--' }}<br/><small
                            v-if="item.slicer_version">{{ item.slicer_version }}</small></td>
                        <td class="text-right"
                            v-if="headers.filter(header => header.value === 'modified')[0].visible">{{ formatDate(item.modified) }}
                        </td>
                    </tr>
                </template>
            </v-data-table>
        </div>

        <v-bottom-sheet v-model="sheet" light inset>
            <v-sheet
                class="text-center"
                height="200px"
            >
                <div class="py-5">
                    <span class="text-h6">{{ dialogPrintFile.item.filename }}</span>
                    &mdash;
                    <span class="text-subtitle-1">{{ formatPrintTime(dialogPrintFile.item.estimated_time) }}</span>
                </div>
                <div class="d-flex align-center">
                    <v-spacer></v-spacer>
                    <v-btn color="green" outlined icon x-large fab
                           @click="startPrint"
                           :disabled="['printing', 'paused', 'complete'].includes(printer_state)">
                        <v-icon>mdi-play</v-icon>
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="orange" outlined icon x-large fab
                           @click="preheat"
                           v-if="
                                'first_layer_extr_temp' in dialogPrintFile.item &&
                                dialogPrintFile.item.first_layer_extr_temp > 0 &&
                                'first_layer_bed_temp' in dialogPrintFile.item &&
                                dialogPrintFile.item.first_layer_bed_temp > 0
                            "
                           :disabled="['error', 'printing', 'paused'].includes(printer_state)">
                        <v-icon class="flip-icon">mdi-car-defrost-rear</v-icon>
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="red darken-1" outlined icon x-large fab @click="removeFile">
                        <v-icon large>mdi-delete</v-icon>
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="grey darken-1" outlined icon fab
                           @click="sheet = !sheet">
                        <v-icon large>mdi-close</v-icon>
                    </v-btn>
                    <v-spacer></v-spacer>
                </div>
            </v-sheet>
        </v-bottom-sheet>

    </div>
</template>

<script>

import Files from "@/pages/Files";

export default {
    extends: Files,
    components: {},
    data() {
        return {
            listView: false,
            sheet: false,
            metaDataPulled: false,
            headers: [
                {text: '', value: '', align: 'left', configable: false, visible: true, filterable: false},
                {text: 'Name', value: 'filename', align: 'left', configable: false, visible: true},
                {text: 'Filesize', value: 'size', align: 'right', configable: true, visible: false},
                {text: 'Object Height', value: 'object_height', align: 'right', configable: true, visible: true},
                {text: 'Layer Height', value: 'layer_height', align: 'right', configable: true, visible: true},
                {text: 'Filament Usage', value: 'filament_total', align: 'right', configable: true, visible: true},
                {text: 'Print Time', value: 'estimated_time', align: 'right', configable: true, visible: true},
                {text: 'Slicer', value: 'slicer', align: 'right', configable: true, visible: false},
                {text: 'Last modified', value: 'modified', align: 'right', configable: true, visible: true},
            ],
        }
    },
    computed: {
        sortedFiles() {
            return this.sortFiles(this.files, ['modified'], [1]).filter(file => !file.isDirectory)
        },
        sortedDirectories() {
            return this.files.filter(file => file.isDirectory);
        }
    },
    methods: {
        startPrint() {
            let filename = (this.currentPath + "/" + this.dialogPrintFile.item.filename).substring(7);
            this.dialogPrintFile.show = false;
            this.$socket.sendObj('printer.print.start', {filename: filename}, () => {
                this.$router.push('/display/status');
            });
        },
        clickRow: function (item) {
            if (!item.isDirectory) {
                this.dialogPrintFile.item = item;
                this.sheet = !this.sheet;
            } else {
                this.currentPath += "/" + item.filename;
                this.loadPath();
                this.metaDataPulled = false;
            }
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
        preheat() {
            if (
                'first_layer_extr_temp' in this.dialogPrintFile.item &&
                'first_layer_bed_temp' in this.dialogPrintFile.item &&
                !['error', 'printing', 'paused'].includes(this.printer_state)
            ) {
                let gcode = ""
                if (this.dialogPrintFile.item.first_layer_extr_temp > 0) {
                    gcode = "M104 S" + this.dialogPrintFile.item.first_layer_extr_temp
                    this.$store.commit('server/addEvent', {message: gcode, type: 'command'})
                    this.$socket.sendObj('printer.gcode.script', {script: gcode})
                }

                if (this.dialogPrintFile.item.first_layer_bed_temp > 0) {
                    gcode = "M140 S" + this.dialogPrintFile.item.first_layer_bed_temp
                    this.$store.commit('server/addEvent', {message: gcode, type: 'command'})
                    this.$socket.sendObj('printer.gcode.script', {script: gcode})
                }
            }
        },
        removeFile() {
            this.$socket.sendObj('server.files.delete_file', {path: this.currentPath + "/" + this.dialogPrintFile.item.filename}, 'files/getDeleteFile');
        },
        refreshMetadata: function() {
            this.metaDataPulled = true;
            let items = this.sortFiles(this.files, [this.sortBy], [this.sortDesc]);
            items.forEach((item) => {
                if (item && !item.isDirectory && !item.metadataPulled) {
                    let filename = (this.currentPath+"/"+item.filename).substring(7);
                    this.$socket.sendObj("server.files.metadata", { filename: filename }, "files/getMetadata");
                }
            });
        },
    },
    watch: {
        filetree: {
            deep: true,
            handler(){
                if (this.files.length && !this.metaDataPulled) {
                    this.refreshMetadata();
                }
            }
        }
    }
}
</script>