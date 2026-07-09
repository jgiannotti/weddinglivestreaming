// US state data for state landing pages (/wedding-live-streaming-[state])
// Top cities per state are used in "Find Vendors in Your City" sections.

export interface StateInfo {
  name: string;
  slug: string;        // /wedding-live-streaming-[slug]
  abbreviation: string;
  topCities: string[];
}

export const US_STATES: StateInfo[] = [
  { name: 'Alabama',        slug: 'alabama',        abbreviation: 'AL', topCities: ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville'] },
  { name: 'Alaska',         slug: 'alaska',         abbreviation: 'AK', topCities: ['Anchorage', 'Fairbanks', 'Juneau'] },
  { name: 'Arizona',        slug: 'arizona',        abbreviation: 'AZ', topCities: ['Phoenix', 'Tucson', 'Mesa', 'Scottsdale', 'Sedona'] },
  { name: 'Arkansas',       slug: 'arkansas',       abbreviation: 'AR', topCities: ['Little Rock', 'Fayetteville', 'Hot Springs'] },
  { name: 'California',     slug: 'california',     abbreviation: 'CA', topCities: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'Napa', 'Santa Barbara'] },
  { name: 'Colorado',       slug: 'colorado',       abbreviation: 'CO', topCities: ['Denver', 'Boulder', 'Colorado Springs', 'Aspen', 'Vail'] },
  { name: 'Connecticut',    slug: 'connecticut',    abbreviation: 'CT', topCities: ['Hartford', 'New Haven', 'Stamford'] },
  { name: 'Delaware',       slug: 'delaware',       abbreviation: 'DE', topCities: ['Wilmington', 'Dover', 'Rehoboth Beach'] },
  { name: 'Florida',        slug: 'florida',        abbreviation: 'FL', topCities: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale', 'Sarasota', 'Naples', 'St. Augustine'] },
  { name: 'Georgia',        slug: 'georgia',        abbreviation: 'GA', topCities: ['Atlanta', 'Savannah', 'Augusta', 'Athens'] },
  { name: 'Hawaii',         slug: 'hawaii',         abbreviation: 'HI', topCities: ['Honolulu', 'Maui', 'Kauai', 'Big Island'] },
  { name: 'Idaho',          slug: 'idaho',          abbreviation: 'ID', topCities: ['Boise', 'Coeur d\'Alene', 'Sun Valley'] },
  { name: 'Illinois',       slug: 'illinois',       abbreviation: 'IL', topCities: ['Chicago', 'Naperville', 'Springfield'] },
  { name: 'Indiana',        slug: 'indiana',        abbreviation: 'IN', topCities: ['Indianapolis', 'Fort Wayne', 'Bloomington'] },
  { name: 'Iowa',           slug: 'iowa',           abbreviation: 'IA', topCities: ['Des Moines', 'Cedar Rapids', 'Iowa City'] },
  { name: 'Kansas',         slug: 'kansas',         abbreviation: 'KS', topCities: ['Wichita', 'Overland Park', 'Kansas City'] },
  { name: 'Kentucky',       slug: 'kentucky',       abbreviation: 'KY', topCities: ['Louisville', 'Lexington', 'Bowling Green'] },
  { name: 'Louisiana',      slug: 'louisiana',      abbreviation: 'LA', topCities: ['New Orleans', 'Baton Rouge', 'Lafayette', 'Shreveport'] },
  { name: 'Maine',          slug: 'maine',          abbreviation: 'ME', topCities: ['Portland', 'Bar Harbor', 'Kennebunkport'] },
  { name: 'Maryland',       slug: 'maryland',       abbreviation: 'MD', topCities: ['Baltimore', 'Annapolis', 'Frederick'] },
  { name: 'Massachusetts',  slug: 'massachusetts',  abbreviation: 'MA', topCities: ['Boston', 'Cambridge', 'Cape Cod', 'Worcester'] },
  { name: 'Michigan',       slug: 'michigan',       abbreviation: 'MI', topCities: ['Detroit', 'Grand Rapids', 'Ann Arbor', 'Traverse City'] },
  { name: 'Minnesota',      slug: 'minnesota',      abbreviation: 'MN', topCities: ['Minneapolis', 'St. Paul', 'Duluth'] },
  { name: 'Mississippi',    slug: 'mississippi',    abbreviation: 'MS', topCities: ['Jackson', 'Gulfport', 'Biloxi'] },
  { name: 'Missouri',       slug: 'missouri',       abbreviation: 'MO', topCities: ['St. Louis', 'Kansas City', 'Springfield'] },
  { name: 'Montana',        slug: 'montana',        abbreviation: 'MT', topCities: ['Billings', 'Missoula', 'Bozeman'] },
  { name: 'Nebraska',       slug: 'nebraska',       abbreviation: 'NE', topCities: ['Omaha', 'Lincoln'] },
  { name: 'Nevada',         slug: 'nevada',         abbreviation: 'NV', topCities: ['Las Vegas', 'Reno', 'Lake Tahoe'] },
  { name: 'New Hampshire',  slug: 'new-hampshire',  abbreviation: 'NH', topCities: ['Manchester', 'Portsmouth', 'Concord'] },
  { name: 'New Jersey',     slug: 'new-jersey',     abbreviation: 'NJ', topCities: ['Newark', 'Jersey City', 'Atlantic City', 'Princeton'] },
  { name: 'New Mexico',     slug: 'new-mexico',     abbreviation: 'NM', topCities: ['Albuquerque', 'Santa Fe', 'Las Cruces'] },
  { name: 'New York',       slug: 'new-york',       abbreviation: 'NY', topCities: ['New York City', 'Brooklyn', 'Hudson Valley', 'Long Island', 'Buffalo'] },
  { name: 'North Carolina', slug: 'north-carolina', abbreviation: 'NC', topCities: ['Charlotte', 'Raleigh', 'Asheville', 'Wilmington'] },
  { name: 'North Dakota',   slug: 'north-dakota',   abbreviation: 'ND', topCities: ['Fargo', 'Bismarck'] },
  { name: 'Ohio',           slug: 'ohio',           abbreviation: 'OH', topCities: ['Columbus', 'Cleveland', 'Cincinnati'] },
  { name: 'Oklahoma',       slug: 'oklahoma',       abbreviation: 'OK', topCities: ['Oklahoma City', 'Tulsa', 'Norman'] },
  { name: 'Oregon',         slug: 'oregon',         abbreviation: 'OR', topCities: ['Portland', 'Bend', 'Eugene'] },
  { name: 'Pennsylvania',   slug: 'pennsylvania',   abbreviation: 'PA', topCities: ['Philadelphia', 'Pittsburgh', 'Lancaster'] },
  { name: 'Rhode Island',   slug: 'rhode-island',   abbreviation: 'RI', topCities: ['Providence', 'Newport'] },
  { name: 'South Carolina', slug: 'south-carolina', abbreviation: 'SC', topCities: ['Charleston', 'Columbia', 'Greenville', 'Hilton Head'] },
  { name: 'South Dakota',   slug: 'south-dakota',   abbreviation: 'SD', topCities: ['Sioux Falls', 'Rapid City'] },
  { name: 'Tennessee',      slug: 'tennessee',      abbreviation: 'TN', topCities: ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga'] },
  { name: 'Texas',          slug: 'texas',          abbreviation: 'TX', topCities: ['Austin', 'Dallas', 'Houston', 'San Antonio', 'Fort Worth'] },
  { name: 'Utah',           slug: 'utah',           abbreviation: 'UT', topCities: ['Salt Lake City', 'Park City', 'Moab'] },
  { name: 'Vermont',        slug: 'vermont',        abbreviation: 'VT', topCities: ['Burlington', 'Stowe', 'Manchester'] },
  { name: 'Virginia',       slug: 'virginia',       abbreviation: 'VA', topCities: ['Richmond', 'Virginia Beach', 'Charlottesville', 'Alexandria'] },
  { name: 'Washington',     slug: 'washington',     abbreviation: 'WA', topCities: ['Seattle', 'Tacoma', 'Spokane', 'Bellingham'] },
  { name: 'West Virginia',  slug: 'west-virginia',  abbreviation: 'WV', topCities: ['Charleston', 'Morgantown'] },
  { name: 'Wisconsin',      slug: 'wisconsin',      abbreviation: 'WI', topCities: ['Milwaukee', 'Madison', 'Green Bay'] },
  { name: 'Wyoming',        slug: 'wyoming',        abbreviation: 'WY', topCities: ['Cheyenne', 'Jackson Hole'] },
];

export function getStateBySlug(slug: string) {
  return US_STATES.find((s) => s.slug === slug);
}

export function getStateByName(name: string) {
  return US_STATES.find((s) => s.name.toLowerCase() === name.toLowerCase());
}

export function getStateByAbbreviation(code: string) {
  return US_STATES.find((s) => s.abbreviation === code.toUpperCase());
}
