import { useEffect } from "react";
import { useLocation as useLocationHook } from "@/hooks/useLocation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface LocationSelectProps {
    onLocationChange: (location: { provinceCode: string; provinceName: string; regencyCode: string; regencyName: string; districtCode: string; districtName: string; villageCode: string; villageName: string }) => void;
    defaultToTernate?: boolean;
}

export function LocationSelect({ onLocationChange, defaultToTernate = true }: LocationSelectProps) {
    const {
        provinces,
        regencies,
        districts,
        villages,
        provinceCode,
        regencyCode,
        districtCode,
        villageCode,
        loadingProvinces,
        loadingRegencies,
        loadingDistricts,
        loadingVillages,
        handleProvinceChange,
        handleRegencyChange,
        handleDistrictChange,
        handleVillageChange,
        setDefaultTernate,
    } = useLocationHook();

    // Set default to Ternate on mount
    useEffect(() => {
        if (defaultToTernate) {
            setDefaultTernate();
        }
    }, [defaultToTernate, setDefaultTernate]);

    // Notify parent when location changes
    useEffect(() => {
        const selectedProvince = provinces.find((p) => p.code === provinceCode);
        const selectedRegency = regencies.find((r) => r.code === regencyCode);
        const selectedDistrict = districts.find((d) => d.code === districtCode);
        const selectedVillage = villages.find((v) => v.code === villageCode);

        onLocationChange({
            provinceCode,
            provinceName: selectedProvince?.name || "",
            regencyCode,
            regencyName: selectedRegency?.name || "",
            districtCode,
            districtName: selectedDistrict?.name || "",
            villageCode,
            villageName: selectedVillage?.name || "",
        });
    }, [provinceCode, regencyCode, districtCode, villageCode, provinces, regencies, districts, villages, onLocationChange]);

    return (
        <div className="space-y-4">
            {/* Province Select */}
            <div className="space-y-2">
                <Label htmlFor="province">Provinsi</Label>
                <Select value={provinceCode} onValueChange={handleProvinceChange} disabled={loadingProvinces}>
                    <SelectTrigger id="province">{loadingProvinces ? <Loader2 className="h-4 w-4 animate-spin" /> : <SelectValue placeholder="Pilih Provinsi" />}</SelectTrigger>
                    <SelectContent>
                        {provinces.map((province) => (
                            <SelectItem key={province.code} value={province.code}>
                                {province.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Regency/City Select */}
            <div className="space-y-2">
                <Label htmlFor="regency">Kabupaten/Kota</Label>
                <Select value={regencyCode} onValueChange={handleRegencyChange} disabled={!provinceCode || loadingRegencies}>
                    <SelectTrigger id="regency">{loadingRegencies ? <Loader2 className="h-4 w-4 animate-spin" /> : <SelectValue placeholder="Pilih Kabupaten/Kota" />}</SelectTrigger>
                    <SelectContent>
                        {regencies.map((regency) => (
                            <SelectItem key={regency.code} value={regency.code}>
                                {regency.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* District Select */}
            <div className="space-y-2">
                <Label htmlFor="district">Kecamatan</Label>
                <Select value={districtCode} onValueChange={handleDistrictChange} disabled={!regencyCode || loadingDistricts}>
                    <SelectTrigger id="district">{loadingDistricts ? <Loader2 className="h-4 w-4 animate-spin" /> : <SelectValue placeholder="Pilih Kecamatan" />}</SelectTrigger>
                    <SelectContent>
                        {districts.map((district) => (
                            <SelectItem key={district.code} value={district.code}>
                                {district.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Village Select */}
            <div className="space-y-2">
                <Label htmlFor="village">Desa / Kelurahan</Label>
                <Select value={villageCode} onValueChange={handleVillageChange} disabled={!districtCode || loadingVillages}>
                    <SelectTrigger id="village">{loadingVillages ? <Loader2 className="h-4 w-4 animate-spin" /> : <SelectValue placeholder="Pilih Desa/Kelurahan" />}</SelectTrigger>
                    <SelectContent>
                        {villages.map((village) => (
                            <SelectItem key={village.code} value={village.code}>
                                {village.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
