import React from "react";

const About = () => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-6 text-gray-600">
        About the Bharat Garbage Dashboard
      </h1>

      <p className="text-gray-700 text-lg mb-6 leading-relaxed">
        The <strong>Bharat Garbage Dashboard</strong> is a data-driven social
        audit and visualization platform developed by{" "}
        <strong>The Metropolitan Institute</strong>. The platform is designed
        to identify, analyze, and address <strong>Garbage Vulnerable Points (GVPs)</strong>{" "}
        across urban and semi-urban regions in India, enabling evidence-based
        decision-making for civic authorities, civil society organizations, and
        community stakeholders.
      </p>

      <p className="text-gray-700 text-lg mb-6 leading-relaxed">
        The idea originated as a pilot initiative in collaboration with key
        members of <strong>Nagpur City Hub (NCH)</strong>, who were concerned
        about the persistent presence of GVPs in the city and the lack of
        systematic action to resolve them. Recognizing the need for credible
        data and structured analysis, the initiative evolved into a comprehensive
        platform jointly driven by Nagpur City Hub and The Metropolitan Institute.
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-4 text-gray-900">
        The Nagpur Pilot: Exercise and Impact
      </h2>

      <p className="text-gray-700 text-lg mb-6 leading-relaxed">
        The pilot exercise was conducted in the <strong>Dharampeth Zone of Nagpur</strong>.
        Through multiple deliberations, Nagpur City Hub members conceptualized
        the need for an evidence-based intervention. The Metropolitan Institute
        led the development of the survey tool, training of enumerators, data
        cleaning and analysis, policy brief creation, and the development of
        this interactive dashboard.
      </p>

      <p className="text-gray-700 text-lg mb-6 leading-relaxed">
        The <strong>Centre for Sustainable Development</strong> and the{" "}
        <strong>All India Institute of Local Self Government</strong> supported
        the initiative by providing key volunteers and enumerators for primary
        data collection. The survey led to the identification of{" "}
        <strong>113 Garbage Vulnerable Points</strong> in the zone.
      </p>

      <p className="text-gray-700 text-lg mb-6 leading-relaxed">
        The findings challenged conventional assumptions. Residents and
        passers-by emerged as the primary contributors to garbage accumulation,
        followed by gaps in waste collection services. The data also highlighted
        significant public health risks, including foul odours, mosquito
        breeding grounds, and unsafe living conditions around GVPs.
      </p>

      <p className="text-gray-700 text-lg mb-6 leading-relaxed">
        Upon presentation of the platform by Nagpur City Hub members and The
        Metropolitan Institute, the <strong>Nagpur Municipal Commissionerate</strong>{" "}
        initiated collaboration with key Hub partners such as{" "}
        <strong>Avniti Foundation</strong> to implement targeted interventions
        across several identified regions.
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-4 text-gray-900">
        Key Insights and Approach
      </h2>

      <p className="text-gray-700 text-lg mb-6 leading-relaxed">
        The analysis underscores the importance of differentiated interventions
        tailored to local conditions. Effective solutions require a combination
        of <strong>behavioral change initiatives</strong>,{" "}
        <strong>strengthened regulatory enforcement</strong>, and{" "}
        <strong>improved waste management logistics</strong>.
      </p>

      <p className="text-gray-700 text-lg mb-6 leading-relaxed">
        Citizen engagement data indicates a strong latent willingness among
        communities to participate in solutions, provided there is credible
        institutional support and clearly defined channels for engagement.
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-4 text-gray-900">
        Scaling Across India
      </h2>

      <p className="text-gray-700 text-lg mb-8 leading-relaxed">
        The Bharat Garbage Dashboard is now collaborating with various{" "}
        <strong>Civil Society Organizations (CSOs)</strong> and government bodies
        to identify, study, and resolve GVPs across different regions of India.
        The platform aims to serve as a replicable model for evidence-based urban
        governance and community-led sanitation improvements.
      </p>

      <div className="bg-gray-100 p-6 rounded-lg">
        <p className="text-gray-800 text-lg font-medium">
          Interested in conducting a similar exercise in your city, town, or
          village?
        </p>
        <p className="text-gray-700 text-lg mt-2">
          Reach out to us at{" "}
          <a
            href="mailto:namaste@themetropolitaninstitute.com"
            className="text-blue-600 font-semibold hover:underline"
          >
            namaste@themetropolitaninstitute.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default About;
