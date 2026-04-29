/**
 * scripts/seed-ngos.js
 *
 * Pre-seeds the ngos table with ~60 well-known climate-focused organizations
 * across all org_type categories. All are inserted with claimable=true so the
 * real organizations can take over their profiles when they sign up.
 *
 * Safe to re-run: uses ON CONFLICT (slug) DO NOTHING.
 *
 *   node scripts/seed-ngos.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const NGOS = [
  // ============================================================
  // INTERNATIONAL NGOs
  // ============================================================
  {
    slug: 'world-wildlife-fund',
    name: 'World Wildlife Fund',
    org_type: 'international_ngo',
    short_description: 'Conservation organization working to protect natural habitats and species globally.',
    website_url: 'https://www.worldwildlife.org',
    headquarters_city: 'Washington', headquarters_country: 'United States',
    sector_tags: ['forestry', 'water', 'agriculture'],
    geography_focus: ['Global'],
    staff_size: '1000+',
  },
  {
    slug: 'environmental-defense-fund',
    name: 'Environmental Defense Fund',
    org_type: 'international_ngo',
    short_description: 'Solving the most critical environmental problems with science, economics, and law.',
    website_url: 'https://www.edf.org',
    headquarters_city: 'New York', headquarters_country: 'United States',
    sector_tags: ['methane', 'air-quality', 'agriculture', 'industrial-decarbonization'],
    geography_focus: ['United States', 'Europe', 'China'],
    staff_size: '1000+',
  },
  {
    slug: 'sierra-club',
    name: 'Sierra Club',
    org_type: 'international_ngo',
    short_description: 'Largest grassroots environmental organization in the United States.',
    website_url: 'https://www.sierraclub.org',
    headquarters_city: 'Oakland', headquarters_country: 'United States',
    sector_tags: ['solar', 'wind-energy', 'clean-heat'],
    geography_focus: ['United States'],
    staff_size: '201-1000',
  },
  {
    slug: 'natural-resources-defense-council',
    name: 'Natural Resources Defense Council',
    org_type: 'international_ngo',
    short_description: 'Working to safeguard the earth, its people, plants, and animals.',
    website_url: 'https://www.nrdc.org',
    headquarters_city: 'New York', headquarters_country: 'United States',
    sector_tags: ['solar', 'wind-energy', 'transmission', 'permitting'],
    geography_focus: ['United States', 'China', 'Mexico', 'Canada'],
    staff_size: '201-1000',
  },
  {
    slug: 'greenpeace',
    name: 'Greenpeace International',
    org_type: 'international_ngo',
    short_description: 'Independent campaigning organization that uses peaceful protest and creative communication.',
    website_url: 'https://www.greenpeace.org',
    headquarters_city: 'Amsterdam', headquarters_country: 'Netherlands',
    sector_tags: ['solar', 'wind-energy', 'forestry'],
    geography_focus: ['Global'],
    staff_size: '1000+',
  },
  {
    slug: 'conservation-international',
    name: 'Conservation International',
    org_type: 'international_ngo',
    short_description: 'Empowering societies to responsibly and sustainably care for nature.',
    website_url: 'https://www.conservation.org',
    headquarters_city: 'Arlington', headquarters_country: 'United States',
    sector_tags: ['forestry', 'agriculture', 'carbon-credits'],
    geography_focus: ['Global'],
    staff_size: '1000+',
  },
  {
    slug: 'the-nature-conservancy',
    name: 'The Nature Conservancy',
    org_type: 'international_ngo',
    short_description: 'Conserving the lands and waters on which all life depends.',
    website_url: 'https://www.nature.org',
    headquarters_city: 'Arlington', headquarters_country: 'United States',
    sector_tags: ['forestry', 'water', 'carbon-credits'],
    geography_focus: ['Global'],
    staff_size: '1000+',
  },
  {
    slug: 'oxfam-international',
    name: 'Oxfam International',
    org_type: 'international_ngo',
    short_description: 'Global movement of people fighting inequality to end poverty and injustice, including climate justice.',
    website_url: 'https://www.oxfam.org',
    headquarters_city: 'Nairobi', headquarters_country: 'Kenya',
    sector_tags: ['agriculture', 'water', 'environmental-justice'],
    geography_focus: ['Global'],
    staff_size: '1000+',
  },
  {
    slug: 'climate-action-network',
    name: 'Climate Action Network International',
    org_type: 'international_ngo',
    short_description: 'Worldwide network of over 1,900 NGOs in 130 countries promoting climate action.',
    website_url: 'https://climatenetwork.org',
    headquarters_city: 'Beirut', headquarters_country: 'Lebanon',
    sector_tags: ['solar', 'wind-energy', 'environmental-justice'],
    geography_focus: ['Global'],
    staff_size: '11-50',
  },

  // ============================================================
  // INTERGOVERNMENTAL ORGANIZATIONS (IGOs)
  // ============================================================
  {
    slug: 'unfccc',
    name: 'United Nations Framework Convention on Climate Change',
    org_type: 'igo',
    short_description: 'UN body responsible for the global climate change negotiations and the Paris Agreement.',
    website_url: 'https://unfccc.int',
    headquarters_city: 'Bonn', headquarters_country: 'Germany',
    sector_tags: ['carbon-credits', 'disclosure'],
    geography_focus: ['Global'],
    staff_size: '201-1000',
  },
  {
    slug: 'irena',
    name: 'International Renewable Energy Agency',
    org_type: 'igo',
    short_description: 'Intergovernmental agency supporting the transition to sustainable energy.',
    website_url: 'https://www.irena.org',
    headquarters_city: 'Abu Dhabi', headquarters_country: 'United Arab Emirates',
    sector_tags: ['solar', 'wind-energy', 'green-hydrogen', 'geothermal-energy'],
    geography_focus: ['Global'],
    staff_size: '201-1000',
  },
  {
    slug: 'world-bank-group',
    name: 'World Bank Group',
    org_type: 'igo',
    short_description: 'International financial institution providing loans and grants for development including climate.',
    website_url: 'https://www.worldbank.org',
    headquarters_city: 'Washington', headquarters_country: 'United States',
    sector_tags: ['solar', 'wind-energy', 'transmission', 'water', 'agriculture'],
    geography_focus: ['Global'],
    staff_size: '1000+',
  },
  {
    slug: 'ifc',
    name: 'International Finance Corporation',
    org_type: 'igo',
    short_description: 'World Bank Group member focused on private sector investment in developing countries.',
    website_url: 'https://www.ifc.org',
    headquarters_city: 'Washington', headquarters_country: 'United States',
    sector_tags: ['solar', 'wind-energy', 'green-hydrogen', 'industrial-decarbonization'],
    geography_focus: ['Global'],
    staff_size: '1000+',
  },
  {
    slug: 'undp',
    name: 'United Nations Development Programme',
    org_type: 'igo',
    short_description: 'UN agency tasked with sustainable development and climate resilience worldwide.',
    website_url: 'https://www.undp.org',
    headquarters_city: 'New York', headquarters_country: 'United States',
    sector_tags: ['solar', 'agriculture', 'water', 'clean-cooking'],
    geography_focus: ['Global'],
    staff_size: '1000+',
  },
  {
    slug: 'unep',
    name: 'United Nations Environment Programme',
    org_type: 'igo',
    short_description: 'UN authority on environment promoting wise use of natural resources.',
    website_url: 'https://www.unep.org',
    headquarters_city: 'Nairobi', headquarters_country: 'Kenya',
    sector_tags: ['carbon-credits', 'forestry', 'air-quality'],
    geography_focus: ['Global'],
    staff_size: '1000+',
  },
  {
    slug: 'gef',
    name: 'Global Environment Facility',
    org_type: 'igo',
    short_description: 'Multilateral environmental fund providing grants and concessional financing.',
    website_url: 'https://www.thegef.org',
    headquarters_city: 'Washington', headquarters_country: 'United States',
    sector_tags: ['forestry', 'water', 'carbon-credits', 'environmental-justice'],
    geography_focus: ['Global'],
    staff_size: '51-200',
  },
  {
    slug: 'green-climate-fund',
    name: 'Green Climate Fund',
    org_type: 'igo',
    short_description: 'Largest dedicated climate fund supporting developing countries in mitigation and adaptation.',
    website_url: 'https://www.greenclimate.fund',
    headquarters_city: 'Songdo', headquarters_country: 'South Korea',
    sector_tags: ['solar', 'wind-energy', 'agriculture', 'water'],
    geography_focus: ['Global'],
    staff_size: '201-1000',
  },
  {
    slug: 'iea',
    name: 'International Energy Agency',
    org_type: 'igo',
    short_description: 'Intergovernmental organization providing energy policy analysis and data.',
    website_url: 'https://www.iea.org',
    headquarters_city: 'Paris', headquarters_country: 'France',
    sector_tags: ['solar', 'wind-energy', 'nuclear-technologies', 'green-hydrogen'],
    geography_focus: ['Global'],
    staff_size: '201-1000',
  },
  {
    slug: 'asian-development-bank',
    name: 'Asian Development Bank',
    org_type: 'igo',
    short_description: 'Regional development bank supporting climate action across Asia and the Pacific.',
    website_url: 'https://www.adb.org',
    headquarters_city: 'Manila', headquarters_country: 'Philippines',
    sector_tags: ['solar', 'wind-energy', 'transmission', 'electric-vehicles'],
    geography_focus: ['Asia Pacific'],
    staff_size: '1000+',
  },

  // ============================================================
  // FOUNDATIONS
  // ============================================================
  {
    slug: 'bezos-earth-fund',
    name: 'Bezos Earth Fund',
    org_type: 'foundation',
    short_description: '$10 billion commitment to fund scientists, activists, and NGOs fighting climate change.',
    website_url: 'https://www.bezosearthfund.org',
    headquarters_city: 'Washington', headquarters_country: 'United States',
    sector_tags: ['forestry', 'industrial-decarbonization', 'environmental-justice', 'agriculture'],
    geography_focus: ['Global'],
    staff_size: '51-200',
    annual_grants_budget_usd_range: '100M+',
  },
  {
    slug: 'climateworks-foundation',
    name: 'ClimateWorks Foundation',
    org_type: 'foundation',
    short_description: 'Strategic philanthropy bringing climate solutions to scale.',
    website_url: 'https://www.climateworks.org',
    headquarters_city: 'San Francisco', headquarters_country: 'United States',
    sector_tags: ['solar', 'wind-energy', 'industrial-decarbonization', 'electric-vehicles'],
    geography_focus: ['Global'],
    staff_size: '51-200',
    annual_grants_budget_usd_range: '100M+',
  },
  {
    slug: 'hewlett-foundation',
    name: 'William and Flora Hewlett Foundation',
    org_type: 'foundation',
    short_description: 'Major US foundation with significant climate and clean energy program.',
    website_url: 'https://hewlett.org',
    headquarters_city: 'Menlo Park', headquarters_country: 'United States',
    sector_tags: ['solar', 'wind-energy', 'transmission', 'environmental-justice'],
    geography_focus: ['Global'],
    staff_size: '51-200',
    annual_grants_budget_usd_range: '100M+',
  },
  {
    slug: 'rockefeller-brothers-fund',
    name: 'Rockefeller Brothers Fund',
    org_type: 'foundation',
    short_description: 'Promotes social change for a more just, sustainable, and peaceful world.',
    website_url: 'https://www.rbf.org',
    headquarters_city: 'New York', headquarters_country: 'United States',
    sector_tags: ['solar', 'wind-energy', 'environmental-justice'],
    geography_focus: ['United States', 'China', 'Western Balkans'],
    staff_size: '11-50',
    annual_grants_budget_usd_range: '10-100M',
  },
  {
    slug: 'rockefeller-foundation',
    name: 'The Rockefeller Foundation',
    org_type: 'foundation',
    short_description: 'Promoting the well-being of humanity through climate-resilient development.',
    website_url: 'https://www.rockefellerfoundation.org',
    headquarters_city: 'New York', headquarters_country: 'United States',
    sector_tags: ['agriculture', 'solar', 'transmission', 'environmental-justice'],
    geography_focus: ['Global'],
    staff_size: '201-1000',
    annual_grants_budget_usd_range: '100M+',
  },
  {
    slug: 'macarthur-foundation',
    name: 'John D. and Catherine T. MacArthur Foundation',
    org_type: 'foundation',
    short_description: 'Supports creative people, effective institutions, and influential networks for climate solutions.',
    website_url: 'https://www.macfound.org',
    headquarters_city: 'Chicago', headquarters_country: 'United States',
    sector_tags: ['solar', 'wind-energy', 'environmental-justice'],
    geography_focus: ['United States', 'India', 'Nigeria'],
    staff_size: '201-1000',
    annual_grants_budget_usd_range: '100M+',
  },
  {
    slug: 'packard-foundation',
    name: 'David and Lucile Packard Foundation',
    org_type: 'foundation',
    short_description: 'Investing in conservation, science, and people for a healthier planet.',
    website_url: 'https://www.packard.org',
    headquarters_city: 'Los Altos', headquarters_country: 'United States',
    sector_tags: ['water', 'agriculture', 'forestry'],
    geography_focus: ['Global'],
    staff_size: '51-200',
    annual_grants_budget_usd_range: '100M+',
  },
  {
    slug: 'breakthrough-energy',
    name: 'Breakthrough Energy',
    org_type: 'foundation',
    short_description: 'Network founded by Bill Gates accelerating innovation in sustainable energy.',
    website_url: 'https://breakthroughenergy.org',
    headquarters_city: 'Kirkland', headquarters_country: 'United States',
    sector_tags: ['green-hydrogen', 'nuclear-technologies', 'industrial-decarbonization', 'direct-air-capture'],
    geography_focus: ['Global'],
    staff_size: '51-200',
    annual_grants_budget_usd_range: '100M+',
  },
  {
    slug: 'ikea-foundation',
    name: 'IKEA Foundation',
    org_type: 'foundation',
    short_description: 'Independent philanthropic foundation working on renewable energy and climate.',
    website_url: 'https://ikeafoundation.org',
    headquarters_city: 'Leiden', headquarters_country: 'Netherlands',
    sector_tags: ['solar', 'clean-cooking', 'agriculture'],
    geography_focus: ['Global'],
    staff_size: '11-50',
    annual_grants_budget_usd_range: '100M+',
  },
  {
    slug: 'sequoia-climate-foundation',
    name: 'Sequoia Climate Foundation',
    org_type: 'foundation',
    short_description: 'Philanthropy focused on time-bound, results-driven climate action.',
    website_url: 'https://www.sequoiaclimatefoundation.org',
    headquarters_city: 'Irvine', headquarters_country: 'United States',
    sector_tags: ['solar', 'wind-energy', 'industrial-decarbonization'],
    geography_focus: ['Global'],
    staff_size: '11-50',
    annual_grants_budget_usd_range: '100M+',
  },
  {
    slug: 'ballmer-group',
    name: 'Ballmer Group',
    org_type: 'foundation',
    short_description: 'Philanthropy of Connie and Steve Ballmer supporting economic mobility and climate-resilient communities.',
    website_url: 'https://ballmergroup.org',
    headquarters_city: 'Bellevue', headquarters_country: 'United States',
    sector_tags: ['environmental-justice'],
    geography_focus: ['United States'],
    staff_size: '51-200',
    annual_grants_budget_usd_range: '100M+',
  },

  // ============================================================
  // RESEARCH NON-PROFITS / THINK TANKS
  // ============================================================
  {
    slug: 'rocky-mountain-institute',
    name: 'RMI',
    org_type: 'research_nonprofit',
    short_description: 'Independent nonprofit transforming global energy use to create a clean, prosperous, and secure low-carbon future.',
    website_url: 'https://rmi.org',
    headquarters_city: 'Basalt', headquarters_country: 'United States',
    sector_tags: ['solar', 'wind-energy', 'electric-vehicles', 'industrial-decarbonization', 'buildings-efficiency'],
    geography_focus: ['Global'],
    staff_size: '201-1000',
  },
  {
    slug: 'world-resources-institute',
    name: 'World Resources Institute',
    org_type: 'research_nonprofit',
    short_description: 'Global research nonprofit working on climate, energy, food, forests, water, and cities.',
    website_url: 'https://www.wri.org',
    headquarters_city: 'Washington', headquarters_country: 'United States',
    sector_tags: ['forestry', 'water', 'agriculture', 'electric-vehicles'],
    geography_focus: ['Global'],
    staff_size: '1000+',
  },
  {
    slug: 'icct',
    name: 'International Council on Clean Transportation',
    org_type: 'research_nonprofit',
    short_description: 'Independent research providing technical and scientific analysis to environmental regulators.',
    website_url: 'https://theicct.org',
    headquarters_city: 'Washington', headquarters_country: 'United States',
    sector_tags: ['electric-vehicles', 'saf-efuels', 'air-quality'],
    geography_focus: ['Global'],
    staff_size: '51-200',
  },
  {
    slug: 'iddri',
    name: 'IDDRI',
    org_type: 'research_nonprofit',
    short_description: 'Institute for Sustainable Development and International Relations — climate and biodiversity policy research.',
    website_url: 'https://www.iddri.org',
    headquarters_city: 'Paris', headquarters_country: 'France',
    sector_tags: ['agriculture', 'forestry', 'industrial-decarbonization'],
    geography_focus: ['Global'],
    staff_size: '11-50',
  },
  {
    slug: 'energy-innovation',
    name: 'Energy Innovation',
    org_type: 'research_nonprofit',
    short_description: 'Energy and environmental policy firm focused on identifying high-impact climate solutions.',
    website_url: 'https://energyinnovation.org',
    headquarters_city: 'San Francisco', headquarters_country: 'United States',
    sector_tags: ['solar', 'wind-energy', 'transmission', 'industrial-decarbonization'],
    geography_focus: ['United States', 'China', 'India'],
    staff_size: '11-50',
  },
  {
    slug: 'cleanairtaskforce',
    name: 'Clean Air Task Force',
    org_type: 'research_nonprofit',
    short_description: 'Global nonprofit working to safeguard against the worst impacts of climate change.',
    website_url: 'https://www.catf.us',
    headquarters_city: 'Boston', headquarters_country: 'United States',
    sector_tags: ['nuclear-technologies', 'green-hydrogen', 'methane', 'direct-air-capture'],
    geography_focus: ['Global'],
    staff_size: '51-200',
  },
  {
    slug: 'aceee',
    name: 'American Council for an Energy-Efficient Economy',
    org_type: 'research_nonprofit',
    short_description: 'Nonprofit research organization advancing energy efficiency policies, programs, and behaviors.',
    website_url: 'https://www.aceee.org',
    headquarters_city: 'Washington', headquarters_country: 'United States',
    sector_tags: ['buildings-efficiency', 'industrial-decarbonization', 'electric-vehicles'],
    geography_focus: ['United States'],
    staff_size: '51-200',
  },
  {
    slug: 'agora-energiewende',
    name: 'Agora Energiewende',
    org_type: 'research_nonprofit',
    short_description: 'German think tank developing scientifically robust, politically feasible strategies for the energy transition.',
    website_url: 'https://www.agora-energiewende.org',
    headquarters_city: 'Berlin', headquarters_country: 'Germany',
    sector_tags: ['solar', 'wind-energy', 'green-hydrogen', 'transmission'],
    geography_focus: ['Europe'],
    staff_size: '51-200',
  },
  {
    slug: 'e3g',
    name: 'E3G',
    org_type: 'research_nonprofit',
    short_description: 'Independent climate change think tank operating to accelerate the global transition to a climate safe world.',
    website_url: 'https://www.e3g.org',
    headquarters_city: 'London', headquarters_country: 'United Kingdom',
    sector_tags: ['solar', 'wind-energy', 'industrial-decarbonization'],
    geography_focus: ['Global'],
    staff_size: '51-200',
  },
  {
    slug: 'wri-india',
    name: 'WRI India',
    org_type: 'research_nonprofit',
    short_description: 'Research organization advancing sustainable solutions to environmental challenges in India.',
    website_url: 'https://wri-india.org',
    headquarters_city: 'New Delhi', headquarters_country: 'India',
    sector_tags: ['electric-vehicles', 'solar', 'water', 'forestry'],
    geography_focus: ['India'],
    staff_size: '51-200',
  },
  {
    slug: 'cseindia',
    name: 'Centre for Science and Environment',
    org_type: 'research_nonprofit',
    short_description: 'Indian public interest research and advocacy organization.',
    website_url: 'https://www.cseindia.org',
    headquarters_city: 'New Delhi', headquarters_country: 'India',
    sector_tags: ['air-quality', 'water', 'agriculture'],
    geography_focus: ['India'],
    staff_size: '51-200',
  },

  // ============================================================
  // IMPLEMENTATION NON-PROFITS
  // ============================================================
  {
    slug: 'solar-sister',
    name: 'Solar Sister',
    org_type: 'implementation_nonprofit',
    short_description: 'Recruits, trains, and supports women to deliver clean energy directly to homes in rural Africa.',
    website_url: 'https://solarsister.org',
    headquarters_city: 'New York', headquarters_country: 'United States',
    sector_tags: ['solar', 'clean-cooking', 'environmental-justice'],
    geography_focus: ['Nigeria', 'Tanzania', 'Kenya'],
    staff_size: '11-50',
  },
  {
    slug: 'engie-energy-access',
    name: 'ENGIE Energy Access',
    org_type: 'implementation_nonprofit',
    short_description: 'Off-grid solar and clean cooking provider serving 9 African countries.',
    website_url: 'https://engie-energyaccess.com',
    headquarters_city: 'Berlin', headquarters_country: 'Germany',
    sector_tags: ['solar', 'clean-cooking'],
    geography_focus: ['Sub-Saharan Africa'],
    staff_size: '1000+',
  },
  {
    slug: 'sun-king',
    name: 'Sun King',
    org_type: 'implementation_nonprofit',
    short_description: 'Solar energy products for the 1.8 billion people without reliable access to electricity.',
    website_url: 'https://sunking.com',
    headquarters_city: 'Nairobi', headquarters_country: 'Kenya',
    sector_tags: ['solar'],
    geography_focus: ['Sub-Saharan Africa', 'India'],
    staff_size: '1000+',
  },
  {
    slug: 'cool-earth',
    name: 'Cool Earth',
    org_type: 'implementation_nonprofit',
    short_description: 'Working with rainforest communities to halt deforestation.',
    website_url: 'https://www.coolearth.org',
    headquarters_city: 'Truro', headquarters_country: 'United Kingdom',
    sector_tags: ['forestry'],
    geography_focus: ['Peru', 'Papua New Guinea', 'Cameroon'],
    staff_size: '11-50',
  },
  {
    slug: 'rare',
    name: 'Rare',
    org_type: 'implementation_nonprofit',
    short_description: 'Behavior change for the planet, working with local communities on conservation.',
    website_url: 'https://rare.org',
    headquarters_city: 'Arlington', headquarters_country: 'United States',
    sector_tags: ['agriculture', 'forestry', 'water'],
    geography_focus: ['Global'],
    staff_size: '201-1000',
  },
  {
    slug: 'tree-aid',
    name: 'Tree Aid',
    org_type: 'implementation_nonprofit',
    short_description: 'Working with rural communities in Africa to grow trees and beat poverty.',
    website_url: 'https://www.treeaid.org',
    headquarters_city: 'Bristol', headquarters_country: 'United Kingdom',
    sector_tags: ['forestry', 'agriculture'],
    geography_focus: ['Burkina Faso', 'Ethiopia', 'Ghana', 'Mali', 'Niger', 'Senegal'],
    staff_size: '51-200',
  },
  {
    slug: 'gridworks',
    name: 'GridWorks',
    org_type: 'implementation_nonprofit',
    short_description: 'Catalyzes development of utility-scale electricity grids in Africa to enable economic growth.',
    website_url: 'https://gridworks.co.uk',
    headquarters_city: 'London', headquarters_country: 'United Kingdom',
    sector_tags: ['transmission'],
    geography_focus: ['Sub-Saharan Africa'],
    staff_size: '11-50',
  },

  // ============================================================
  // ADVOCACY
  // ============================================================
  {
    slug: '350-org',
    name: '350.org',
    org_type: 'advocacy',
    short_description: 'International grassroots climate movement organizing in over 188 countries.',
    website_url: 'https://350.org',
    headquarters_city: 'Brooklyn', headquarters_country: 'United States',
    sector_tags: ['solar', 'wind-energy', 'environmental-justice'],
    geography_focus: ['Global'],
    staff_size: '51-200',
  },
  {
    slug: 'climate-reality-project',
    name: 'The Climate Reality Project',
    org_type: 'advocacy',
    short_description: 'Founded by Al Gore, training climate leaders worldwide.',
    website_url: 'https://www.climaterealityproject.org',
    headquarters_city: 'Washington', headquarters_country: 'United States',
    sector_tags: ['solar', 'wind-energy', 'environmental-justice'],
    geography_focus: ['Global'],
    staff_size: '51-200',
  },
  {
    slug: 'fridays-for-future',
    name: 'Fridays for Future',
    org_type: 'advocacy',
    short_description: 'International youth-led climate movement that began with Greta Thunberg.',
    website_url: 'https://fridaysforfuture.org',
    headquarters_city: 'Stockholm', headquarters_country: 'Sweden',
    sector_tags: ['environmental-justice'],
    geography_focus: ['Global'],
    staff_size: '1-10',
  },
  {
    slug: 'sunrise-movement',
    name: 'Sunrise Movement',
    org_type: 'advocacy',
    short_description: 'Youth movement to stop climate change and create millions of good jobs in the process.',
    website_url: 'https://www.sunrisemovement.org',
    headquarters_city: 'Washington', headquarters_country: 'United States',
    sector_tags: ['environmental-justice', 'solar', 'wind-energy'],
    geography_focus: ['United States'],
    staff_size: '11-50',
  },
  {
    slug: 'extinction-rebellion',
    name: 'Extinction Rebellion',
    org_type: 'advocacy',
    short_description: 'Global environmental movement using nonviolent civil disobedience.',
    website_url: 'https://rebellion.global',
    headquarters_city: 'London', headquarters_country: 'United Kingdom',
    sector_tags: ['environmental-justice'],
    geography_focus: ['Global'],
    staff_size: '11-50',
  },
  {
    slug: 'union-of-concerned-scientists',
    name: 'Union of Concerned Scientists',
    org_type: 'advocacy',
    short_description: 'Independent science-based advocacy on climate, energy, and environmental issues.',
    website_url: 'https://www.ucsusa.org',
    headquarters_city: 'Cambridge', headquarters_country: 'United States',
    sector_tags: ['solar', 'wind-energy', 'electric-vehicles', 'agriculture'],
    geography_focus: ['United States'],
    staff_size: '201-1000',
  },
  {
    slug: 'evergreen-action',
    name: 'Evergreen Action',
    org_type: 'advocacy',
    short_description: 'Building political power for ambitious, equitable climate action in the United States.',
    website_url: 'https://www.evergreenaction.com',
    headquarters_city: 'Seattle', headquarters_country: 'United States',
    sector_tags: ['solar', 'wind-energy', 'transmission'],
    geography_focus: ['United States'],
    staff_size: '11-50',
  },
];

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase env vars');
    process.exit(1);
  }

  console.log(`Seeding ${NGOS.length} NGOs...\n`);

  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (const ngo of NGOS) {
    const record = {
      ...ngo,
      claimable: true,
      verified: false,
      status: 'active', // pre-seeded NGOs are public-visible immediately, but claimable
    };

    const { error } = await supabase
      .from('ngos')
      .upsert(record, { onConflict: 'slug', ignoreDuplicates: true });

    if (error) {
      console.log(`  ! ${ngo.slug}: ${error.message}`);
      failed += 1;
    } else {
      // Check if it was actually inserted vs already existed
      const { data: existing } = await supabase
        .from('ngos')
        .select('id, claimable, clerk_user_id')
        .eq('slug', ngo.slug)
        .single();

      if (existing) {
        if (existing.clerk_user_id) {
          skipped += 1;
        } else {
          inserted += 1;
        }
      }
    }
  }

  console.log(`\nSeed complete:`);
  console.log(`  Inserted/updated:  ${inserted}`);
  console.log(`  Already claimed:   ${skipped}`);
  console.log(`  Failed:            ${failed}`);

  // Distribution check
  const { data: dist } = await supabase
    .from('ngos')
    .select('org_type')
    .eq('claimable', true);

  if (dist) {
    const counts = {};
    for (const row of dist) counts[row.org_type] = (counts[row.org_type] ?? 0) + 1;
    console.log(`\nDistribution by org_type:`);
    for (const [type, count] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${type.padEnd(28)} ${count}`);
    }
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
