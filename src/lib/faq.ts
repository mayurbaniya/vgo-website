/**
 * The FAQ block on a vehicle page.
 *
 * Every question here is one people actually type into a search box — "what is
 * the mileage of X", "does X have ABS", "what colours does X come in" — and
 * every answer is assembled from a column the catalog already holds. Nothing is
 * written by hand per model, and nothing is invented: a question whose data is
 * missing is simply not asked.
 *
 * The block earns its place twice. It answers the question a shopper scrolled
 * down to find, and it is what a FAQPage structured-data blob is built from,
 * which is how a listing wins the expandable answers under a search result.
 */
import type { IndexedVehicle } from './catalog'
import { displayPrice } from './format'
import { MARKET } from './site'

export interface FaqEntry {
  question: string
  answer: string
}

export function buildFaq(entry: IndexedVehicle): FaqEntry[] {
  const v = entry.vehicle
  const name = entry.title
  const faq: FaqEntry[] = []

  const price = displayPrice(v)
  if (price) {
    faq.push({
      question: `What is the price of the ${name}?`,
      answer:
        `The ${name} is priced at ${price} ex-showroom. On-road price adds ` +
        `state road tax, insurance and registration, and therefore differs by city.`,
    })
  }

  if (entry.ev) {
    if (v.certifiedRange) {
      faq.push({
        question: `What is the range of the ${name}?`,
        answer:
          `The ${name} has a certified range of ${v.certifiedRange}` +
          `${v.batteryCapacity ? ` from a ${v.batteryCapacity} battery` : ''}. ` +
          `Real-world range depends on riding mode, load and terrain.`,
      })
    }
    if (v.chargingTimeStandard || v.chargingTimeFast) {
      const parts = [
        v.chargingTimeStandard ? `${v.chargingTimeStandard} on a standard charger` : null,
        v.chargingTimeFast ? `${v.chargingTimeFast} on fast charging` : null,
      ].filter(Boolean)
      faq.push({
        question: `How long does the ${name} take to charge?`,
        answer: `The ${name} takes ${parts.join(', and ')}.`,
      })
    }
  } else if (v.mileageClaimed) {
    faq.push({
      question: `What is the mileage of the ${name}?`,
      answer:
        `The claimed mileage of the ${name} is ${v.mileageClaimed}` +
        `${v.powerCC ? `, from its ${v.powerCC} cc engine` : ''}. ` +
        `Claimed figures come from the manufacturer and are measured under test ` +
        `conditions, so day-to-day mileage is usually lower.`,
    })
  }

  if (v.brakingType || v.frontBrake) {
    const braking = [
      v.frontBrake ? `a ${v.frontBrake.toLowerCase()} front brake` : null,
      v.rearBrake ? `a ${v.rearBrake.toLowerCase()} rear brake` : null,
    ].filter(Boolean)

    faq.push({
      question: `Does the ${name} have ABS?`,
      answer: entry.abs
        ? `Yes. The ${name} is fitted with ${v.brakingType}` +
          `${braking.length ? `, with ${braking.join(' and ')}` : ''}.`
        : `The ${name} uses ${v.brakingType ?? braking.join(' and ')}` +
          `, not an anti-lock braking system.`,
    })
  }

  if (v.color) {
    const colours = v.color
      .split(/\s*[,/]\s*/)
      .map((c) => c.trim())
      .filter(Boolean)
    if (colours.length > 0) {
      faq.push({
        question: `What colours is the ${name} available in?`,
        answer:
          colours.length === 1
            ? `The ${name} is listed in ${colours[0]}.`
            : `The ${name} is listed in ${colours.slice(0, -1).join(', ')} and ` +
              `${colours[colours.length - 1]}.`,
      })
    }
  }

  if (v.topSpeed) {
    faq.push({
      question: `What is the top speed of the ${name}?`,
      answer:
        `The ${name} has a claimed top speed of ${v.topSpeed}` +
        `${v.accelerationTime ? `, and does ${v.accelerationTime}` : ''}.`,
    })
  }

  if (v.weight || v.seatHeight) {
    const bits = [
      v.weight ? `a kerb weight of ${v.weight}` : null,
      v.seatHeight ? `a seat height of ${v.seatHeight}` : null,
    ].filter(Boolean)

    faq.push({
      question: `Is the ${name} easy to handle for a shorter rider?`,
      answer:
        `The ${name} has ${bits.join(' and ')}. Seat height is the figure that ` +
        `decides whether you can get both feet down — sit on one at a dealership ` +
        `before deciding, since riding position varies as much as the number does.`,
    })
  }

  if (v.freeServiceCount || v.firstServiceKM) {
    const bits = [
      v.freeServiceCount ? `${v.freeServiceCount} free services` : null,
      v.firstServiceKM
        ? `the first at ${v.firstServiceKM}${v.firstServiceDays ? ` or ${v.firstServiceDays}` : ''}`
        : null,
    ].filter(Boolean)

    faq.push({
      question: `What is the service schedule for the ${name}?`,
      answer: `The ${name} comes with ${bits.join(', ')}, whichever comes first.`,
    })
  }

  faq.push({
    question: `Where can I buy the ${name} in ${MARKET}?`,
    answer:
      `Shortlist the ${name} in the VGO app to save it, get told when its price ` +
      `changes and connect with a showroom. Prices on this page are indicative ` +
      `and move with dealer offers.`,
  })

  return faq
}

/**
 * schema.org FAQPage for the block above.
 *
 * Google only shows this markup when the same questions and answers are visible
 * on the page, so both are generated from one array rather than maintained
 * separately — markup that disagrees with the page is a manual action waiting
 * to happen.
 */
export function faqJsonLd(faq: FaqEntry[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: { '@type': 'Answer', text: entry.answer },
    })),
  }
}
