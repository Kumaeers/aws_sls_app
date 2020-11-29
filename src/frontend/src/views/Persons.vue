<template>
  <div class="ion-page">
    <ion-header>
      <ion-toolbar>
        <ion-title>Persons</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-list v-bind:key="person.Id" v-for="person in persons">
        <ion-item>
          <ion-label>{{ person.FirstName }} {{ person.LastName }}</ion-label>
          <ion-button @click="deleteUser(person.Id)" full>delete</ion-button>
        </ion-item>
      </ion-list>
    </ion-content>
  </div>
</template>

<script>
import axios from "axios";
const baseUrl = process.env.VUE_APP_API_BASE_URL;
export default {
  name: "persons",
  data() {
    return {
      persons: null,
    };
  },
  // 監視プロパティとして$routeの変更を検知して、reloadする
  // 生成後にまた遷移した場合など
  watch: {
    $route: "reload",
  },
  // ライフサイクルイベントで生成時にリロード
  async created() {
    await this.reload();
  },
  methods: {
    async reload() {
      console.log(baseUrl);
      if (this.$route.fullPath == "/persons") {
        try {
          // GETで一覧取得
          const response = await axios.get(`${baseUrl}persons`);
          this.persons = response.data;
        } catch (e) {
          console.log(e);
        }
      }
    },
    async deleteUser(id) {
      try {
        // DELETEでurlパラメータで渡されたidのpersonを削除
        await axios.delete(`${baseUrl}persons/${id}`);
      } catch (e) {
        console.log(e);
      }
      // 削除後に再度一覧を取得する
      await this.reload();
    },
  },
};
</script>