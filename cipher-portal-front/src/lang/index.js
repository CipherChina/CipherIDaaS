import Vue from 'vue'
import VueI18n from 'vue-i18n'
import en from './en'
import zh from './zh'


Vue.use(VueI18n);

const messages = {en,zh}

const i18n = new VueI18n({
  locale: localStorage.getItem('lang')|| 'zh', // set locale
  messages // set locale messages
})

export default i18n