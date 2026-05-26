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
};

export type Deal = {
  id: string;
  title: string;
  cityId: string;
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
};

export type Activity = {
  title: string;
  kind: string;
  description: string;
  priceHint: string;
  image: string;
};
