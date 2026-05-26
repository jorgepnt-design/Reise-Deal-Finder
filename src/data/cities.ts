import type { Activity, City } from "../types/travel";

export const cities: City[] = [
  {
    id: "lisbon",
    name: "Lissabon",
    country: "Portugal",
    airportCode: "LIS",
    heroImage: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&w=1800&q=85",
  },
  {
    id: "porto",
    name: "Porto",
    country: "Portugal",
    airportCode: "OPO",
    heroImage: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1800&q=85",
  },
  {
    id: "barcelona",
    name: "Barcelona",
    country: "Spanien",
    airportCode: "BCN",
    heroImage: "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=1800&q=85",
  },
  {
    id: "rome",
    name: "Rom",
    country: "Italien",
    airportCode: "FCO",
    heroImage: "https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=1800&q=85",
  },
  {
    id: "paris",
    name: "Paris",
    country: "Frankreich",
    airportCode: "CDG",
    heroImage: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1800&q=85",
  },
];

export const activitiesByCity: Record<string, Activity[]> = {
  lisbon: [
    {
      title: "Tram 28 und Alfama",
      kind: "Klassiker",
      description: "Frueh starten, dann ist die historische Strecke durch Alfama deutlich entspannter.",
      priceHint: "ab 3 EUR",
      image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=900&q=80",
    },
    {
      title: "Pasteis de Belem",
      kind: "Food",
      description: "Perfekt als kurzer Stopp nach Mosteiro dos Jeronimos und Torre de Belem.",
      priceHint: "ab 2 EUR",
      image: "https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=900&q=80",
    },
    {
      title: "Miradouro da Senhora do Monte",
      kind: "Ausblick",
      description: "Sonnenuntergang mit weitem Blick ueber die Stadt und den Tejo.",
      priceHint: "kostenlos",
      image: "https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=900&q=80",
    },
    {
      title: "Tagestrip nach Sintra",
      kind: "Ausflug",
      description: "Pena-Palast, Quinta da Regaleira und Waldlandschaft in einem Tagesfenster.",
      priceHint: "ab 12 EUR Bahn",
      image: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&w=900&q=80",
    },
  ],
  porto: [
    {
      title: "Ribeira und Dom-Luis-Bruecke",
      kind: "Spaziergang",
      description: "Beste Route am spaeten Nachmittag mit Blick auf Vila Nova de Gaia.",
      priceHint: "kostenlos",
      image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=900&q=80",
    },
    {
      title: "Portwein-Keller",
      kind: "Tasting",
      description: "Kleine Tour mit Verkostung, gut kombinierbar mit Abendessen am Fluss.",
      priceHint: "ab 18 EUR",
      image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80",
    },
    {
      title: "Livraria Lello",
      kind: "Kultur",
      description: "Ticket vorab buchen und direkt zur ersten Slot-Zeit gehen.",
      priceHint: "ab 8 EUR",
      image: "https://images.unsplash.com/photo-1526243741027-444d633d7365?auto=format&fit=crop&w=900&q=80",
    },
    {
      title: "Foz do Douro",
      kind: "Meer",
      description: "Mit der Tram ans Meer und danach frischen Fisch essen.",
      priceHint: "ab 4 EUR",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
    },
  ],
  barcelona: [],
  rome: [],
  paris: [],
};

activitiesByCity.barcelona = activitiesByCity.lisbon.map((activity) => ({ ...activity, title: activity.title.replace("Alfama", "Gotisches Viertel") }));
activitiesByCity.rome = activitiesByCity.lisbon.map((activity) => ({ ...activity, title: activity.title.replace("Tram 28 und Alfama", "Kolosseum und Monti") }));
activitiesByCity.paris = activitiesByCity.lisbon.map((activity) => ({ ...activity, title: activity.title.replace("Tram 28 und Alfama", "Montmartre und Seine") }));
