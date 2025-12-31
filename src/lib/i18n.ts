import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Commodity translation mapping
const commodityTranslations: Record<string, string> = {
    "Red Chili": "Cabai Merah",
    "Rawit Chili": "Cabai Rawit",
    Tomatoes: "Tomat",
    Shallots: "Bawang Merah",
    Garlic: "Bawang Putih",
    Others: "Lainnya",
};

/**
 * Translate commodity name to Indonesian
 * @param name - Commodity name in English
 * @returns Indonesian translation or original name if not found
 */
export function translateCommodity(name: string): string {
    return commodityTranslations[name] || name;
}

// Indonesian translations
const resources = {
    id: {
        translation: {
            // Status translations
            status: {
                // Land status
                active: "Aktif",
                vacant: "Kosong",
                archived: "Diarsipkan",
                // Production status
                planted: "Ditanam",
                growing: "Bertumbuh",
                harvested: "Dipanen",
            },
            // Commodity translations
            commodity: commodityTranslations,
            // Common labels
            common: {
                loading: "Memuat...",
                error: "Terjadi kesalahan",
                save: "Simpan",
                cancel: "Batal",
                delete: "Hapus",
                edit: "Edit",
                add: "Tambah",
                close: "Tutup",
                search: "Cari",
                filter: "Filter",
                clear: "Hapus",
                noData: "Tidak ada data",
            },
        },
    },
};

i18n.use(initReactI18next).init({
    resources,
    lng: "id", // Default language is Indonesian
    fallbackLng: "id",
    interpolation: {
        escapeValue: false, // React already escapes values
    },
});

export default i18n;
