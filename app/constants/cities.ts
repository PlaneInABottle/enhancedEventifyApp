import type { TurkishCity } from "@/services/profile/profileTypes"
import type { DropdownOption } from "@/components/Dropdown"

/**
 * Turkish cities for user profile location selection
 * Ordered by population size (largest first)
 */
export const TURKISH_CITIES: TurkishCity[] = [
  "İstanbul",
  "Ankara", 
  "İzmir",
  "Bursa",
  "Antalya",
  "Adana",
  "Konya",
  "Gaziantep",
  "Kayseri",
  "Eskişehir",
  "Diyarbakır",
  "Samsun",
  "Denizli",
  "Şanlıurfa",
  "Adapazarı",
  "Malatya",
  "Kahramanmaraş",
  "Erzurum",
  "Van",
  "Batman",
  "Elazığ",
  "İzmit",
  "Manisa",
  "Sivas",
  "Gebze",
  "Balıkesir",
  "Tarsus",
  "Kütahya",
  "Trabzon",
  "Çorum",
  "Other"
]

/**
 * Creates dropdown options for Turkish cities
 * Note: Translation for "Other" should be handled by the consumer
 */
export const createTurkishCityOptions = (otherLabel: string): DropdownOption<TurkishCity>[] => [
  ...TURKISH_CITIES.slice(0, -1).map(city => ({
    label: city,
    value: city
  })),
  { label: otherLabel, value: "Other" }
]