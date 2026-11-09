export type EventStatus = "upcoming" | "latest";

export interface EventItem {
  id: number;
  status: EventStatus;
  title: string;
  location: string;
  date: string;
  time: string;
  description: string;
  /** First picture, kept for existing consumers (e.g. carousels). */
  image: string;
  /** All pictures, shown one by one on the details page. */
  images: string[];
}

// Used whenever an event has no picture yet.
const PLACEHOLDER_IMAGE =
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791293234/612322887_4315845935405170_8954860117997094961_n_gmtw60.jpg";

const NO_TIME = "Time not specified";

type EventInput = Omit<EventItem, "image" | "images"> & { images?: string[] };

const build = (e: EventInput): EventItem => {
  const images = e.images?.length ? e.images : [PLACEHOLDER_IMAGE];
  return { ...e, images, image: images[0] };
};

const EVENT_INPUTS: EventInput[] = [
  /* ───────────── Upcoming (SAMPLE DATA — replace with real events) ───────────── */
  {
    id: 101,
    status: "upcoming",
    title: "Hillside Products Trade Fair",
    location: "SM Megamall, Mandaluyong City",
    date: "December 12–14, 2026",
    time: "10:00 AM – 8:00 PM",
    description:
      "PRIC-MPC will hold a booth at the trade fair to sell and market the Hillside ginger brews and other processed products, bringing locally grown produce to a wider market and supporting the livelihood of its farmer-members.",
  },
  {
    id: 102,
    status: "upcoming",
    title: "PRIC-MPC Annual General Assembly",
    location: "PRIC-MPC, Dolores, Quezon",
    date: "January 30, 2027",
    time: "8:00 AM",
    description:
      "Members of the cooperative gather to review the year's accomplishments, financial reports, and plans for the coming year, and to take part in decisions that shape the cooperative's programs and services.",
  },
  {
    id: 103,
    status: "upcoming",
    title: "Ginger Product Innovation Workshop",
    location: "Dolores Municipal Hall, Dolores, Quezon",
    date: "February 20, 2027",
    time: "9:00 AM – 4:00 PM",
    description:
      "A hands-on workshop for farmer-members on improving the quality, processing, and packaging of ginger-based products, with the aim of developing new value-added offerings from locally grown crops.",
  },
  {
    id: 104,
    status: "upcoming",
    title: "KADIWA Market Day",
    location: "Lucena City, Quezon",
    date: "March 12, 2027",
    time: "7:00 AM – 3:00 PM",
    description:
      "PRIC-MPC joins the KADIWA market day to offer its products directly to consumers, helping small producers reach buyers without middlemen and encouraging support for locally manufactured goods.",
  },
  {
    id: 105,
    status: "upcoming",
    title: "Regional Cooperative Congress",
    location: "Lipa City, Batangas",
    date: "April 8–9, 2027",
    time: "8:30 AM",
    description:
      "Cooperatives from across the region meet to share experiences, learn from best practices, and build partnerships that strengthen community-based enterprises.",
  },

  /* ───────────── Latest (newest first) ───────────── */
  {
    id: 7,
    status: "latest",
    title:
      "Cooperative Development Authority Region V Benchmarking and Best Practices Visit",
    location: "PRIC-MPC, Sitio Bulalakaw, Barangay Pinagdanlayan, Dolores, Quezon",
    date: "September 17, 2025",
    time: NO_TIME,
    images: [
      "https://cda.gov.ph/wp-content/uploads/2025/09/548483581_1170403071852480_1395067646532949795_n-1-300x225.jpg",
    ],
    description:
      'The Cooperative Development Authority Region V, together with cooperative representatives from the six provinces of the Bicol Region, conducted a benchmarking and best practices visit at the Pinagdanlayan Rural Improvement Club Multi-Purpose Cooperative in Dolores, Quezon, on September 17, 2025. The activity formed part of the Coconut Farmers and Industry Development Plan (CFIDP), specifically under the initiative titled "Strengthening Coconut Farmers Cooperatives." The program aimed to empower coconut farmers by providing opportunities to learn from successful cooperative models and observe effective organizational and enterprise practices. PRIC-MPC served as the host cooperative, providing visiting participants with an opportunity to learn about its operations, agricultural livelihood activities, and cooperative enterprise development. The visit demonstrated PRIC\'s growing role as a reference organization for other cooperatives seeking to strengthen their management, production, and community-based business operations.',
  },
  {
    id: 8,
    status: "latest",
    title: "2025 Regional Productivity Olympics Awarding Ceremony",
    location: "Calamba City, Laguna",
    date: "June 17, 2025",
    time: NO_TIME,
    images: ["https://nwpc.dole.gov.ph/wp-content/uploads/2025/06/IVA-300x199.png"],
    description:
      "The 2025 Regional Productivity Olympics recognized nine micro, small, and medium enterprises in CALABARZON for their achievements in productivity improvement and effective business practices. The awarding ceremony was held on June 17, 2025, in Calamba City, Laguna, and was organized through the National Wages and Productivity Commission and the Regional Tripartite Wages and Productivity Board IV-A. PRIC-MPC was among the recognized enterprises under the Industry Sector, alongside other businesses that demonstrated innovation, operational efficiency, and productivity-enhancing practices. The event highlighted the importance of sustainable enterprise development, decent employment, and people-centered business operations. Through this recognition, PRIC-MPC gained regional acknowledgment for its efforts in improving its cooperative enterprise and manufacturing operations. The regional awardees were also designated as official nominees for the National Productivity Olympics, providing an opportunity to represent CALABARZON in the national competition.",
  },
  {
    id: 9,
    status: "latest",
    title: "PRIC-MPC Benchmarking Visit to Bohol Community Multi-Purpose Cooperative",
    location: "Bohol Community MPC, Canduao Occidental, Valencia, Bohol",
    date: "April 24, 2024",
    time: "9:06 AM",
    description:
      "The Pinagdanlayan Rural Improvement Club Multi-Purpose Cooperative participated in a benchmarking visit to the Bohol Community Multi-Purpose Cooperative in Valencia, Bohol, on April 24, 2024. The visit provided an opportunity for cooperative representatives to observe another cooperative's operations, organizational practices, and approaches to enterprise development. Benchmarking activities are important for cooperatives because they encourage knowledge exchange, expose participants to different management strategies, and help identify practices that can be adapted to improve their own organizations. For PRIC-MPC, the engagement represents an opportunity to learn from another established cooperative and explore ways to strengthen its own services, member participation, and business operations. Such inter-cooperative engagements also promote collaboration within the Philippine cooperative sector, allowing organizations from different regions to share experiences and develop stronger community-based enterprises.",
  },
  {
    id: 6,
    status: "latest",
    title: "Root-Crop Knowledge and Product Innovation Activities",
    location: "Dolores, Quezon",
    date: "April 2023",
    time: NO_TIME,
    description:
      "PRIC-MPC's product-development initiatives have involved activities focused on improving the quality, processing, and marketability of locally grown agricultural commodities, particularly root crops such as ginger and turmeric. An April 2023 activity involved knowledge-sharing and product innovation, with the participation of DTI Quezon, Catalyste+, and the Japan International Cooperation Agency. The activity was associated with agricultural production practices, integrated pest management, and the development of value-added products from locally available crops. These initiatives support PRIC's broader approach of connecting agricultural production with food manufacturing, allowing member farmers to benefit from the additional value generated through processing. Products such as ginger brew, turmeric brew, and peanut brittle demonstrate how local agricultural resources can be transformed into consumer goods while creating livelihood opportunities and strengthening the cooperative's agricultural enterprise.",
  },
  {
    id: 5,
    status: "latest",
    title:
      "National Women's Month Celebration – DAR Trade Fair and Cooperative Success Story Presentation",
    location: "Department of Agrarian Reform, Quezon City",
    date: "March 28 – April 3, 2022",
    time: NO_TIME,
    images: [
      "https://mirror.pia.gov.ph/uploads/2022/04/d4ca0ee88a7e6a7a973a181ad16cfd7d-800-1200.jpg",
    ],
    description:
      'The Department of Agrarian Reform conducted its National Women\'s Month activities under the theme "We Make Change Work for Women," recognizing women\'s contributions to agriculture, food security, and community development. As part of the celebration, agrarian reform beneficiaries\' organizations participated in a nationwide trade fair held from March 28 to April 1, 2022, where locally produced agricultural and processed food products were presented to consumers. PRIC-MPC was represented by its General Manager, Cristina Quijano-Generoso, who shared the cooperative\'s experience as an agrarian reform beneficiaries\' organization and discussed its ginger-based product manufacturing activities. She highlighted how the cooperative grows its own ginger and turmeric to maintain a reliable supply of raw materials while generating additional income for farming families. The event provided an opportunity to promote PRIC\'s women-led agricultural enterprise and demonstrate how community-based food processing can support women\'s economic empowerment and rural livelihood development.',
  },
  {
    id: 12,
    status: "latest",
    title: "DAR National Women's Month Trade Fair Participation",
    location: "Department of Agrarian Reform, Quezon City",
    date: "March 28 – April 1, 2022",
    time: NO_TIME,
    images: [
      "https://mirror.pia.gov.ph/uploads/2022/04/d4ca0ee88a7e6a7a973a181ad16cfd7d-800-1200.jpg",
    ],
    description:
      "As part of the Department of Agrarian Reform's National Women's Month celebration, PRIC-MPC participated in a trade fair showcasing locally manufactured products from agrarian reform beneficiaries' organizations across different Philippine regions. The event ran from March 28 to April 1, 2022, and promoted the products and entrepreneurial achievements of agricultural communities. PRIC-MPC's participation provided an opportunity to introduce its ginger-based products and other processed food offerings to a broader audience. The trade fair also served as a platform for connecting agricultural producers with potential customers and supporting the market visibility of small community enterprises. The participation of PRIC-MPC reflected the cooperative's role in promoting women's involvement in agriculture, livelihood generation, and local food manufacturing. It also demonstrated how processed agricultural products can help farming communities diversify their income sources and establish more sustainable business operations.",
  },
  {
    id: 4,
    status: "latest",
    title:
      "DA-4A Enhanced KADIWA Inclusive Food Supply Chain Program – Grant Assistance Awarding",
    location: "Dolores, Quezon",
    date: "April 16, 2021",
    time: NO_TIME,
    images: [
      "https://calabarzon.da.gov.ph/wp-content/uploads/2021/04/dolores_marketing_assistance-scaled.jpg",
    ],
    description:
      "The Department of Agriculture Regional Field Office IV-A awarded grant assistance to the Pinagdanlayan Rural Improvement Club Multi-Purpose Cooperative under the Enhanced KADIWA Inclusive Food Supply Chain Program on April 16, 2021. The initiative aimed to strengthen farmers' cooperatives and associations by improving their capacity to market agricultural commodities and make locally produced food more accessible to consumers. PRIC-MPC received ₱1.25 million in financial assistance, divided into two allocations. The first tranche amounting to ₱871,500 was intended for the procurement of a delivery van, while the remaining ₱378,500 was allocated for agricultural equipment and working capital. The awarding was led by DA-4A OIC-Regional Executive Director Vilma M. Dimaculangan and Quezon Provincial Governor Danilo E. Suarez. This assistance was an important step in improving PRIC's distribution capabilities, strengthening its production operations, and supporting the livelihood of its farmer-members.",
  },
  {
    id: 3,
    status: "latest",
    title: "KADIWA ni Ani at Kita – National Women's Month Agricultural Product Fair",
    location:
      "Lipa Agricultural Research and Experiment Station (LARES), Lipa City, Batangas",
    date: "March 15, 2021",
    time: NO_TIME,
    description:
      "In celebration of National Women's Month, the Department of Agriculture CALABARZON organized the KADIWA ni Ani at Kita agricultural product fair through its Gender and Development Program and Agribusiness and Marketing Assistance Division. Held at the Lipa Agricultural Research and Experiment Station in Lipa City, Batangas, on March 15, 2021, the activity provided women-led farmers' cooperatives and associations with an opportunity to showcase and sell their locally produced agricultural goods. PRIC-MPC participated as one of the exhibiting organizations, presenting its agricultural and processed food products alongside other cooperatives and community enterprises. The event promoted women's economic participation, expanded market access for small agricultural producers, and encouraged consumers to support locally manufactured products. It also provided PRIC-MPC with an opportunity to introduce its products to a wider market and strengthen its visibility within the regional agricultural business community.",
  },
  {
    id: 2,
    status: "latest",
    title: "2017–2018 Regional Gawad Saka Awarding Ceremony",
    location: "Great Eastern Hotel, Quezon City",
    date: "October 12, 2018",
    time: NO_TIME,
    images: [
      "https://calabarzon.da.gov.ph/wp-content/uploads/photo-gallery/imported_from_media_libray/pic2-1%20%281%29.jpg",
    ],
    description:
      "The Department of Agriculture Region IV-A CALABARZON recognized 19 individuals and organizations during the 2017–2018 Regional Gawad Saka Awarding Ceremony held at the Great Eastern Hotel in Quezon City. Among the recognized organizations was the Pinagdanlayan Rural Improvement Club Multi-Purpose Cooperative from Dolores, Quezon, which received the Outstanding Rural Improvement Club distinction. The annual awards program recognizes farmers, fisherfolk, agricultural entrepreneurs, and community organizations that demonstrate significant contributions to agriculture and fisheries development. PRIC's inclusion among the regional awardees reflects its commitment to strengthening rural livelihoods through agricultural production, cooperative enterprise, and value-added food processing. The recognition also placed the cooperative among the organizations acknowledged for their contribution to their respective communities and the agricultural sector of CALABARZON.",
  },
  {
    id: 1,
    status: "latest",
    title:
      "Regional Gawad Saka Awarding Ceremony – Outstanding Rural Improvement Club",
    location: "Batangas Convention Center, Batangas City, Batangas",
    date: "November 2017",
    time: NO_TIME,
    images: [
      "https://calabarzon.da.gov.ph/wp-content/uploads/photo-gallery/imported_from_media_libray/pic2-1%20%281%29.jpg",
    ],
    description:
      "The Pinagdanlayan Rural Improvement Club (RIC) of Dolores, Quezon, received regional recognition as the Outstanding Rural Improvement Club during the 2017 Regional Gawad Saka Awards organized by the Department of Agriculture Region IV-A CALABARZON. The recognition highlighted the organization's contribution to agricultural development, livelihood improvement, and community-based economic activities. PRIC's achievement reflected the importance of rural organizations in helping farming communities improve their productivity and generate additional household income. The cooperative's work in processing agricultural produce, particularly ginger-based products, demonstrated how locally available resources could be transformed into marketable goods. The award also placed PRIC among the recognized rural development organizations in the CALABARZON region, strengthening its reputation as a community-based enterprise contributing to agricultural progress and inclusive rural development.",
  },
  {
    id: 10,
    status: "latest",
    title: "Ginger Syrup Product Launching",
    location: "Dolores, Quezon",
    date: "Date not available",
    time: NO_TIME,
    description:
      "PRIC-MPC's product-development initiatives include the launching of ginger syrup, an activity undertaken in partnership with the Japan International Cooperation Agency (JICA). The initiative reflects the cooperative's continuing efforts to maximize the value of locally cultivated ginger by developing processed products beyond its established ginger brew offerings. Product innovation allows agricultural cooperatives to diversify their merchandise, reach different consumer markets, and create additional income opportunities for their farmer-members. The development of ginger syrup is particularly relevant to PRIC's agricultural enterprise because ginger is one of the primary crops cultivated by its members and serves as an important raw material for its food-processing operations. This activity also illustrates how international development partnerships can support local agricultural enterprises through product development, technical knowledge, and opportunities for improved market competitiveness.",
  },
  {
    id: 11,
    status: "latest",
    title: "Cooperative Business Management Training",
    location: "Dolores, Quezon",
    date: "Date not available",
    time: NO_TIME,
    description:
      "PRIC-MPC has been involved in capacity-building initiatives intended to improve the management and sustainability of its cooperative enterprise. One documented partnership identifies a business management training program conducted in collaboration with Catalyste+. The training is relevant to the cooperative's operations because its business activities involve agricultural production, food processing, marketing, financial services, and member-oriented enterprise management. Developing business management capabilities helps cooperative leaders improve financial planning, operational decision-making, resource allocation, and the coordination of production and marketing activities. These skills are particularly important for community-based agricultural enterprises that need to balance commercial sustainability with their responsibility to provide livelihood opportunities and services to their members. The partnership demonstrates PRIC-MPC's engagement with development organizations to strengthen its institutional and entrepreneurial capabilities.",
  },
];

export const EVENTS: EventItem[] = EVENT_INPUTS.map(build);

export const UPCOMING_EVENTS: EventItem[] = EVENTS.filter(
  (e) => e.status === "upcoming",
);

export const LATEST_EVENTS: EventItem[] = EVENTS.filter(
  (e) => e.status === "latest",
);

export const getEventById = (id: number): EventItem | undefined =>
  EVENTS.find((e) => e.id === id);