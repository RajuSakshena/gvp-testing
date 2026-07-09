import React from "react";
import ImageGallery from "react-image-gallery";

/* =======================
   IMAGE IMPORTS
   ======================= */

// additional
import additional1 from "./our-partner/additional1.jpeg";
import additional3 from "./our-partner/additional3.jpeg";
import additional4 from "./our-partner/additional4.jpeg";
import additional5 from "./our-partner/additional5.jpeg";
import additional6 from "./our-partner/additional6.jpeg";

// awards
import award3 from "./our-partner/award3.jpeg";

// clean
import clean2 from "./our-partner/clean2.jpeg";
import clean5 from "./our-partner/clean5.jpeg";
import clean6 from "./our-partner/clean6.jpeg";

// news
import news1 from "./our-partner/news1.jpeg";
import news2 from "./our-partner/news2.jpeg";
import news3 from "./our-partner/news3.jpeg";
import news4 from "./our-partner/news4.jpeg";
import news5 from "./our-partner/news5.jpeg";
import news6 from "./our-partner/news6.jpeg";
import news7 from "./our-partner/news7.jpeg";
import news8 from "./our-partner/news8.jpeg";
import news9 from "./our-partner/news9.jpeg";

// office
import office1 from "./our-partner/office1.jpeg";
import office2 from "./our-partner/office2.jpeg";
import office3 from "./our-partner/office3.jpeg";
import office4 from "./our-partner/office4.jpeg";
import office5 from "./our-partner/office5.jpeg";
import office6 from "./our-partner/office6.jpeg";
import office9 from "./our-partner/office9.jpeg";
import office10 from "./our-partner/office10.jpeg";
import office11 from "./our-partner/office11.jpeg";
import office12 from "./our-partner/office12.jpeg";
import office15 from "./our-partner/office15.jpeg";
import office16 from "./our-partner/office16.jpeg";

/* =======================
   GALLERY DATA (REACT-IMAGE-GALLERY FORMAT)
   ======================= */

const images = [
  additional1,
  additional3,
  additional4,
  additional5,
  additional6,
  award3,
  clean2,
  clean5,
  clean6,
  news1,
  news2,
  news3,
  news4,
  news5,
  news6,
  news7,
  news8,
  news9,
  office1,
  office2,
  office3,
  office4,
  office5,
  office6,
  office9,
  office10,
  office11,
  office12,
  office15,
  office16,
].map((img) => ({
  original: img,
  thumbnail: img,
}));

const Impact = () => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-4xl font-bold mb-2 text-gray-600">Our Impact</h1>
      <p className="text-gray-600 mb-10 text-lg">
        Moments from our journey, where thought capital, ground-level insights,
        and data-driven reflections are helping reduce Garbage Vulnerable Points.
      </p>

      {/* IMAGE GALLERY */}
      <div className="mb-16 rounded-2xl overflow-hidden shadow-2xl">
        <ImageGallery
          items={images}
          showPlayButton={true}
          showFullscreenButton={true}
          showNav={true}
          showThumbnails={true}
          autoPlay={true}
          slideInterval={3500}
          slideDuration={600}
          lazyLoad={true}
        />
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div className="p-6 bg-white rounded-xl shadow border">
          <h3 className="text-4xl font-extrabold text-blue-600 mb-2">10%</h3>
          <p className="text-gray-600">Reduction in illegal dumping</p>
        </div>

        <div className="p-6 bg-white rounded-xl shadow border">
          <h3 className="text-4xl font-extrabold text-blue-600 mb-2">113</h3>
          <p className="text-gray-600">Total GVPs monitored</p>
        </div>

        <div className="p-6 bg-white rounded-xl shadow border">
          <h3 className="text-4xl font-extrabold text-blue-600 mb-2">04</h3>
          <p className="text-gray-600">Active wards covered</p>
        </div>
      </div>
    </div>
  );
};

export default Impact;
