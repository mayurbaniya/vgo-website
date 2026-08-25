/**
 * Types mirroring the Spring Boot API.
 *
 * The site reads the anonymous /public/v1 surface, whose shapes are defined by
 * the DTOs in com.wheely.dto.publicapi — those are the contract for everything
 * below. Vehicle and Brand keep the field names the Flutter client established
 * (testf/lib/services/models/*), since the public DTOs mirror the entities key
 * for key. The backend has no OpenAPI output in prod (springdoc is disabled).
 *
 * Nearly everything is optional on purpose. The catalog is admin-entered and
 * sparsely filled: most spec fields are null for most vehicles, so the UI has
 * to treat absence as the normal case rather than an error.
 */

/** Every endpoint wraps its payload in this envelope. */
export interface ApiEnvelope<T> {
  msg?: string
  status?: 'SUCCESS' | 'FAILED' | string
  data?: T
}

/** Spring `Page` as flattened by the backend's Response mapper. */
export interface Paged<T> {
  content?: T[]
  pageNumber?: number
  pageSize?: number
  totalElements?: number
  totalPages?: number
  lastPage?: boolean
  /** Admin-facing counters; present on vehicle pages, unused by the site. */
  activeElements?: number
  inactiveElements?: number
}

export interface Brand {
  id?: number
  name?: string
  /** JSON key is `imageURL`, not `imageUrl`. */
  imageURL?: string
  status?: number
  /** Admin-set popularity 1-10; null when unrated. */
  rating?: number
}

export interface Vehicle {
  id?: number
  model?: string
  manufacturingYear?: string
  color?: string
  /** Free text, e.g. "85000-89000" or "240000 - 245000". */
  priceRange?: string
  /** Single headline price, e.g. "87000". Often disagrees with priceRange. */
  price?: string
  variant?: string
  launchDate?: string
  brand?: Brand | null
  images?: string[]
  status?: number

  /**
   * A string, not a boolean — and the column holds FOUR different truthy/falsy
   * spellings in live data: 'Y', 'N', 'true', 'false'. Always go through
   * isElectric() in format.ts rather than comparing directly.
   */
  isElectric?: string
  /**
   * Body type. Live values: STREET, SPORTS, SCOOTER, MOFET, ELECTRIC.
   * MOFET is the legacy scooter code — both it and SCOOTER are in use.
   */
  vehicleType?: string

  // Engine / performance
  topSpeed?: string
  /** Note the casing: the JSON key is `powerCC`, not `powerCc`. */
  powerCC?: number
  engineType?: string
  maxTorque?: string
  cylinderCount?: number
  startType?: string
  fuelCapacity?: string
  gearCount?: number
  accelerationTime?: string
  mileageClaimed?: string
  mileageUser?: string
  fuelType?: string
  /** "4-stroke" / "2-stroke". */
  stroke?: string
  reserveFuelCapacity?: string
  /** Bajaj's idle start-stop system. Boolean on the wire, null on most rows. */
  i3sTechnology?: boolean

  // EV-only — null on petrol vehicles
  batteryCapacity?: string
  batteryType?: string
  certifiedRange?: string
  chargingTimeStandard?: string
  chargingTimeFast?: string
  fastCharging?: boolean
  motorPower?: string
  motorType?: string
  batteryWarranty?: string
  ridingModes?: string
  regenerativeBraking?: boolean

  // Brakes / chassis
  frontBrake?: string
  rearBrake?: string
  brakingType?: string
  wheelsType?: string
  seatType?: string
  weight?: string | number | null
  seatHeight?: string | number | null
  chassisType?: string | number | null
  overallHeight?: string | number | null
  frontWheelSize?: string | number | null
  rearWheelSize?: string | number | null
  tyreType?: string | number | null

  // Convenience
  keyType?: string
  bluetooth?: boolean
  bootLight?: boolean
  chargingPort?: boolean
  freeServiceCount?: number
  /* Service schedule. Free text: "500 km", "30 days". */
  firstServiceKM?: string
  firstServiceDays?: string
  secondServiceKM?: string
  secondServiceDays?: string

  description?: string
}

export interface Offer {
  id?: number
  title?: string
  /** Headline benefit shown big on the card, e.g. "Up to Rs 7,000 off". */
  benefitText?: string
  description?: string
  termsAndConditions?: string
  imageURL?: string
  /** DISCOUNT, EXCHANGE_BONUS, ... */
  offerType?: string
  /** Set when the offer is scoped to one brand; absent for app-wide offers. */
  brandId?: number
  /** Set when the offer is scoped to one model. */
  vehicleId?: number
  startsAt?: string
  endsAt?: string
}

/**
 * One syndicated news item.
 *
 * The feed carries no image and no stable id, so there is deliberately no
 * `imageURL` or `id` here — the cards key off `url` and render text only.
 */
export interface NewsArticle {
  title?: string
  description?: string
  /** External article URL; the cards link out to it with rel=nofollow. */
  url?: string
  /** Publisher name, e.g. "Autocar India". */
  source?: string
  /** Upstream RFC-822 date string, unparsed. */
  publishedAt?: string
  /** bikes | scooters | cars */
  category?: string
}

export interface City {
  id?: number
  name?: string
  status?: number
}

/** A vehicle plus the URL slug it is reachable at. */
export interface VehicleWithHref extends Vehicle {
  href: string
}

/**
 * One owner review, as published by /public/v1/vehicles/{id}/reviews.
 *
 * Mirrors PublicReviewDto. The reviewer's internal id and the moderation
 * status are deliberately absent from that DTO — only visible reviews are ever
 * served — so there is nothing here to filter on the client.
 */
export interface Review {
  id?: number
  /** 1-5. */
  rating?: number
  comment?: string
  /** Display name. Blank on older rows. */
  reviewer?: string
  /** ISO timestamp. */
  created?: string
}

/** Aggregate rating for one vehicle. Mirrors PublicReviewSummaryDto. */
export interface ReviewSummary {
  averageRating?: number
  totalReviews?: number
  fiveStar?: number
  fourStar?: number
  threeStar?: number
  twoStar?: number
  oneStar?: number
}
