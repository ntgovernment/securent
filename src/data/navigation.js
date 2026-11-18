import { secureNTUrl } from "../config/site-url.mjs";

export const primaryNavigation = [
  {
    label: "Alerts and warnings",
    href: secureNTUrl("/alerts-and-warnings"),
  },
  {
    label: "Current warnings",
    href: "/current-warnings",
  },
  {
    label: "Prepare",
    href: secureNTUrl("/prepare-for-an-emergency"),
    description: "Knowing what needs to be done makes it easier for you to stay safe in an emergency.",
    children: [
      {
        label: "Emergency planning",
        href: secureNTUrl("/prepare-for-an-emergency/emergency-planning"),
        children: [
          { label: "Emergency plans", href: secureNTUrl("/prepare-for-an-emergency/emergency-planning/emergency-plans") },
          { label: "Emergency kits", href: secureNTUrl("/prepare-for-an-emergency/emergency-planning/emergency-kits") },
          { label: "Emergency shelters", href: secureNTUrl("/prepare-for-an-emergency/emergency-planning/emergency-shelters") },
          { label: "Caring for pets", href: secureNTUrl("/prepare-for-an-emergency/emergency-planning/caring-for-pets") },
          { label: "Caring for infants", href: secureNTUrl("/prepare-for-an-emergency/emergency-planning/caring-for-infants") },
          { label: "Prepare your business for an emergency", href: secureNTUrl("/prepare-for-an-emergency/emergency-planning/prepare-your-business-for-an-emergency") },
          { label: "Emergency sign language videos", href: secureNTUrl("/prepare-for-an-emergency/emergency-planning/emergency-sign-language-videos") },
          { label: "Get insurance", href: secureNTUrl("/prepare-for-an-emergency/emergency-planning/get-insurance") },
        ],
      },
      {
        label: "Weather events",
        href: secureNTUrl("/prepare-for-an-emergency/weather-events"),
        children: [
          { label: "Cyclones", href: secureNTUrl("/prepare-for-an-emergency/weather-events/cyclone") },
          { label: "Flooding", href: secureNTUrl("/prepare-for-an-emergency/weather-events/flooding") },
          { label: "Heatwave", href: secureNTUrl("/prepare-for-an-emergency/weather-events/heatwave") },
          { label: "Earthquakes", href: secureNTUrl("/prepare-for-an-emergency/weather-events/earthquakes") },
          { label: "Droughts", href: secureNTUrl("/prepare-for-an-emergency/weather-events/droughts") },
          { label: "Severe storms", href: secureNTUrl("/prepare-for-an-emergency/weather-events/severe-storms") },
          { label: "Tsunamis", href: secureNTUrl("/prepare-for-an-emergency/weather-events/tsunamis") },
        ],
      },
      {
        label: "Fires",
        href: secureNTUrl("/prepare-for-an-emergency/fires"),
        children: [
          { label: "House fires", href: secureNTUrl("/prepare-for-an-emergency/fires/house-fires") },
          { label: "Bushfires", href: secureNTUrl("/prepare-for-an-emergency/fires/bushfires") },
        ],
      },
      { label: "Health emergencies", href: secureNTUrl("/prepare-for-an-emergency/health-emergencies") },
      {
        label: "Terrorism and foreign interference",
        href: secureNTUrl("/prepare-for-an-emergency/terrorism-and-foreign-interference"),
        children: [
          { label: "What you can do", href: secureNTUrl("/prepare-for-an-emergency/terrorism-and-foreign-interference/what-you-can-do") },
          { label: "What happens if there is a terrorist incident", href: secureNTUrl("/prepare-for-an-emergency/terrorism-and-foreign-interference/what-happens-if-there-is-a-terrorist-incident") },
          { label: "Countering violent extremism", href: secureNTUrl("/prepare-for-an-emergency/terrorism-and-foreign-interference/countering-violent-extremism") },
          { label: "Crowded places", href: secureNTUrl("/prepare-for-an-emergency/terrorism-and-foreign-interference/crowded-places") },
          { label: "Cyber security", href: secureNTUrl("/prepare-for-an-emergency/terrorism-and-foreign-interference/cyber-security") },
          { label: "Counter-terrorism", href: secureNTUrl("/prepare-for-an-emergency/terrorism-and-foreign-interference/counter-terrorism") },
          { label: "Espionage and foreign interference", href: secureNTUrl("/prepare-for-an-emergency/terrorism-and-foreign-interference/espionage-and-foreign-interference") },
        ],
      },
      { label: "Biosecurity", href: secureNTUrl("/prepare-for-an-emergency/biosecurity") },
    ],
  },
  {
    label: "Respond",
    href: secureNTUrl("/respond"),
    children: [
      { label: "Listen to radio updates", href: secureNTUrl("/respond/listen-to-radio-updates") },
      { label: "Emergency contact numbers", href: secureNTUrl("/respond/emergency-contact-numbers") },
      { label: "Find a hospital", href: secureNTUrl("/respond/find-a-hospital") },
      { label: "Get weather updates", href: secureNTUrl("/respond/get-weather-updates") },
      { label: "Emergency Alert", href: secureNTUrl("/respond/emergency-alert") },
      {
        label: "Active events",
        href: secureNTUrl("/respond/current-events"),
        children: [
          { label: "Alice Springs severe weather update", href: secureNTUrl("/respond/current-events/alice-springs-severe-weather-update") },
        ],
      },
    ],
  },
  {
    label: "Recover",
    href: secureNTUrl("/recover"),
    children: [
      {
        label: "Staying safe",
        href: secureNTUrl("/recover/staying-safe"),
        children: [
          { label: "Food safety and power outages", href: secureNTUrl("/recover/staying-safe/food-safety-and-power-outages") },
          { label: "Swimming pools", href: secureNTUrl("/recover/staying-safe/swimming-pools") },
          { label: "Water", href: secureNTUrl("/recover/staying-safe/water") },
          { label: "Food", href: secureNTUrl("/recover/staying-safe/food") },
          { label: "Fishing", href: secureNTUrl("/recover/staying-safe/fishing") },
          { label: "Sporting activities", href: secureNTUrl("/recover/staying-safe/sporting-activities") },
          { label: "Staying safe around flood waters", href: secureNTUrl("/recover/staying-safe/staying-safe-around-flood-waters") },
          { label: "Infectious diseases", href: secureNTUrl("/recover/staying-safe/infectious-diseases") },
          { label: "Hazards after an emergency or disaster event", href: secureNTUrl("/recover/staying-safe/hazards-after-an-emergency-or-disaster-event") },
        ],
      },
      {
        label: "Getting help",
        href: secureNTUrl("/recover/getting-help"),
        children: [
          { label: "Who to contact after a fire or disaster", href: secureNTUrl("/recover/getting-help/who-to-contact-after-a-fire-or-disaster") },
          { label: "Emotional and psychological support", href: secureNTUrl("/recover/getting-help/emotional-and-psychological-support") },
          { label: "Financial help", href: secureNTUrl("/recover/getting-help/financial-help") },
          { label: "Northern Territory disaster impact survey", href: secureNTUrl("/recover/getting-help/northern-territory-disaster-impact-survey") },
        ],
      },
      { label: "After cyclones", href: secureNTUrl("/recover/after-cyclones") },
      {
        label: "After floods",
        href: secureNTUrl("/recover/after-floods"),
        children: [
          { label: "Returning home", href: secureNTUrl("/recover/after-floods/returning-home") },
          { label: "Private water supplies after a flood", href: secureNTUrl("/recover/after-floods/private-water-supplies-after-a-flood") },
          { label: "Swimming pools", href: secureNTUrl("/recover/after-floods/swimming-pools") },
          { label: "Your garden", href: secureNTUrl("/recover/after-floods/your-garden") },
          { label: "On-site wastewater systems", href: secureNTUrl("/recover/after-floods/on-site-wastewater-systems") },
          { label: "Cleaning up", href: secureNTUrl("/recover/after-floods/cleaning-up") },
          { label: "Repairs", href: secureNTUrl("/recover/after-floods/repairs") },
        ],
      },
      { label: "Recovering pets and animals", href: secureNTUrl("/recover/recovering-pets-and-animals") },
      { label: "Food businesses", href: secureNTUrl("/recover/food-businesses") },
      { label: "Active recoveries and past events", href: secureNTUrl("/recover/active-recoveries-and-past-events") },
      { label: "Donating goods for emergencies", href: secureNTUrl("/recover/donating-goods-for-emergencies") },
      { label: "Active recoveries", href: secureNTUrl("/recover/active-recoveries") },
    ],
  },
];