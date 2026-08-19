/**
 * Types mirroring the Spring Boot API. Field names are taken from the Flutter
 * client's model classes (testf/lib/services/models/*), which are the de-facto
 * contract — the backend has no OpenAPI output in prod (springdoc is disabled).
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

  description?: string
}

export interface Offer {
  id?: number
  title?: string
  description?: string
  imageURL?: string
  status?: number
}

export interface NewsArticle {
  id?: number
  title?: string
  description?: string
  imageURL?: string
  url?: string
  publishedAt?: string
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
