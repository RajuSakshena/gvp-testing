import React from "react";

// images are in src/our-partner
import AIILSG from "./our-partner/AIILSG.jpeg";
import AnvitiFoundation from "./our-partner/Anviti Foundation.png";
import CFSD from "./our-partner/cfsd.jpeg";
import GlobalShapers from "./our-partner/Global-Shapers-Nagpur.jpeg";
import NMC from "./our-partner/Nagpur_Municipal_Corporation_logo.png";
import TMI from "./our-partner/TMI.png";
import YuvaRuralAssociation from "./our-partner/YuvaRuralAssociation.png";

const partners = [
  {
    name: "All India Institute of Local Self Government (AIILSG)",
    logo: AIILSG,
    description:
      "AIILSG is a national institution focused on strengthening municipal governance through training, research, and capacity building for urban local bodies.",
  },
  {
    name: "Anviti Foundation",
    logo: AnvitiFoundation,
    description:
      "Anviti Foundation is a non-governmental organization (NGO) based in Nagpur, Maharashtra, primarily focused on environmental conservation and social welfare initiatives, with a strong emphasis on waste management across various parts of Nagpur.",
  },
  {
    name: "Centre for Social Development (CFSD)",
    logo: CFSD,
    description:
      "Centre for Social Development (CFSD) works towards inclusive urban and social development through research, capacity building, and community-based initiatives.",
  },
  {
    name: "Global Shapers Community – Nagpur",
    logo: GlobalShapers,
    description:
      "Global Shapers Community – Nagpur, an initiative of the World Economic Forum, drives youth-led social impact projects in sustainability, civic engagement, and inclusive growth.",
  },
  {
    name: "Nagpur Municipal Corporation (NMC)",
    logo: NMC,
    description:
      "Nagpur Municipal Corporation (NMC) is responsible for urban governance and service delivery in Nagpur, partnering on sanitation, waste management, and digital governance initiatives.",
  },
  {
    name: "The Metropolitan Institute (TMI)",
    logo: TMI,
    description:
      "The Metropolitan Institute (TMI) is a social impact think-and-do-tank that works at the confluence of government, civil society, and the market. TMI works on capacity building with government and non-profits, drives philanthropy and giving programs, builds and co-creates tech for good, and enables catalytic social impact environments spanning across gender, climate, education, waste management, safety, local governance, and technology for social impact.",
  },
  {
    name: "Yuva Rural Association",
    logo: YuvaRuralAssociation,
    description:
      "Yuva Rural Association undertakes a wide range of activities starting from creating livelihood opportunities for the poor, protecting vulnerable people from violence and social discrimination, to making the government schemes available to the people through policy advocacy and lobbying.",
  },
];

const Partner = () => {
  return (
    <section className="bg-gray-50 py-14 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-600 mb-10">
          Our Partners
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {partners.map((partner, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-lg shadow-md border border-gray-100"
            >
              <div className="h-20 mb-6 flex items-center justify-center">
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="max-h-full object-contain"
                />
              </div>

              <h3 className="text-xl font-semibold text-blue-500 mb-4 text-center">
                {partner.name}
              </h3>

              <p className="text-gray-600 text-sm leading-relaxed text-justify">
                {partner.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Partner;
