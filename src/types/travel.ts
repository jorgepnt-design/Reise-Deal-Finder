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
  dateFlexDays: 0 | 1 | 2 | 3;
  outboundTimeWindow: "any" | "morning" | "midday" | "evening";
  returnTimeWindow: "any" | "morning" | "midday" | "evening";
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
  hotelName?: string;
  hotelDistrict?: string;
  hotelAddress?: string;
  hotelMapsUrl?: string;
  packageProvider?: string;
  packageUrl?: string;
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

export type FlightOption = {
  id: string;
  offerId?: string;
  cityId: string;
  originAirport: string;
  destinationAirport: string;
  flightType: "roundTrip" | "oneWay";
  outboundDate: string;
  returnDate?: string;
  outboundDeparture: string;
  outboundArrival: string;
  returnDeparture?: string;
  returnArrival?: string;
  airline: string;
  directFlight: boolean;
  includesCarryOn: boolean;
  includesCheckedBag: boolean;
  pricePerPerson: number;
  totalPrice: number;
  source: string;
  bookingUrl: string;
  isLive?: boolean;
};

export type DuffelCheckoutOffer = {
  offerId: string;
  totalAmount: string;
  totalCurrency: string;
  expiresAt?: string;
  airline: string;
  passengers: Array<{
    id: string;
    type: string;
    label: string;
  }>;
};

export type DuffelPassengerInput = {
  title: "mr" | "mrs";
  givenName: string;
  familyName: string;
  bornOn: string;
  email: string;
  phoneNumber: string;
};

export type DuffelOrderResult = {
  id: string;
  bookingReference: string;
  totalAmount: string;
  totalCurrency: string;
  status: string;
};

export type LiveTravelData = {
  deals: Deal[];
  flights: FlightOption[];
};

export type Activity = {
  title: string;
  kind: string;
  description: string;
  priceHint: string;
  image: string;
  url: string;
};
