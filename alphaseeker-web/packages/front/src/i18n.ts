import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import locales
import esCommon from './assets/locales/es/common.json';
import enCommon from './assets/locales/en/common.json';
import frCommon from './assets/locales/fr/common.json';
import deCommon from './assets/locales/de/common.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            es: { translation: esCommon },
            en: { translation: enCommon },
            fr: { translation: frCommon },
            de: { translation: deCommon }
        },
        fallbackLng: 'es',
        interpolation: {
            escapeValue: false // React already escapes values
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage']
        }
    });

export default i18n;
