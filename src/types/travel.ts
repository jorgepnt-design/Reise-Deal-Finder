export type City = {
  id: string;
  name: string;
  country: string;
  airportCode: string;
  heroImage: string;
};

export type SearchState = {
  cityId: string;
  startDate: string;
  endDate: string;
  budget: number;
  people: number;
  alertsEnabled: boolean;
  tripMode: "package" | "flight";
  flightType: "roundTrip" | "oneWay";
  originAirport: string;
  directOnly: boolean;
  durationFilter: "any" | "short" | "medium" | "long";
  weekendOnly: boolean;
  minHotelRating: number;
  baggage: "personal" | "carryOn" | "checked";
  flexibleSearch: "exact" | "july" | "longWeekend" | "under500";
};

export type Deal = {
  id: string;
  title: string;
  cityId: string;
  destinationAirport: string;
  originAirport: string;
  originName: string;
  tripMode: "package" | "flight";
  flightType: "roundTrip" | "oneWay";
  image: string;
  startDate: string;
  endDate: string;
  people: number;
  budget: number;
  flightPrice: number;
  hotelPrice: number;
  totalPrice: number;
  hotelRating: number;
  score: number;
  priceDropPercent: number;
  bookingUrl: string;
  hotelUrl?: string;
  notes: string[];
  directFlight: boolean;
  durationNights: number;
  includesCarryOn: boolean;
  includesCheckedBag: boolean;
  hotelRefundable: boolean;
  flightSource: string;
  hotelSource?: string;
  lastCheckedAt: string;
  priceHistory: number[];
  isLive: boolean;
};

export type DateRecommendation = {
  id: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  savingPercent: number;
  originAirport: string;
  originName: string;
};

export type Activity = {
  title: string;
  kind: string;
  description: string;
  priceHint: string;
  image: string;
};
