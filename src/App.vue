<template>
  <v-app>
    <v-card class="mx-auto" min-width="300">
      <v-toolbar color="secondary">
        <!-- <v-btn icon="mdi-menu" variant="text"></v-btn> -->

        <v-toolbar-title>{{ (btDev != null) ? btDev.name : "" }}</v-toolbar-title>

        <v-spacer></v-spacer>

        <v-btn icon="mdi-bluetooth-connect" @pointerup="recon" variant="text"></v-btn>
        <!-- <v-btn icon="mdi-close" :disabled="(btDev != null) ? btDev.gatt.connected : true" @click="btDev.gatt.disconnect();" variant="text"></v-btn> -->

        <!-- <v-btn icon="mdi-view-module" variant="text"></v-btn> -->
      </v-toolbar>
      <v-dialog v-model="dialog" max-width="500px">
        <v-card>
          <v-card-title>
            <span class="text-h5">Изменить {{ (chsdts[editedIndex].desc).toLowerCase() }}</span>
          </v-card-title>
          <v-card-text>
            <v-container>
              <v-row>
                <v-col cols="12">
                  <v-text-field v-model="chsdts[editedIndex].value" type="number" label="Введите новое значение"
                    clearable></v-text-field>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue-darken-1" variant="text" @click="dialog = false">
              Отмена
            </v-btn>
            <v-btn color="blue-darken-1" variant="text" @click="onEdit">
              Изменить
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-snackbar v-model="snackshow" :timeout="2000" class="elevation-24" color="deep-purple-accent-4">{{ snackText }}
        <strong>{{ snackStrongText }}</strong>!</v-snackbar>
      <v-list lines="two">
        <!-- <v-list-subheader inset>Folders</v-list-subheader> -->

        <v-list-item v-for="chsdt in chsdts" :key="chsdt.desc" :subtitle="chsdt.value" :title="chsdt.desc">
          <template v-slot:append>
            <v-btn color="grey-lighten-1" icon="mdi-pencil" :disabled="chsdt.eddis" @click="editItem(chsdt)"
              variant="text"></v-btn>
          </template>
        </v-list-item>
      </v-list>
    </v-card>
  </v-app>
</template>

<script>
export default {
  data: () => ({
    btDev: null,
    manualConn: false,
    i: 0,
    chs: null,
    chsdts: [],
    editedIndex: null,
    editedItem: "",
    dialog: false,
    snackshow: false,
    snackText: "",
    snackStrongText: ""
  }),
  methods: {
    snktxt(snackText, snackStrongText) {
      this.snackText = snackText;
      this.snackStrongText = snackStrongText;
    },
    onEdit() {
      this.chs[this.editedIndex].writeValue(new TextEncoder().encode(this.chsdts[this.editedIndex].value)).then(() => { this.snktxt("Новое значение ", 'установлено'); this.snackshow = true; });
      this.dialog = false;
    },
    editItem(item) {
      this.editedIndex = this.chsdts.indexOf(item);
      this.dialog = true;
    },
    readCharacteristics: async function () {
      try {
        if (this.i < this.chs.length) {
          const v = await this.chs[this.i].readValue();
          const descriptor = await this.chs[this.i].getDescriptor('19b10000-e8f2-537e-4f6c-d104768a1214');
          const dV = await descriptor.readValue();
          // const descValue = await descriptor.readValue();
          const chsdt = {
            eddis: !this.chs[this.i].properties.write,
            desc: new TextDecoder().decode(dV.buffer),
            value: new TextDecoder().decode(v.buffer)
          }
          this.chsdts.push(chsdt);
          if (this.chs[this.i].properties.notify) {
            const li = this.i;
            this.chs[this.i].addEventListener('characteristicvaluechanged', (evt, err) => {
              if (err) {
                console.log('error: ', err);
                return;
              }
              this.chsdts[li].value = new TextDecoder().decode(evt.target.value);
            });
            this.chs[this.i].startNotifications();
          }
          this.i++;
          this.readCharacteristics();
        }
        else {
          // this.chs[this.i - 1].writeValue(new TextEncoder().encode("215")).then(() => { console.log("New value is written!") })
          this.i = 0;
        }
      }
      catch (error) {
        console.log(error);
      }
    },
    recon: function () {
      if (this.btDev != null) {
        if (this.btDev.gatt.connected) {
          this.manualConn = true;
          this.btDev.gatt.disconnect();
        }
      } else this.reqdev();
    },
    ondisc: function () {
        this.chsdts = [];
        this.btDev = null;
        this.snktxt("Устройство ", "отключено");
        this.snackshow = true;
      if (this.manualConn) {
        this.manualConn = false;
        this.reqdev();
      }
    },
    reqdev: async function () {
      try {
        this.btDev = await navigator.bluetooth.requestDevice({
          filters: [{
            services: ['19b10000-e8f2-537e-4f6c-d104768a1214']
          }]
        });
        this.btDev.addEventListener('gattserverdisconnected', this.ondisc);
        const server = await this.btDev.gatt.connect();
        const service = await server.getPrimaryService('19b10000-e8f2-537e-4f6c-d104768a1214');
        this.chs = await service.getCharacteristics("19b10000-e8f2-537e-4f6c-d104768a1214");
        this.readCharacteristics();
      }
      catch (error) {
        console.log(error);
      }
    }
  },


}
</script>
