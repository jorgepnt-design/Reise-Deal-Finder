import type { Activity, City } from "../types/travel";

export const cities: City[] = [
  {
    id: "lisbon",
    name: "Lissabon",
    country: "Portugal",
    airportCode: "LIS",
    heroImage: "https://commons.wikimedia.org/wiki/Special:FilePath/Lisbon%20%28praca%20do%20comercio%29%20-%20Flickr%20-%20Stavrarg%20%281%29.jpg?width=1800",
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
    id: "naples",
    name: "Neapel",
    country: "Italien",
    airportCode: "NAP",
    heroImage: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1800&q=85",
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
      description: "Früh starten, dann ist die historische Strecke durch Alfama deutlich entspannter.",
      priceHint: "ab 3 EUR",
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Tram%20in%20Lisbon%20%28Unsplash%29.jpg?width=900",
      url: "https://www.visitlisboa.com/en/places/tram-28",
    },
    {
      title: "Pasteis de Belem",
      kind: "Food",
      description: "Perfekt als kurzer Stopp nach Mosteiro dos Jeronimos und Torre de Belem.",
      priceHint: "ab 2 EUR",
      image: "https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=900&q=80",
      url: "https://pasteisdebelem.pt/en/",
    },
    {
      title: "Miradouro da Senhora do Monte",
      kind: "Ausblick",
      description: "Sonnenuntergang mit weitem Blick über die Stadt und den Tejo.",
      priceHint: "kostenlos",
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Lisbon%20%28praca%20do%20comercio%29%20-%20Flickr%20-%20Stavrarg%20%281%29.jpg?width=900",
      url: "https://www.visitlisboa.com/en/places/miradouro-da-senhora-do-monte",
    },
    {
      title: "Tagestrip nach Sintra",
      kind: "Ausflug",
      description: "Pena-Palast, Quinta da Regaleira und Waldlandschaft in einem Tagesfenster.",
      priceHint: "ab 12 EUR Bahn",
      image: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&w=900&q=80",
      url: "https://visitsintra.travel/en",
    },
  ],
  porto: [
    {
      title: "Ribeira und Dom-Luis-Brücke",
      kind: "Spaziergang",
      description: "Beste Route am späten Nachmittag mit Blick auf Vila Nova de Gaia.",
      priceHint: "kostenlos",
      image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=900&q=80",
      url: "https://visitporto.travel/en-GB/poi/5cd04b86f979e000010e4f4d",
    },
    {
      title: "Portwein-Keller",
      kind: "Tasting",
      description: "Kleine Tour mit Verkostung, gut kombinierbar mit Abendessen am Fluss.",
      priceHint: "ab 18 EUR",
      image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80",
      url: "https://www.visitportugal.com/en/content/port-wine",
    },
    {
      title: "Livraria Lello",
      kind: "Kultur",
      description: "Ticket vorab buchen und direkt zur ersten Slot-Zeit gehen.",
      priceHint: "ab 8 EUR",
      image: "https://images.unsplash.com/photo-1526243741027-444d633d7365?auto=format&fit=crop&w=900&q=80",
      url: "https://www.livrarialello.pt/en",
    },
    {
      title: "Foz do Douro",
      kind: "Meer",
      description: "Mit der Tram ans Meer und danach frischen Fisch essen.",
      priceHint: "ab 4 EUR",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
      url: "https://visitporto.travel/en-GB/poi/5cd04b86f979e000010e4f50",
    },
  ],
  barcelona: [],
  rome: [],
  naples: [
    {
      title: "Centro Storico und Spaccanapoli",
      kind: "Altstadt",
      description: "Durch enge Gassen, Kirchen und kleine Bars laufen, am besten vormittags starten.",
      priceHint: "kostenlos",
      image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=900&q=80",
      url: "https://www.visitnaples.eu/en/neapolitanity/discover-naples/naples-historic-centre",
    },
    {
      title: "Pizza in der Via dei Tribunali",
      kind: "Food",
      description: "Klassische neapolitanische Pizza dort essen, wo die Warteschlange schnell rotiert.",
      priceHint: "ab 7 EUR",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80",
      url: "https://www.visitnaples.eu/en/neapolitanity/discover-naples/neapolitan-pizza",
    },
    {
      title: "Vomero und Castel Sant'Elmo",
      kind: "Ausblick",
      description: "Mit der Funicolare hochfahren und den Blick über Golf, Altstadt und Vesuv mitnehmen.",
      priceHint: "ab 2 EUR",
      image: "https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?auto=format&fit=crop&w=900&q=80",
      url: "https://www.visitnaples.eu/en/neapolitanity/discover-naples/castel-sant-elmo-and-certosa-di-san-martino",
    },
    {
      title: "Pompeji oder Vesuv",
      kind: "Ausflug",
      description: "Tagesausflug mit Bahn oder Shuttle, gut planbar als kompletter Kultur- und Naturtag.",
      priceHint: "ab 18 EUR",
      image: "https://images.unsplash.com/photo-1598275277521-1885382d523a?auto=format&fit=crop&w=900&q=80",
      url: "https://pompeiisites.org/en/",
    },
  ],
  paris: [],
};

activitiesByCity.barcelona = activitiesByCity.lisbon.map((activity) => ({
  ...activity,
  title: activity.title.replace("Alfama", "Gotisches Viertel"),
  url: `https://www.barcelonaturisme.com/wv3/en/search/results.html?q=${encodeURIComponent(activity.title)}`,
}));
activitiesByCity.rome = activitiesByCity.lisbon.map((activity) => ({
  ...activity,
  title: activity.title.replace("Tram 28 und Alfama", "Kolosseum und Monti"),
  url: `https://www.turismoroma.it/en/search?search=${encodeURIComponent(activity.title)}`,
}));
activitiesByCity.paris = activitiesByCity.lisbon.map((activity) => ({
  ...activity,
  title: activity.title.replace("Tram 28 und Alfama", "Montmartre und Seine"),
  url: `https://parisjetaime.com/eng/search?search=${encodeURIComponent(activity.title)}`,
}));
