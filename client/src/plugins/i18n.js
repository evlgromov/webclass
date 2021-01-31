import Vue from "vue";
import VueI18n from "vue-i18n";
import en from "./locales/en.json";
import ru from "./locales/ru.json";

Vue.use(VueI18n);

const userLang = (navigator.language || navigator.userLanguage).slice(0,2);

export default new VueI18n({
    locale: (userLang)? userLang : "en",
    fallbackLocale: (userLang)? userLang : "en",
    messages: {
        en:en,
        ru:ru
    }
});
