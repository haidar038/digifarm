import { useState, useEffect, useCallback } from "react";

export interface LocationItem {
    code: string;
    name: string;
}

const CORS_PROXY = "https://api.allorigins.win/raw?url=";
const BASE_URL = "https://wilayah.id/api";

export function useLocation() {
    // Data states
    const [provinces, setProvinces] = useState<LocationItem[]>([]);
    const [regencies, setRegencies] = useState<LocationItem[]>([]);
    const [districts, setDistricts] = useState<LocationItem[]>([]);
    const [villages, setVillages] = useState<LocationItem[]>([]);

    // Selection states
    const [provinceCode, setProvinceCode] = useState<string>("");
    const [regencyCode, setRegencyCode] = useState<string>("");
    const [districtCode, setDistrictCode] = useState<string>("");
    const [villageCode, setVillageCode] = useState<string>("");

    // Loading states
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingRegencies, setLoadingRegencies] = useState(false);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [loadingVillages, setLoadingVillages] = useState(false);

    // Fetch Provinces
    useEffect(() => {
        const fetchProvinces = async () => {
            setLoadingProvinces(true);
            try {
                const response = await fetch(`${CORS_PROXY}${encodeURIComponent(`${BASE_URL}/provinces.json`)}`);
                const data = await response.json();
                setProvinces(data.data || []);
            } catch (error) {
                console.error("Failed to fetch provinces:", error);
            } finally {
                setLoadingProvinces(false);
            }
        };

        fetchProvinces();
    }, []);

    // Fetch Regencies when Province changes
    useEffect(() => {
        if (!provinceCode) {
            setRegencies([]);
            return;
        }

        const fetchRegencies = async () => {
            setLoadingRegencies(true);
            try {
                const response = await fetch(`${CORS_PROXY}${encodeURIComponent(`${BASE_URL}/regencies/${provinceCode}.json`)}`);
                const data = await response.json();
                setRegencies(data.data || []);
            } catch (error) {
                console.error("Failed to fetch regencies:", error);
            } finally {
                setLoadingRegencies(false);
            }
        };

        fetchRegencies();
    }, [provinceCode]);

    // Fetch Districts when Regency changes
    useEffect(() => {
        if (!regencyCode) {
            setDistricts([]);
            return;
        }

        const fetchDistricts = async () => {
            setLoadingDistricts(true);
            try {
                const response = await fetch(`${CORS_PROXY}${encodeURIComponent(`${BASE_URL}/districts/${regencyCode}.json`)}`);
                const data = await response.json();
                setDistricts(data.data || []);
            } catch (error) {
                console.error("Failed to fetch districts:", error);
            } finally {
                setLoadingDistricts(false);
            }
        };

        fetchDistricts();
    }, [regencyCode]);

    // Fetch Villages when District changes
    useEffect(() => {
        if (!districtCode) {
            setVillages([]);
            return;
        }

        const fetchVillages = async () => {
            setLoadingVillages(true);
            try {
                const response = await fetch(`${CORS_PROXY}${encodeURIComponent(`${BASE_URL}/villages/${districtCode}.json`)}`);
                const data = await response.json();
                setVillages(data.data || []);
            } catch (error) {
                console.error("Failed to fetch villages:", error);
            } finally {
                setLoadingVillages(false);
            }
        };

        fetchVillages();
    }, [districtCode]);

    // Handlers
    const handleProvinceChange = useCallback((code: string) => {
        setProvinceCode(code);
        setRegencyCode("");
        setDistrictCode("");
        setVillageCode("");
    }, []);

    const handleRegencyChange = useCallback((code: string) => {
        setRegencyCode(code);
        setDistrictCode("");
        setVillageCode("");
    }, []);

    const handleDistrictChange = useCallback((code: string) => {
        setDistrictCode(code);
        setVillageCode("");
    }, []);

    const handleVillageChange = useCallback((code: string) => {
        setVillageCode(code);
    }, []);

    // Helper for setting initial/default values (e.g. for editing)
    const setLocation = useCallback((pCode: string, rCode?: string, dCode?: string, vCode?: string) => {
        setProvinceCode(pCode);
        if (rCode) setRegencyCode(rCode);
        if (dCode) setDistrictCode(dCode);
        if (vCode) setVillageCode(vCode);
    }, []);

    const setDefaultTernate = useCallback(() => {
        // Ternate codes: Province 82 (Maluku Utara), Regency 82.71 (Kota Ternate)
        // We set codes directly, effects will trigger fetching
        setProvinceCode("82");
        setTimeout(() => setRegencyCode("82.71"), 100);
    }, []);

    return {
        // Data
        provinces,
        regencies,
        districts,
        villages,

        // Selected codes
        provinceCode,
        regencyCode,
        districtCode,
        villageCode,

        // Loading states
        loadingProvinces,
        loadingRegencies,
        loadingDistricts,
        loadingVillages,

        // Handlers
        handleProvinceChange,
        handleRegencyChange,
        handleDistrictChange,
        handleVillageChange,
        setLocation,
        setDefaultTernate,
    };
}
